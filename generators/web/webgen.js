import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import ejs from 'ejs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { buildNextStepsMd } from './lib/next-steps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strategy → template filename + output filename
// template: file under templates/web/render/passport/config
// out: file written to <project>/config
const PASSPORT_TEMPLATES = {
  local: { template: 'passport-local.ejs', out: 'passport-local.js' },
  bearer: { template: 'passport-bearer.ejs', out: 'passport-bearer.js' },

  // OAuth 2.0 strategies (new naming convention)
  google: { template: 'passport-google-oauth20.ejs', out: 'passport-google-oauth20.js' },
  facebook: { template: 'passport-facebook-oauth20.ejs', out: 'passport-facebook-oauth20.js' },
  twitter: { template: 'passport-twitter-oauth20.ejs', out: 'passport-twitter-oauth20.js' },
  microsoft: { template: 'passport-microsoft-oauth20.ejs', out: 'passport-microsoft-oauth20.js' },
  linkedin: { template: 'passport-linkedin-oauth20.ejs', out: 'passport-linkedin-oauth20.js' },
  steam: { template: 'passport-steam-oauth20.ejs', out: 'passport-steam-oauth20.js' },
  amazon: { template: 'passport-amazon-oauth20.ejs', out: 'passport-amazon-oauth20.js' },
};

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function runWebGenerator(projectName, options) {
  const projectDir = path.join(process.cwd(), projectName);
  const TEMPLATES_ROOT = path.resolve(__dirname, '../../templates/web');
  const STATIC_ROOT = path.join(TEMPLATES_ROOT, 'static');
  const RENDER_ROOT = path.join(TEMPLATES_ROOT, 'render');

  // helpful debug
  if (options.verbose) {
    console.log(chalk.gray('🧭 Template roots:'));
    console.log(chalk.gray('   STATIC_ROOT:'), STATIC_ROOT);
    console.log(chalk.gray('   RENDER_ROOT:'), RENDER_ROOT);
  }

  // pre-seed interactive answers from file (for tests)
  if (options.answersFile) {
    const answersPath = path.isAbsolute(options.answersFile)
      ? options.answersFile
      : path.join(process.cwd(), options.answersFile);
    const seeded = await fs.readJson(answersPath);
    // Merge, but do not clobber explicit CLI flags
    for (const [k, v] of Object.entries(seeded)) {
      if (options[k] === undefined) options[k] = v;
    }
    // Avoid prompts when a preset file is supplied
    if (options.silent === undefined) options.silent = true;
  }

  // Now coerce booleans AFTER merging
  const bool = (v) => (v === undefined ? false : Boolean(v));
  options.pg = bool(options.pg);
  options.session = bool(options.session);
  options.axios = bool(options.axios);
  options.dryRun = bool(options.dryRun);
  options.verbose = bool(options.verbose);
  options.silent = bool(options.silent);

  // verify existence before copying
  const requiredStaticDirs = [
    path.join(STATIC_ROOT, 'base/public'),
    path.join(STATIC_ROOT, 'base/views'),
  ];
  for (const dir of requiredStaticDirs) {
    if (!(await fs.pathExists(dir))) {
      throw new Error(
        `Template folder missing: ${dir}\n` +
          `Make sure your linked package contains templates/web/static/base/{public,views}.`
      );
    }
  }

  const projSlug = slugify(projectName || 'app');

  console.log(chalk.cyan.bold(`\n🚀 Kickstart Node — Create a ready-to-run Node.js web project\n`));
  if (options.verbose) {
    console.log(chalk.gray('🔍 Debug options:'), chalk.yellow(JSON.stringify(options, null, 2)));
  }
  console.log(chalk.cyan.bold(`📁 Creating new project: ${projectName}\n`));

  // Normalize + auto-enable first
  const passportRequested =
    (typeof options.passport === 'string' && options.passport.trim().length > 0) ||
    (Array.isArray(options.passportChoices) && options.passportChoices.length > 0) ||
    options.usePassport === true;

  if (passportRequested && (!options.pg || !options.session)) {
    console.log(chalk.yellow('ℹ️  Passport selected — enabling PostgreSQL and sessions.'));
    options.pg = true;
    options.session = true;
  }

  // Guard any remaining odd combos
  if (options.session && !options.pg) {
    console.log(chalk.yellow('ℹ️  Sessions require PostgreSQL — enabling PostgreSQL.'));
    options.pg = true;
  }

  // Build passportStrategies from either --passport string OR preset passportChoices
  let passportStrategies = [];
  if (typeof options.passport === 'string' && options.passport.trim()) {
    passportStrategies = options.passport
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (passportStrategies.length === 0 && Array.isArray(options.passportChoices) && options.passportChoices.length) {
    passportStrategies = options.passportChoices.map((s) => s.toLowerCase());
  }

  // Interactive prompts only if NOT silent
  if (!options.silent) {
    // If no feature flags at all, ask
    if (!options.pg && !options.session && !options.axios && passportStrategies.length === 0) {
      const answers = await inquirer.prompt([
        { type: 'confirm', name: 'pg', message: chalk.yellow('Include PostgreSQL?'), default: false },
        {
          type: 'confirm',
          name: 'session',
          message: chalk.yellow('Enable session management?'),
          default: false,
          when: (a) => a.pg,
        },
        { type: 'confirm', name: 'axios', message: chalk.yellow('Include Axios?'), default: false },
        { type: 'confirm', name: 'usePassport', message: chalk.yellow('Use Passport.js authentication?'), default: false },
        {
          type: 'checkbox',
          name: 'passportChoices',
          message: chalk.yellow('Select Passport strategies to include:'),
          when: (a) => a.usePassport,
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
        },
      ]);
      Object.assign(options, { pg: answers.pg, session: answers.session, axios: answers.axios });

      if (answers.usePassport) {
        options.pg = true;
        options.session = true;
      }
      if (answers.usePassport && Array.isArray(answers.passportChoices)) {
        passportStrategies.splice(0, passportStrategies.length, ...answers.passportChoices);
      }
    }

    // If PG selected, ensure credentials (ask only for missing ones)
    if (options.pg) {
      const missing = ['pgUser', 'pgPassword', 'pgDatabase', 'pgHost', 'pgPort'].filter((k) => !options[k]);
      if (missing.length > 0) {
        const pgAnswers = await inquirer.prompt([
          { type: 'input', name: 'pgUser', message: 'Postgres username:', default: options.pgUser || 'postgres', when: () => !options.pgUser },
          { type: 'password', name: 'pgPassword', message: 'Postgres password:', mask: '*', when: () => !options.pgPassword },
          { type: 'input', name: 'pgDatabase', message: 'Postgres database name:', default: options.pgDatabase || projSlug, when: () => !options.pgDatabase },
          { type: 'input', name: 'pgHost', message: 'Postgres host:', default: options.pgHost || 'localhost', when: () => !options.pgHost },
          { type: 'input', name: 'pgPort', message: 'Postgres port:', default: options.pgPort || '5432', when: () => !options.pgPort },
        ]);
        Object.assign(options, pgAnswers);
      }
    }
  } else {
    // --silent: no prompts, apply sane defaults if needed
    if (options.pg) {
      options.pgUser = options.pgUser || 'postgres';
      options.pgHost = options.pgHost || 'localhost';
      options.pgPort = options.pgPort || '5432';
      options.pgDatabase = options.pgDatabase || projSlug;
      options.pgPassword = options.pgPassword || '';
    }
  }

  const dry = options.dryRun;
  const logStep = (msg) => console.log(chalk.gray(`⏳ ${msg}${dry ? ' [skipped]' : ''}`));

  // ---------------------------
  // Static copies
  // ---------------------------
  const staticPairs = [
    ['base/public', 'public'],
    ['base/views', 'views'],
  ];
  for (const [from, to] of staticPairs) {
    logStep(`Copying static ${from} → ${to}`);
    if (!dry) {
      const src = path.join(STATIC_ROOT, from);
      const dest = path.join(projectDir, to);
      await fs.copy(src, dest);
    }
  }

  // ---------------------------
  // Rendered templates
  // ---------------------------
  const renderTemplate = async (srcRel, destRel, data = {}) => {
    const src = path.join(RENDER_ROOT, srcRel);
    const dest = path.join(projectDir, destRel);
    if (!dry) {
      const rendered = await ejs.renderFile(src, data);
      await fs.outputFile(dest, rendered);
    }
  };

  await renderTemplate('base/app.ejs', 'app.js', {
    usePg: options.pg,
    useSession: options.session,
    usePassport: passportStrategies.length > 0,
    passportStrategies,
  });

  // .env with placeholders & commented sections
  await renderTemplate('base/env.ejs', '.env', {
    port: options.port || '3000',
    usePg: !!options.pg,
    pgUser: options.pgUser || '',
    pgPassword: options.pgPassword || '',
    pgDatabase: options.pgDatabase || '',
    pgHost: options.pgHost || '',
    pgPort: options.pgPort || '',
    useSession: !!options.session,
    usePassport: passportStrategies.length > 0,
    passportStrategies,
    projectSlug: projSlug,
  });

  if (options.pg) {
    logStep('Rendering database.js...');
    await renderTemplate('pg/config/database.ejs', 'config/database.js', { useSession: options.session });
  }

  // If sessions but no passport, keep the simple encryption handler
  if (options.session && passportStrategies.length === 0) {
    logStep('Rendering encryption-handler.js...');
    await renderTemplate('session/utils/encryption-handler.ejs', 'utils/encryption-handler.js');
  }

  // Passport scaffolding (mapping-driven)
  if (passportStrategies.length > 0) {
    logStep('Rendering Passport strategies...');

    for (const strat of passportStrategies) {
      const meta = PASSPORT_TEMPLATES[strat];
      if (!meta) {
        console.log(chalk.yellow(`⚠️  Unknown passport strategy "${strat}" — skipping.`));
        continue;
      }
      await renderTemplate(path.join('passport/config', meta.template), path.join('config', meta.out), {
        port: options.port || '3000',
      });

      // Bearer needs token store util
      if (strat === 'bearer') {
        await renderTemplate('passport/utils/token-store.ejs', 'utils/token-store.js', {});
      }
    }

    // Always render shared auth route(s)
    await renderTemplate('passport/routes/auth.ejs', 'routes/auth.js', { passportStrategies });

    // Always render login page
    await renderTemplate('passport/views/login.ejs', 'views/login.ejs', { passportStrategies });

    // When auth exists, overwrite the base header with the auth-aware header
    await renderTemplate('passport/views/partials/header-auth.ejs', 'views/partials/header.ejs', {
      passportStrategies,
    });

    // Render register page if local passport strategy supported
    if (passportStrategies.includes('local')) {
      await renderTemplate('passport/views/register.ejs', 'views/register.ejs', {});
    }
  }

  // ---------------------------
  // Dependencies
  // ---------------------------
  const deps = ['express', 'dotenv', 'ejs'];
  if (options.pg) deps.push('pg');
  if (options.session) deps.push('express-session', 'connect-pg-simple');
  if (options.axios) deps.push('axios');
  if (passportStrategies.length > 0) {
    deps.push('passport', 'bcrypt');
    if (passportStrategies.includes('local')) deps.push('passport-local');
    if (passportStrategies.includes('bearer')) deps.push('passport-http-bearer');
    if (passportStrategies.includes('google')) deps.push('passport-google-oauth20');
    if (passportStrategies.includes('facebook')) deps.push('passport-facebook');
    if (passportStrategies.includes('twitter')) deps.push('passport-twitter');
    if (passportStrategies.includes('microsoft')) deps.push('passport-azure-ad'); // package name
    if (passportStrategies.includes('linkedin')) deps.push('passport-linkedin-oauth2'); // package name
    if (passportStrategies.includes('steam')) deps.push('passport-steam');
    if (passportStrategies.includes('amazon')) deps.push('passport-amazon');

    logStep('Rendering user-store.js...');
    await renderTemplate('passport/config/user-store.ejs', 'config/user-store.js', {});
  }

  console.log(chalk.gray('\n📦 Dependencies to install:'));
  console.log(chalk.magentaBright('→'), deps.join(', '));

  // npm init & scripts
  if (!dry) {
    logStep('Initializing npm...');
    await execa('npm', ['init', '-y'], { cwd: projectDir });

    logStep('Patching package.json...');
    const pkgPath = path.join(projectDir, 'package.json');
    const pkgJson = await fs.readJson(pkgPath);
    pkgJson.type = 'module';
    pkgJson.scripts = pkgJson.scripts || {};
    // Try to use nodemon if available; otherwise just node
    const nodemonAvailable = await isNodemonAvailable();
    pkgJson.scripts.dev = nodemonAvailable ? 'nodemon app.js' : 'node app.js';
    pkgJson.scripts.start = pkgJson.scripts.start || 'node app.js';
    await fs.writeJson(pkgPath, pkgJson, { spaces: 2 });

    logStep('Installing dependencies...');
    await execa('npm', ['install', ...deps], { cwd: projectDir, stdio: 'inherit' });
  }

  // Git
  if (!dry) {
    logStep('Initializing Git...');
    await fs.writeFile(
      path.join(projectDir, '.gitignore'),
      `.env
node_modules
.DS_Store
`
    );
    await execa('git', ['init'], { cwd: projectDir });
    await execa('git', ['add', '.'], { cwd: projectDir });
    await execa('git', ['commit', '-m', 'Initial commit'], { cwd: projectDir });
  }

  // Post-gen checklist if placeholders likely remain
  const checklist = [];
  if (options.pg && !options.pgPassword) {
    checklist.push('Set a value for PG_PASS in .env');
  }
  if (
    passportStrategies.some((s) =>
      ['google', 'facebook', 'twitter', 'microsoft', 'linkedin', 'steam', 'amazon'].includes(s)
    )
  ) {
    checklist.push('Fill in OAuth client IDs/secrets and callback URLs in .env (they are commented placeholders).');
  }
  if (options.session) {
    checklist.push('Optionally set SESSION_SECRET in .env (otherwise a random secret is generated at runtime).');
  }

  // Generate NEXT_STEPS.md
  if (!dry) {
    const nextSteps = buildNextStepsMd({
      projectName,
      port: options.port || '3000',
      options,
      passportStrategies,
    });
    await fs.writeFile(path.join(projectDir, 'NEXT_STEPS.md'), nextSteps);
  }

  console.log(chalk.greenBright.bold(`\n✅ Project "${projectName}" ${dry ? 'ready to generate' : 'created successfully!'}\n`));
  if (checklist.length) {
    console.log(chalk.yellow('⚠️  Next steps (required for full functionality):'));
    checklist.forEach((item) => console.log(`  • ${item}`));
    console.log();
  }
  console.log(chalk.gray('👉 Next steps:\n'));
  console.log(`  ${chalk.cyan(`cd ${projectName}`)}`);
  console.log(`  ${chalk.cyan('npm run dev')}`);
}

// Utility: detect global/local nodemon
async function isNodemonAvailable() {
  try {
    await execa('nodemon', ['--version']);
    return true;
  } catch {
    return false;
  }
}
