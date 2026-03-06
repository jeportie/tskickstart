import pc from 'picocolors';

export function startSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write(`${frames[0]}  ${text}`);

  const id = setInterval(() => {
    process.stdout.write(`\r${pc.cyan(frames[i++ % frames.length])}  ${text}`);
  }, 80);

  return (doneText) => {
    clearInterval(id);
    process.stdout.write(`\r\x1B[K${pc.green('✔')}  ${doneText}\n`);
  };
}
