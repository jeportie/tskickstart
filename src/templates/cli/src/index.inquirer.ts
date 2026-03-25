import inquirer from 'inquirer';

import { hello } from './commands/hello.js';

async function main(): Promise<void> {
  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'What is your name?',
      default: 'World',
    },
  ]);

  hello(name);
}

void main();
