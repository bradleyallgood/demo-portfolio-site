import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkContent, ContentError, loadContent, parseContent } from '../db/content.js';

const problemsFor = (content) => {
  try {
    checkContent(content);
  } catch (err) {
    if (err instanceof ContentError) return err.problems;
    throw err;
  }
  return [];
};

const minimal = () => ({
  profile: { name: 'Ada', headline: 'Engineer', location: 'London', about: 'Hi.' },
});

test('the shipped content.json passes', () => {
  assert.doesNotThrow(() => loadContent());
});

test('optional fields and lists can be left out', () => {
  const { content } = checkContent(minimal());

  assert.equal(content.profile.intro, '');
  assert.equal(content.profile.photoUrl, null);
  assert.deepEqual(content.profile.links, []);
  assert.deepEqual(content.projects, []);
});

test('a JSON mistake reports the line it is on', () => {
  const text = '{\n  "profile": {\n    "name": "Ada"\n    "headline": "x"\n  }\n}';
  assert.throws(() => parseContent(text), (err) => {
    assert.match(err.problems[0], /Line 4/);
    assert.match(err.problems[0], /"headline": "x"/);
    return true;
  });
});

test('every problem is reported at once, naming the field', () => {
  const content = minimal();
  delete content.profile.name;
  content.profile.links = [{ label: 'LinkedIn', url: 'linkedin.com/in/ada' }];
  content.projects = [{ title: 'Site', tagline: 'A site', description: 'It works.', featured: 'true' }];

  const problems = problemsFor(content);

  assert.equal(problems.length, 3);
  assert.match(problems[0], /profile\.name is missing/);
  assert.match(problems[1], /profile\.links #1 url must be a full address/);
  assert.match(problems[2], /projects #1 featured must be true or false/);
});

test('links that could run script are rejected', () => {
  const content = minimal();
  content.profile.links = [{ label: 'Click', url: 'javascript:alert(1)' }];

  assert.match(problemsFor(content)[0], /must be a full address/);
});

test('images must be on this site', () => {
  const content = minimal();
  content.profile.photoUrl = 'https://example.com/me.jpg';
  content.hobbies = [{ title: 'Climbing', description: 'Up.', imageUrl: '//cdn.example.com/a.jpg', alt: 'A wall' }];

  const problems = problemsFor(content);

  assert.equal(problems.length, 2);
  assert.ok(problems.every((p) => /must be a path on this site/.test(p)));
});

test('an image path with no matching file is a warning, not an error', () => {
  const content = minimal();
  content.profile.photoUrl = '/images/does-not-exist.jpg';

  const { warnings } = checkContent(content);

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /no such file/);
});
