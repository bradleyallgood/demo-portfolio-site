// Reads content.json and checks it before anything touches the database, so a mistake
// produces a message that points at the file instead of a database error.
import fs from 'node:fs';
import path from 'node:path';

export const CONTENT_FILE = path.join(import.meta.dirname, 'content.json');

// Where image paths like /images/me.jpg live: the source folder in development,
// the built site in the production image.
const PUBLIC_DIRS = ['../../client/public', '../../client/dist'].map((dir) =>
  path.join(import.meta.dirname, dir),
);

export class ContentError extends Error {
  constructor(problems) {
    super(`content.json has ${problems.length === 1 ? 'a problem' : `${problems.length} problems`}:`);
    this.problems = problems;
  }
}

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isWebUrl = (value) => /^https?:\/\/\S+$/i.test(value);

// Collects every problem in one pass, so people can fix them all at once.
function checker() {
  const problems = [];
  const warnings = [];
  const publicDir = PUBLIC_DIRS.find((dir) => fs.existsSync(dir));

  const check = {
    problems,
    warnings,
    // A required piece of text, like a name or a title.
    text(value, where) {
      if (!isText(value)) problems.push(`${where} is missing. Add some text in quotes.`);
      return value;
    },
    // Optional text. Missing becomes null so it stays hidden on the site.
    optionalText(value, where) {
      if (value == null) return null;
      if (typeof value !== 'string') problems.push(`${where} must be text in quotes, or null.`);
      return value;
    },
    // A link to another website. Must be a full address so it can't run script.
    webUrl(value, where, { optional = false } = {}) {
      if (value == null && optional) return null;
      if (!isText(value)) problems.push(`${where} is missing. Add a full address starting with https://`);
      else if (!isWebUrl(value)) {
        problems.push(`${where} must be a full address starting with https:// (got "${value}").`);
      }
      return value ?? null;
    },
    // A picture on this site, like /images/me.jpg.
    image(value, where, { optional = false } = {}) {
      if (value == null && optional) return null;
      if (!isText(value)) {
        problems.push(`${where} is missing. Add a path like "/images/photo.jpg".`);
      } else if (!value.startsWith('/') || value.startsWith('//')) {
        problems.push(
          `${where} must be a path on this site starting with /, like "/images/photo.jpg" (got "${value}"). ` +
            'Images from other websites are blocked.',
        );
      } else if (publicDir && !fs.existsSync(path.join(publicDir, decodeURI(value)))) {
        warnings.push(`${where} points to ${value}, but there's no such file in client/public.`);
      }
      return value ?? null;
    },
    // A list. Missing counts as empty.
    list(value, where) {
      if (value == null) return [];
      if (!Array.isArray(value)) {
        problems.push(`${where} must be a list in square brackets [ ].`);
        return [];
      }
      return value;
    },
    entry(value, where) {
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
      problems.push(`${where} must be an entry in curly braces { }.`);
      return {};
    },
  };
  return check;
}

// Returns the content with optional fields filled in, or throws ContentError.
export function checkContent(content) {
  const check = checker();
  const root = check.entry(content, 'The file');
  const profile = check.entry(root.profile, '"profile"');

  const result = {
    profile: {
      name: check.text(profile.name, 'profile.name'),
      headline: check.text(profile.headline, 'profile.headline'),
      intro: check.optionalText(profile.intro, 'profile.intro') ?? '',
      location: check.text(profile.location, 'profile.location'),
      about: check.text(profile.about, 'profile.about'),
      petsAbout: check.optionalText(profile.petsAbout, 'profile.petsAbout') ?? '',
      photoUrl: check.image(profile.photoUrl, 'profile.photoUrl', { optional: true }),
      links: check.list(profile.links, 'profile.links').map((link, i) => {
        const where = `profile.links #${i + 1}`;
        const entry = check.entry(link, where);
        return {
          label: check.text(entry.label, `${where} label`),
          url: check.webUrl(entry.url, `${where} url`),
        };
      }),
    },

    skills: check.list(root.skills, '"skills"').map((group, i) => {
      const where = `skills #${i + 1}`;
      const entry = check.entry(group, where);
      const items = check.list(entry.items, `${where} items`);
      items.forEach((item, j) => check.text(item, `${where} items #${j + 1}`));
      return { category: check.text(entry.category, `${where} category`), items };
    }),

    projects: check.list(root.projects, '"projects"').map((project, i) => {
      const where = `projects #${i + 1}`;
      const entry = check.entry(project, where);
      const tech = check.list(entry.tech, `${where} tech`);
      tech.forEach((item, j) => check.text(item, `${where} tech #${j + 1}`));
      if (entry.featured != null && typeof entry.featured !== 'boolean') {
        check.problems.push(`${where} featured must be true or false, without quotes.`);
      }
      return {
        title: check.text(entry.title, `${where} title`),
        tagline: check.text(entry.tagline, `${where} tagline`),
        description: check.text(entry.description, `${where} description`),
        tech,
        liveUrl: check.webUrl(entry.liveUrl, `${where} liveUrl`, { optional: true }),
        repoUrl: check.webUrl(entry.repoUrl, `${where} repoUrl`, { optional: true }),
        imageUrl: check.image(entry.imageUrl, `${where} imageUrl`, { optional: true }),
        featured: entry.featured === true,
      };
    }),

    pets: check.list(root.pets, '"pets"').map((pet, i) => {
      const where = `pets #${i + 1}`;
      const entry = check.entry(pet, where);
      return {
        imageUrl: check.image(entry.imageUrl, `${where} imageUrl`),
        alt: check.text(entry.alt, `${where} alt (a description of the photo for screen readers)`),
        caption: check.optionalText(entry.caption, `${where} caption`),
      };
    }),

    hobbies: check.list(root.hobbies, '"hobbies"').map((hobby, i) => {
      const where = `hobbies #${i + 1}`;
      const entry = check.entry(hobby, where);
      return {
        title: check.text(entry.title, `${where} title`),
        description: check.text(entry.description, `${where} description`),
        imageUrl: check.image(entry.imageUrl, `${where} imageUrl`),
        alt: check.text(entry.alt, `${where} alt (a description of the photo for screen readers)`),
      };
    }),
  };

  if (check.problems.length > 0) throw new ContentError(check.problems);
  return { content: result, warnings: check.warnings };
}

// JSON errors only give a position. Show the line so people can find the mistake.
export function parseContent(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    let line;
    let column;
    const lineMatch = err.message.match(/line (\d+) column (\d+)/);
    const positionMatch = err.message.match(/position (\d+)/);
    if (lineMatch) [line, column] = [Number(lineMatch[1]), Number(lineMatch[2])];
    else if (positionMatch) {
      const before = text.slice(0, Number(positionMatch[1])).split('\n');
      [line, column] = [before.length, before.at(-1).length + 1];
    }
    const hint = line
      ? `Line ${line}, column ${column}:\n    ${text.split(/\r?\n/)[line - 1]?.trim()}\n` +
        '  Look for a missing comma, quote, or bracket on this line or the one before it.'
      : err.message;
    throw new ContentError([`It isn't valid JSON. ${hint}`]);
  }
}

export function loadContent(file = CONTENT_FILE) {
  return checkContent(parseContent(fs.readFileSync(file, 'utf8')));
}
