// Asks whether to start the Docker containers, then stays attached to stream logs.
// Runs when VS Code opens this folder (.vscode/tasks.json), or with npm run dev.
import { spawnSync } from 'node:child_process';
import { ask } from './ask.mjs';

const docker = (args, options) => spawnSync('docker', args, { encoding: 'utf8', ...options });
const dockerRunning = () => docker(['info']).status === 0;

function startDockerDesktop() {
  console.log('Starting Docker Desktop. This can take a minute...');
  docker(['desktop', 'start', '--timeout', '180'], { stdio: 'inherit' });
  if (!dockerRunning()) {
    console.log('Docker Desktop did not start. Open it yourself, then run npm run dev.');
    process.exit(1);
  }
}

const webRunning =
  dockerRunning() &&
  docker(['compose', 'ps', '--status', 'running', '--services']).stdout.split(/\s+/).includes('web');

const start = webRunning
  ? await ask('The containers are already running. Reconnect live reload here?', false)
  : await ask('Start the project?', true);

if (!start) {
  console.log(
    webRunning
      ? 'Leaving them as they are: http://localhost:5173'
      : 'Not started. Run npm run dev when you want it.',
  );
  process.exit(0);
}

if (!dockerRunning()) startDockerDesktop();

console.log('Site: http://localhost:5173 (Ctrl+C stops the containers)\n');
const { status } = docker(['compose', 'up', '--build', '--watch'], { stdio: 'inherit' });
process.exit(status ?? 0);
