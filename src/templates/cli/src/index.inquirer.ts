import inquirer from 'inquirer';

import { hello } from './commands/hello.js';

const { name } = await inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'What is your name?',
    default: 'World',
  },
]);

hello(name);
