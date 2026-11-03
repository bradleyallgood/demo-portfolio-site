import { createInterface } from 'node:readline';

// Yes/no prompt. Pressing Enter takes the default. If nothing can answer, the result is no.
export function ask(question, defaultYes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let result = false;

  return new Promise((resolve) => {
    rl.on('close', () => resolve(result));
    rl.question(`${question} ${defaultYes ? '[Y/n]' : '[y/N]'} `, (text) => {
      const answer = text.trim();
      result = answer ? /^y/i.test(answer) : defaultYes;
      rl.close();
    });
  });
}
