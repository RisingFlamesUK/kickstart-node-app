#!/usr/bin/env node

import { Command } from 'commander';
import pkg from '../package.json' assert { type: 'json' };
import chalk from 'chalk';
import runWebGenerator from '../generators/web/webgen.js';

const program = new Command();

program
  .name('kickstart-node-app')
  .description('🔧 Scaffold a new Node.js project (web or API)')
  .version(pkg.version)
  .showHelpAfterError(true);

// --- Top-level help enrichment ---
program.addHelpText(
  'after',
  `
${chalk.bold('Getting started')}
  Create a basic web app:
    $ kickstart-node-app web my-app

  With Postgres + sessions:
    $ kickstart-node-app web my-app --pg --session

  With Passport (Google + Local):
    $ kickstart-node-app web my-app --pg --session --passport google,local

  Non-interactive (CI) with a preset answers file:
    $ kickstart-node-app web my-app --answers-file ./preset.json --silent

${chalk.bold('Tip')}
  Run "${chalk.cyan('kickstart-node-app web --help')}" for detailed web options and examples.
`
);

const webCmd = program
  .command('web <project-name>')
  .description('Create a new Express web app')
  .option('--pg', 'Include PostgreSQL support')
  .option('--session', 'Enable session management (requires --pg)')
  .option('--axios', 'Include Axios for HTTP requests')
  .option(
    '--passport <strategies>',
    'Comma-separated list of Passport strategies (e.g. "local,google")'
  )
  .option('--port <number>', 'Set the default PORT (default: 3000)', '3000')
  .option('--dry-run', 'Print steps without writing files or installing')
  .option('--verbose', 'Enable detailed logging')
  .option('--silent', 'Run without prompts, using flags/defaults')
  .option(
    '--answers-file <path>',
    'JSON file with interactive answers (test/helper preset)'
  )
  .action(async (projectName, options) => {
    try {
      await runWebGenerator(projectName, {
        pg: options.pg,
        session: options.session,
        axios: options.axios,
        passport: options.passport,
        port: options.port,
        dryRun: options.dryRun,
        verbose: options.verbose,
        silent: options.silent,
        answersFile: options.answersFile,
      });
    } catch (err) {
      console.error(chalk.red.bold('\n❌ Error creating project:'), err?.message || err);
      process.exit(1);
    }
  });

// --- Per-command help enrichment (flags & examples) ---
webCmd.addHelpText(
  'after',
  `
${chalk.bold('Options (details)')}
  --pg
      Scaffold PostgreSQL integration (adds a Pool via "pg").
      Creates ${chalk.cyan('config/database.js')} and wires it into the app.

  --session
      Adds cookie-based session support via ${chalk.cyan('express-session')}.
      When used with --pg, session data is stored in Postgres via ${chalk.cyan('connect-pg-simple')}.
      Note: requires ${chalk.cyan('--pg')}.

  --axios
      Installs ${chalk.cyan('axios')} and includes a minimal usage example placeholder.

  --passport <strategies>
      Enables Passport.js and generates only the strategies you list.
      Supported strategies: ${chalk.cyan('local, bearer, google, facebook, twitter, microsoft, linkedin, steam, amazon')}
      Examples:
        ${chalk.gray('•')} Local only:          ${chalk.cyan('--passport local')}
        ${chalk.gray('•')} Google + Local:      ${chalk.cyan('--passport google,local')}
        ${chalk.gray('•')} Bearer + Facebook:   ${chalk.cyan('--passport bearer,facebook')}
      Note: requires ${chalk.cyan('--pg')} and ${chalk.cyan('--session')}.

  --port <number>
      Sets the default ${chalk.cyan('PORT')} in .env. Defaults to ${chalk.cyan('3000')}.

  --dry-run
      Prints what would be generated (files, dependencies) without writing or installing.

  --verbose
      Prints extra debug info (template roots, resolved options, etc).

  --silent
      Skips all interactive prompts and uses CLI flags / defaults.
      Useful for CI or scripted scaffolding.

  --answers-file <path>
      JSON file to pre-seed answers for non-interactive runs.
      Any CLI flags take precedence over values from this file.

${chalk.bold('Examples')}
  Basic app (no DB, no sessions):
    $ kickstart-node-app web my-app

  Postgres + sessions:
    $ kickstart-node-app web my-app --pg --session

  Passport Local:
    $ kickstart-node-app web my-app --pg --session --passport local

  Multiple strategies (Google, Facebook, Bearer):
    $ kickstart-node-app web my-app --pg --session --passport google,facebook,bearer

  Non-interactive with preset answers:
    $ kickstart-node-app web my-app --answers-file ./preset.json --silent

${chalk.bold('Notes')}
  • Some OAuth strategies require you to set client IDs/secrets in ${chalk.cyan('.env')}.
  • After generation, run ${chalk.cyan('npm run dev')} to start the app.
`
);

// Parse args
program.parse(process.argv);

// If no subcommand provided, show help (keeps behavior explicit)
if (!process.argv.slice(2).length) {
  console.log(chalk.yellowBright('\nℹ️  No command provided.\n'));
  program.help({ error: false });
}

// Friendly unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error(chalk.red.bold('\n❌ Unhandled error:'), err?.message || err);
  process.exit(1);
});
