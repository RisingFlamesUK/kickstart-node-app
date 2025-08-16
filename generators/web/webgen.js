// webgen.js
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

  // ---------------------------
  // Hybrid Mode: Interactive prompts if no flags
  // ---------------------------
  const noFlags =
    !options.pg &&
    !options.session &&
    !options.axios &&
    !options.passport &&
    !options.passportStrategies;

  if (noFlags) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of project?',
        choices: ['web'], // future: ['web', 'api']
        default: 'web',
      },
      { type: 'confirm', name: 'pg', message: 'Include PostgreSQL?', default: false },
      {
        type: 'confirm',
        name: 'session',
        message: 'Enable session management?',
        default: false,
        when: (a) => a.pg,
      },
      { type: 'confirm', name: 'axios', message: 'Include Axios?', default: false },
      {
        type: 'checkbox',
        name: 'passportStrategies',
        message: 'Select Passport strategies to include:',
        choices: [
          { name: 'local', value: 'local' },
          { name: 'bearer', value: 'bearer' },
          { name: 'google', value: 'google' },
          { name: 'facebook', value: 'facebook' },
          { name: 'twitter', value: 'twitter' },
          { name: 'microsoft', value: 'microsoft' },
          { name: 'linkedin', value: 'linkedin' },
          { name: 'steam', value: 'steam' },
          { name: 'amazon', value: 'amazon' },
        ],
        when: (a) => a.pg && a.session,
      },
    ]);
    Object.assign(options, answers);
  } else {
    // If passportStrategies provided as CLI flag (--passportStrategies=google,facebook)
    if (typeof options.passportStrategies === 'string') {
      options.passportStrategies = options.passportStrategies.split(',').map((s) => s.trim());
    }
  }

  // Prompt for PG credentials if PG enabled and missing any field
  if (options.pg) {
    const missing = ['pgUser', 'pgPassword', 'pgDatabase', 'pgHost', 'pgPort'].filter((key) => !options[key]);
    if (missing.length > 0) {
      const creds = await inquirer.prompt([
        { type: 'input', name: 'pgUser', message: 'Postgres username:', default: 'postgres', when: () => !options.pgUser },
        { type: 'input', name: 'pgPassword', message: 'Postgres password:', when: () => !options.pgPassword },
        { type: 'input', name: 'pgDatabase', message: 'Postgres database name:', when: () => !options.pgDatabase },
        { type: 'input', name: 'pgHost', message: 'Postgres host:', default: 'localhost', when: () => !options.pgHost },
        { type: 'input', name: 'pgPort', message: 'Postgres port:', default: '5432', when: () => !options.pgPort },
      ]);
      Object.assign(options, creds);
    }
  }

  // At this point, options are fully populated (via flags or prompts)

  const dry = options.dryRun;
  const logStep = (msg) => console.log(chalk.gray(`⏳ ${msg}${dry ? ' [skipped]' : ''}`));

  // ---------------------------
  // Static copies
  // ---------------------------
  const staticPaths = [
    ['base/public', 'public'],
    ['base/views', 'views'],
  ];
  for (const [from, to] of staticPaths) {
    logStep(`Copying static ${from} → ${to}`);
    if (!dry) await fs.copy(path.join(__dirname, '../../templates/web/static', from), path.join(projectDir, to));
  }

  // ---------------------------
  // Rendered templates
  // ---------------------------
  const renderTemplate = async (srcRel, destRel, data = {}) => {
    const src = path.join(__dirname, '../../templates/web/render', srcRel);
    const dest = path.join(projectDir, destRel);
    if (!dry) {
      const rendered = await ejs.renderFile(src, data);
      await fs.outputFile(dest, rendered);
    }
  };

  await renderTemplate('base/app.ejs', 'app.js', {
    usePg: options.pg,
    useSession: options.session,
    usePassport: options.passportStrategies?.length > 0,
  });

  await renderTemplate('base/env.ejs', '.env', {
    port: options.port || '3000',
    pgUser: options.pgUser || '',
    pgPassword: options.pgPassword || '',
    pgDatabase: options.pgDatabase || '',
    pgHost: options.pgHost || '',
    pgPort: options.pgPort || '',
    sessionSecret: 'replace-me-secret',
    passportStrategies: options.passportStrategies || [],
  });

  if (options.pg) {
    logStep('Rendering database.js...');
    await renderTemplate('pg/utils/database.ejs', 'utils/database.js', { useSession: options.session });
  }

  if (options.session && (!options.passportStrategies || options.passportStrategies.length === 0)) {
    logStep('Rendering encryption-handler.js...');
    await renderTemplate('session/utils/encryption-handler.ejs', 'utils/encryption-handler.js');
  }

  if (options.passportStrategies && options.passportStrategies.length > 0) {
    logStep('Rendering Passport strategies...');
    for (const strategy of options.passportStrategies) {
      await renderTemplate(`passport/config/passport-${strategy}.ejs`, `config/passport-${strategy}.js`);
    }
    await renderTemplate('passport/routes/auth.ejs', 'routes/auth.js');
    await renderTemplate('passport/utils/ensure-auth.ejs', 'utils/ensure-auth.js');
    if (options.passportStrategies.includes('bearer')) {
      await renderTemplate('passport/utils/token-store.ejs', 'utils/token-store.js');
    }
  }

  // ---------------------------
  // Dependencies
  // ---------------------------
  const deps = ['express', 'dotenv', 'ejs'];
  if (options.pg) deps.push('pg');
  if (options.session) deps.push('express-session', 'connect-pg-simple');
  if (options.axios) deps.push('axios');
  if (options.passportStrategies?.length > 0) {
    deps.push('passport', 'bcrypt', 'express-flash');
    if (options.passportStrategies.includes('local')) deps.push('passport-local');
    if (options.passportStrategies.includes('bearer')) deps.push('passport-http-bearer');
    if (options.passportStrategies.includes('google')) deps.push('passport-google-oauth20');
    if (options.passportStrategies.includes('facebook')) deps.push('passport-facebook');
    if (options.passportStrategies.includes('twitter')) deps.push('passport-twitter');
    if (options.passportStrategies.includes('microsoft')) deps.push('passport-microsoft');
    if (options.passportStrategies.includes('linkedin')) deps.push('passport-linkedin-oauth2');
    if (options.passportStrategies.includes('steam')) deps.push('passport-steam');
    if (options.passportStrategies.includes('amazon')) deps.push('passport-amazon');
  }

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
