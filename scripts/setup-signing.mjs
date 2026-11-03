// Makes sure commits in this repo are signed, and that GitHub rejects any that aren't.
// Reuses an existing SSH signing key if there is one, otherwise creates one and uploads it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ask } from './ask.mjs';

const BRANCH = 'main';
const NEW_KEY_PATH = path.join(os.homedir(), '.ssh', 'id_ed25519_signing');
const GH_WINDOWS_PATH = 'C:\\Program Files\\GitHub CLI\\gh.exe';

const run = (command, args, options) => spawnSync(command, args, { encoding: 'utf8', ...options });
const git = (...args) => run('git', args).stdout?.trim() ?? '';
const expandHome = (file) => file.replace(/^~/, os.homedir());

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function isUsableKey(publicKey) {
  return (
    fs.existsSync(publicKey) &&
    fs.existsSync(publicKey.replace(/\.pub$/, '')) &&
    fs.readFileSync(publicKey, 'utf8').startsWith('ssh-')
  );
}

function findKey() {
  const configured = git('config', 'user.signingkey');
  const candidates = [
    git('config', 'gpg.format') === 'ssh' && configured,
    `${NEW_KEY_PATH}.pub`,
    path.join(os.homedir(), '.ssh', 'id_ed25519.pub'),
  ];
  return candidates.filter(Boolean).map(expandHome).find(isUsableKey);
}

function createKey(email) {
  console.log('No signing key found. Creating one. A passphrase is recommended.');
  fs.mkdirSync(path.dirname(NEW_KEY_PATH), { recursive: true });
  const { status } = run('ssh-keygen', ['-t', 'ed25519', '-C', email, '-f', NEW_KEY_PATH], {
    stdio: 'inherit',
  });
  if (status !== 0) fail('Could not create a key.');
  return `${NEW_KEY_PATH}.pub`;
}

function configureRepo(publicKey) {
  git('config', '--local', 'gpg.format', 'ssh');
  git('config', '--local', 'user.signingkey', publicKey);
  git('config', '--local', 'commit.gpgsign', 'true');
  git('config', '--local', 'tag.gpgsign', 'true');
}

// Git needs this file to verify SSH signatures locally.
function trustKey(email, publicKey) {
  const [type, blob] = fs.readFileSync(publicKey, 'utf8').trim().split(/\s+/);
  const file = expandHome(
    git('config', 'gpg.ssh.allowedSignersFile') || path.join(os.homedir(), '.ssh', 'allowed_signers'),
  );
  const entry = `${email} ${type} ${blob}`;
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

  if (!existing.includes(entry)) {
    const separator = existing && !existing.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(file, `${existing}${separator}${entry}\n`);
  }
  git('config', '--local', 'gpg.ssh.allowedSignersFile', file);
  return blob;
}

// Signs a throwaway commit object. No branch points at it, so history is untouched.
function testSigning() {
  const commit = run('git', ['commit-tree', 'HEAD^{tree}', '-S', '-m', 'Signing test']);
  if (commit.status !== 0) {
    fail(`Signing failed:\n${commit.stderr}\nIf the key has a passphrase, add it with: ssh-add`);
  }
  if (run('git', ['verify-commit', commit.stdout.trim()]).status !== 0) {
    fail('A test commit was signed but could not be verified.');
  }
}

function findRepo() {
  const match = git('remote', 'get-url', 'origin').match(/github\.com[/:]([^/]+)\/(.+?)(\.git)?$/);
  if (!match) fail('The origin remote is not a GitHub repo.');
  return { owner: match[1], name: match[2] };
}

async function isOnGitHub(owner, blob) {
  const res = await fetch(`https://api.github.com/users/${owner}/ssh_signing_keys`, {
    headers: { 'User-Agent': 'setup-signing' },
  });
  if (!res.ok) fail(`Could not read your GitHub keys: ${res.status}`);
  return (await res.json()).some(({ key }) => key.includes(blob));
}

async function findGh() {
  const found = () => {
    if (run('gh', ['--version']).status === 0) return 'gh';
    return fs.existsSync(GH_WINDOWS_PATH) ? GH_WINDOWS_PATH : null;
  };
  if (found()) return found();

  const hint = 'Install it from https://cli.github.com, then run npm run signing again.';
  if (process.platform !== 'win32') fail(`The GitHub CLI is required. ${hint}`);
  if (!(await ask('The GitHub CLI is required. Install it with winget?', true))) fail(hint);

  run('winget', ['install', '--id', 'GitHub.cli', '-e', '--source', 'winget'], { stdio: 'inherit' });
  return found() ?? fail(`The GitHub CLI did not install. ${hint}`);
}

function ensureLogin(gh, scopes) {
  const args = run(gh, ['auth', 'status']).status === 0
    ? ['auth', 'refresh', '-h', 'github.com', '-s', scopes]
    : ['auth', 'login', '-h', 'github.com', '-p', 'https', '-w', '-s', scopes];
  if (run(gh, args, { stdio: 'inherit' }).status !== 0) fail('GitHub login failed.');
}

function upload(gh, publicKey) {
  const title = `${os.hostname()} signing key`;
  const { status, stderr } = run(gh, ['ssh-key', 'add', publicKey, '--type', 'signing', '--title', title]);
  if (status !== 0) fail(`Could not upload the key:\n${stderr}`);
}

function requireSignedCommits(gh, { owner, name }) {
  const protection = `repos/${owner}/${name}/branches/${BRANCH}/protection`;
  const signatures = run(gh, ['api', `${protection}/required_signatures`]);
  if (signatures.status === 0 && JSON.parse(signatures.stdout).enabled) return false;

  // Only create a rule if none exists, so existing settings aren't overwritten.
  if (run(gh, ['api', protection]).status !== 0) {
    const body = JSON.stringify({
      required_status_checks: null,
      enforce_admins: true, // Without this, the repo owner can skip the rule.
      required_pull_request_reviews: null,
      restrictions: null,
    });
    const created = run(gh, ['api', '-X', 'PUT', protection, '--input', '-'], { input: body });
    if (created.status !== 0) fail(`Could not protect ${BRANCH}:\n${created.stderr}`);
  }

  const enabled = run(gh, ['api', '-X', 'POST', `${protection}/required_signatures`]);
  if (enabled.status !== 0) fail(`Could not require signed commits:\n${enabled.stderr}`);
  return true;
}

const email = git('config', 'user.email');
if (!email) fail('Set your git email first: git config user.email "you@example.com"');

const existingKey = findKey();
const publicKey = existingKey ?? createKey(email);
console.log(`${existingKey ? 'Found signing key' : 'Created signing key'}: ${publicKey}`);

configureRepo(publicKey);
const blob = trustKey(email, publicKey);
testSigning();
console.log('Signing works, and this repo now signs every commit and tag.');

const repo = findRepo();
const keyUploaded = await isOnGitHub(repo.owner, blob);
console.log(keyUploaded ? 'Key is already on GitHub.' : 'Key is not on GitHub yet.');

const gh = await findGh();
ensureLogin(gh, keyUploaded ? 'repo' : 'repo,admin:ssh_signing_key');

if (!keyUploaded) {
  upload(gh, publicKey);
  console.log('Key uploaded to GitHub as a signing key.');
}

const changed = requireSignedCommits(gh, repo);
console.log(
  changed
    ? `GitHub now rejects unsigned commits on ${BRANCH}.`
    : `GitHub already rejects unsigned commits on ${BRANCH}.`,
);
