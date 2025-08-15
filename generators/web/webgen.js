// Updated webgen.js with --passport strategy support
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import ejs from 'ejs';
import inquirer from 'inquirer';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function runWebGenerator(projectName, options) {
  const projectDir = path.join(process.cwd(), projectName);

  console.log(chalk.cyan.bold(`\n🚀 Kickstart Node — Create a ready-to-run Node.js web project\n`));

  if (options.verbose) {
    console.log(chalk.gray('🔍 Debug options:'), chalk.yellow(JSON.stringify(options, null, 2)));
  }

  console.log(chalk.cyan.bold(`📁 Creating new project: ${projectName}\n`));

  // Guards
  if (options.session && !options.pg) {
    console.log(chalk.red('⚠️  Session requires PostgreSQL. Ignoring session option.\n'));
    options.session = false;
  }
  if (options.passport && (!options.pg || !options.session)) {
    console.log(chalk.red('⚠️  Passport requires both PostgreSQL and sessions. Disabling passport.\n'));
    options.passport = false;
  }

  // Prompt for missing features
  if (!options.pg && !options.session && !options.axios) {
    const answers = await inquirer.prompt([
      { type: 'confirm', name: 'pg', message: chalk.yellow('Include PostgreSQL?'), default: false },
      { type: 'confirm', name: 'session', message: chalk.yellow('Enable session management?'), default: false, when: (a) => a.pg },
      { type: 'confirm', name: 'axios', message: chalk.yellow('Include Axios?'), default: false },
      { type: 'confirm', name: 'passport', message: chalk.yellow('Use Passport.js authentication?'), default: false, when: (a) => a.pg && a.session },
    ]);
    Object.assign(options, answers);
  }

  if (options.pg) {
    const missing = ['pgUser', 'pgPassword', 'pgDatabase', 'pgHost', 'pgPort'].filter((key) => !options[key]);
    if (missing.length > 0) {
      const pgAnswers = await inquirer.prompt([
        { type: 'input', name: 'pgUser', message: 'Postgres username:', default: 'postgres' },
        { type: 'input', name: 'pgPassword', message: 'Postgres password:' },
        { type: 'input', name: 'pgDatabase', message: 'Postgres database name:' },
        { type: 'input', name: 'pgHost', message: 'Postgres host:', default: 'localhost' },
        { type: 'input', name: 'pgPort', message: 'Postgres port:', default: '5432' },
      ]);
      Object.assign(options, pgAnswers);
    }
  }

  const dry = options.dryRun;
  const logStep = (msg) => console.log(chalk.gray(`⏳ ${msg}${dry ? ' [skipped]' : ''}`));

  // Static copies
  const staticPaths = [ ['base/public', 'public'], ['base/views', 'views'] ];
  for (const [from, to] of staticPaths) {
    logStep(`Copying static ${from} → ${to}`);
    if (!dry) await fs.copy(path.join(__dirname, '../../templates/web/static', from), path.join(projectDir, to));
  }

  // Rendered templates
  const renderTemplate = async (srcRel, destRel, data = {}) => {
    const src = path.join(__dirname, '../../templates/web/render', srcRel);
    const dest = path.join(projectDir, destRel);
    if (!dry) {
      const rendered = await ejs.renderFile(src, data);
      await fs.outputFile(dest, rendered);
    }
  };

  await renderTemplate('base/app.ejs', 'app.js', { usePg: options.pg, useSession: options.session });
  await renderTemplate('base/env.ejs', '.env', {
    port: options.port || '3000',
    pgUser: options.pgUser || '',
    pgPassword: options.pgPassword || '',
    pgDatabase: options.pgDatabase || '',
    pgHost: options.pgHost || '',
    pgPort: options.pgPort || '',
    sessionSecret: 'replace-me-secret'
  });

  if (options.pg) {
    logStep('Rendering database.js...');
    await renderTemplate('pg/utils/database.ejs', 'utils/database.js', { useSession: options.session });
  }

  if (options.session && !options.passport) {
    logStep('Rendering encryption-handler.js...');
    await renderTemplate('session/utils/encryption-handler.ejs', 'utils/encryption-handler.js');
  }

  if (options.passport) {
    logStep('Rendering Passport strategy...');
    await renderTemplate('passport/utils/passport-local.ejs', 'utils/passport-local.js');
    await renderTemplate('passport/routes/auth.ejs', 'routes/auth.js');
  }

  // Dependencies
  const deps = ['express', 'dotenv', 'ejs'];
  if (options.pg) deps.push('pg');
  if (options.session) deps.push('express-session', 'connect-pg-simple');
  if (options.axios) deps.push('axios');
  if (options.passport) deps.push('passport', 'passport-local', 'bcrypt', 'express-flash');

  if (!dry) {
    logStep('Initializing npm...');
    await execa('npm', ['init', '-y'], { cwd: projectDir });

    logStep('Patching package.json...');
    const pkgPath = path.join(projectDir, 'package.json');
    const pkgJson = await fs.readJson(pkgPath);
    pkgJson.type = 'module';
    pkgJson.scripts = pkgJson.scripts || {};
    pkgJson.scripts.dev = 'node app.js';
    pkgJson.scripts.start = pkgJson.scripts.start || 'node app.js';
    await fs.writeJson(pkgPath, pkgJson, { spaces: 2 });

    logStep('Installing dependencies...');
    await execa('npm', ['install', ...deps], { cwd: projectDir, stdio: 'inherit' });
  }

  if (!dry) {
    logStep('Initializing Git...');
    await fs.writeFile(path.join(projectDir, '.gitignore'), `.env\nnode_modules\n.DS_Store`);
    await execa('git', ['init'], { cwd: projectDir });
    await execa('git', ['add', '.'], { cwd: projectDir });
    await execa('git', ['commit', '-m', 'Initial commit'], { cwd: projectDir });
  }

  console.log(chalk.greenBright.bold(`\n✅ Project "${projectName}" ${dry ? 'ready to generate' : 'created successfully!'}\n`));
  console.log(chalk.gray('👉 Next steps:\n'));
  console.log(`  ${chalk.cyan(`cd ${projectName}`)}`);
  console.log(`  ${chalk.cyan('npm run dev')}`);
}
