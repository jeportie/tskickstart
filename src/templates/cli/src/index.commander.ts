import { Command } from 'commander';

import { hello } from './commands/hello.js';

const program = new Command();

program
  .name('my-cli')
  .description('A CLI tool built with commander')
  .version('0.0.0');

program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'name to greet', 'World')
  .action(hello);

program.parse();
