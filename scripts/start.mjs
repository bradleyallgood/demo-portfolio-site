// Asks whether to start the Docker containers, then stays attached to stream logs.
// Runs when VS Code opens this folder (.vscode/tasks.json), or with npm run dev.
// Before starting, it fixes or explains the usual first-run problems.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { ask } from './ask.mjs';

const root = path.join(import.meta.dirname, '..');
const PORTS = { db: 5432, web: 5173 };

const docker = (args, options) =>
  spawnSync('docker', args, { encoding: 'utf8', cwd: root, ...options });
const dockerRunning = () => docker(['info']).status === 0;
const lines = (text = '') => text.split(/\s+/).filter(Boolean);

function stop(message) {
  console.log(`\n${message}\n`);
  process.exit(1);
}

// The server reads .env for tests and local scripts. Containers work without it.
function ensureEnvFile() {
  const envFile = path.join(root, '.env');
  if (fs.existsSync(envFile)) return;
  fs.copyFileSync(path.join(root, '.env.example'), envFile);
  console.log('Created .env from .env.example.');
}

function startDockerDesktop() {
  console.log('Starting Docker Desktop. This can take a minute...');
  docker(['desktop', 'start', '--timeout', '180'], { stdio: 'inherit' });
  if (!dockerRunning()) {
    stop('Docker did not start. Open Docker Desktop, wait until it says it is running, then run npm run dev again.');
  }
}

// Something answering on the port means another program is using it.
function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

async function checkPorts(running) {
  const busy = [];
  for (const [service, port] of Object.entries(PORTS)) {
    if (!running.includes(service) && (await portInUse(port))) busy.push(port);
  }
  if (busy.length === 0) return;

  const reasons = {
    5432: '5432 is used by Postgres. Another Postgres may be installed or running on this computer.',
    5173: '5173 is used by Vite. Another copy of this site or another Vite project may be running.',
  };
  stop(
    `Another program is already using ${busy.length === 1 ? 'a port' : 'ports'} this project needs:\n` +
      busy.map((port) => `  - Port ${reasons[port]}`).join('\n') +
      '\nStop that program, or change the first number in the matching "ports" line in docker-compose.yml.',
  );
}

// After Docker Desktop restarts, a container can be left with no network, and the site can't
// reach the database (getaddrinfo ENOTFOUND db). Recreating the containers fixes it. Data is kept.
function repairContainers() {
  const ids = lines(docker(['compose', 'ps', '--all', '--quiet']).stdout);
  if (ids.length === 0) return;
  const networkCounts = lines(docker(['inspect', '--format', '{{len .NetworkSettings.Networks}}', ...ids]).stdout);
  if (!networkCounts.includes('0')) return;

  console.log('Found containers that lost their network connection. Recreating them. Your data is kept.');
  docker(['compose', 'down'], { stdio: 'inherit' });
}

ensureEnvFile();

if (docker(['--version']).error) {
  stop(
    'Docker is not installed, or it is not on your PATH. This project runs the site and the database in Docker.\n' +
      'Install Docker Desktop from https://www.docker.com/products/docker-desktop/, open it once, then run npm run dev again.',
  );
}

const runningServices = () =>
  dockerRunning() ? lines(docker(['compose', 'ps', '--status', 'running', '--services']).stdout) : [];
const webRunning = runningServices().includes('web');

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
repairContainers();
await checkPorts(runningServices());

console.log('Site: http://localhost:5173 (Ctrl+C stops the containers)');
console.log('The first start downloads and installs everything, so it can take a few minutes.\n');
const { status } = docker(['compose', 'up', '--build', '--watch'], { stdio: 'inherit' });
process.exit(status ?? 0);
