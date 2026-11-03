// Replaces all site content with content.json. Contact messages are never touched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../src/db.js';

const content = JSON.parse(
  await fs.readFile(path.join(import.meta.dirname, 'content.json'), 'utf8'),
);

const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('TRUNCATE profile, skills, projects, pet_photos, hobbies');

  const { name, headline, intro, location, about, petsAbout, photoUrl, links } = content.profile;
  await client.query(
    `INSERT INTO profile (name, headline, intro, location, about, pets_about, photo_url, links)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [name, headline, intro, location, about, petsAbout, photoUrl, JSON.stringify(links)],
  );

  let position = 0;
  for (const { category, items } of content.skills) {
    for (const skill of items) {
      await client.query('INSERT INTO skills (category, name, position) VALUES ($1, $2, $3)', [
        category,
        skill,
        position++,
      ]);
    }
  }

  for (const [i, project] of content.projects.entries()) {
    await client.query(
      `INSERT INTO projects
         (title, tagline, description, tech, live_url, repo_url, image_url, featured, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        project.title,
        project.tagline,
        project.description,
        project.tech,
        project.liveUrl,
        project.repoUrl,
        project.imageUrl,
        project.featured,
        i,
      ],
    );
  }

  for (const [i, { imageUrl, alt, caption }] of content.pets.entries()) {
    await client.query(
      'INSERT INTO pet_photos (image_url, alt, caption, position) VALUES ($1, $2, $3, $4)',
      [imageUrl, alt, caption, i],
    );
  }

  for (const [i, { title, description, imageUrl, alt }] of content.hobbies.entries()) {
    await client.query(
      `INSERT INTO hobbies (title, description, image_url, alt, position)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, description, imageUrl, alt, i],
    );
  }

  await client.query('COMMIT');
  console.log('Content loaded from content.json');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
