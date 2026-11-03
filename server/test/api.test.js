import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';

const TEST_EMAIL = 'visitor@test.invalid';
const valid = { name: 'Ada', email: TEST_EMAIL, message: 'Hello, I would like to talk.' };

let server;
let base;
let notified;

const post = (body) =>
  fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const savedCount = async () => {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM contact_messages WHERE email = $1', [
    TEST_EMAIL,
  ]);
  return rows[0].n;
};

const clearSaved = () => pool.query('DELETE FROM contact_messages WHERE email = $1', [TEST_EMAIL]);

before(async () => {
  const app = createApp({
    db: pool,
    notify: async (values) => notified.push(values),
    contactLimit: 1000,
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
});

beforeEach(async () => {
  notified = [];
  await clearSaved();
});

after(async () => {
  await clearSaved();
  server.close();
  await pool.end();
});

test('GET /api/profile returns seeded content with grouped skills', async () => {
  const res = await fetch(`${base}/api/profile`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(typeof body.profile.name, 'string');
  assert.equal(body.profile.email, undefined);
  assert.equal(typeof body.profile.petsAbout, 'string');
  assert.ok(Array.isArray(body.skills[0].items));
  assert.ok(Array.isArray(body.projects[0].tech));
  assert.equal(typeof body.projects[0].featured, 'boolean');
  assert.equal(typeof body.pets[0].imageUrl, 'string');
  assert.equal(typeof body.pets[0].alt, 'string');
  assert.equal(typeof body.hobbies[0].imageUrl, 'string');
});

const built = fs.existsSync(path.join(import.meta.dirname, '../../client/dist/index.html'));

test('page URLs serve the app, and missing assets stay 404', { skip: !built }, async () => {
  const page = await fetch(`${base}/projects`);
  const asset = await fetch(`${base}/assets/missing.js`);

  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.equal(asset.status, 404);
});

test('a valid contact message is saved and triggers a notification', async () => {
  const res = await post(valid);

  assert.equal(res.status, 201);
  assert.equal(await savedCount(), 1);
  assert.equal(notified.length, 1);
  assert.equal(notified[0].email, TEST_EMAIL);
});

test('invalid fields return per-field errors and save nothing', async () => {
  const res = await post({ name: '', email: 'nope', message: 'short' });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'message', 'name']);
  assert.equal(await savedCount(), 0);
});

test('a filled honeypot looks successful but saves nothing', async () => {
  const res = await post({ ...valid, website: 'http://spam.example' });

  assert.equal(res.status, 201);
  assert.equal(await savedCount(), 0);
  assert.equal(notified.length, 0);
});

test('a failing notification does not fail the request', async () => {
  const app = createApp({
    db: pool,
    notify: async () => {
      throw new Error('smtp down');
    },
  });
  const local = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const res = await fetch(`http://localhost:${local.address().port}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(valid),
  });
  local.close();

  assert.equal(res.status, 201);
  assert.equal(await savedCount(), 1);
});

test('the contact endpoint is rate limited', async () => {
  const app = createApp({ db: pool, notify: async () => {}, contactLimit: 1 });
  const local = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const url = `http://localhost:${local.address().port}/api/contact`;
  const send = () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid),
    });

  const first = await send();
  const second = await send();
  local.close();

  assert.equal(first.status, 201);
  assert.equal(second.status, 429);
});

test('malformed JSON returns 400 rather than 500', async () => {
  const res = await post('{not json');

  assert.equal(res.status, 400);
});

test('unknown API routes return a JSON 404', async () => {
  const res = await fetch(`${base}/api/nope`);

  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Not found' });
});
