import { Router } from 'express';

export function profileRouter({ db }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const [profile, skills, projects, pets, hobbies] = await Promise.all([
      db.query(`SELECT name, headline, intro, location, about, links,
                       pets_about AS "petsAbout", photo_url AS "photoUrl"
                FROM profile`),
      db.query('SELECT category, name FROM skills ORDER BY position'),
      db.query(`SELECT id, title, tagline, description, tech, featured,
                       live_url AS "liveUrl", repo_url AS "repoUrl", image_url AS "imageUrl"
                FROM projects ORDER BY position`),
      db.query(`SELECT id, image_url AS "imageUrl", alt, caption
                FROM pet_photos ORDER BY position`),
      db.query(`SELECT id, title, description, image_url AS "imageUrl", alt
                FROM hobbies ORDER BY position`),
    ]);

    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'No content yet. Run npm run db:seed.' });
    }

    const groups = new Map();
    for (const { category, name } of skills.rows) {
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(name);
    }

    res.json({
      profile: profile.rows[0],
      skills: [...groups].map(([category, items]) => ({ category, items })),
      projects: projects.rows,
      pets: pets.rows,
      hobbies: hobbies.rows,
    });
  });

  return router;
}
