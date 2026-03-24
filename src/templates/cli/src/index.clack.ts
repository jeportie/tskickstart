import { intro, outro, text } from '@clack/prompts';

import { hello } from './commands/hello.js';

intro('Welcome!');

const name = await text({
  message: 'What is your name?',
  placeholder: 'World',
  defaultValue: 'World',
});

if (typeof name === 'string') {
  hello(name);
}

outro('Done!');
