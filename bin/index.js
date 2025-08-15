#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import runWebGenerator from '../generators/web/webgen.js';
// import runApiGenerator from '../generators/api/apigen.js'; // (optional)

const program = new Command();

program
  .name('kickstart-node')
  .description('🔧 Scaffold a new Node.js project (web or API)')
  .version('1.0.0');

program
  .command('web <project-name>')
  .description('Create a new Express web app')
  .option('--pg', 'Include PostgreSQL support')
  .option('--session', 'Enable session management (requires --pg)')
  .option('--axios', 'Include Axios for HTTP requests')
  .option('--port <number>', 'Set the default PORT (default: 3000)', '3000')
  .option('--dry-run', 'Print steps without writing files or installing')
  .option('--verbose', 'Enable detailed logging')
  .action(async (projectName, options) => {
    try {
      await runWebGenerator(projectName, {
        pg: !!options.pg,
        session: !!options.session,
        axios: !!options.axios,
        port: options.port || '3000',
        dryRun: !!options.dryRun,
        verbose: !!options.verbose
      });
    } catch (err) {
      console.error(chalk.red.bold('❌ Error creating project:'), err.message);
      process.exit(1);
    }
  });

// Future API command (example structure)
/*
program
  .command('api <project-name>')
  .description('Create a new API-only project')
  .option('--pg', 'Include PostgreSQL support')
  .option('--axios', 'Include Axios')
  .option('--dry-run', 'Print steps without writing files or installing')
  .option('--verbose', 'Enable detailed logging')
  .action(async (projectName, options) => {
    try {
      await runApiGenerator(projectName, {
        pg: !!options.pg,
        axios: !!options.axios,
        dryRun: !!options.dryRun,
        verbose: !!options.verbose
      });
    } catch (err) {
      console.error(chalk.red.bold('❌ Error creating API project:'), err.message);
      process.exit(1);
    }
  });
*/

program.parse(process.argv);

// If no command was given:
if (!process.argv.slice(2).length) {
  console.log(chalk.yellowBright('\n🚧 No command provided.'));
  program.help();
}
