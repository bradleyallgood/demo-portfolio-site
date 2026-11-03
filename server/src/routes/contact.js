import { Router } from 'express';
import { MIN_FILL_MS, validateContact } from '../../../shared/contact.mjs';

const looksLikeBot = (body) =>
  // The honeypot field is hidden from people, so anything in it came from a bot.
  (typeof body.website === 'string' && body.website.trim() !== '') ||
  // The form reports how long it was open. Bots post directly or submit instantly.
  !(Number.isFinite(body.elapsedMs) && body.elapsedMs >= MIN_FILL_MS);

export function contactRouter({ db, notify, limiter }) {
  const router = Router();

  router.post('/', limiter, async (req, res) => {
    const body = req.body ?? {};

    // Report success so the bot moves on instead of retrying.
    if (looksLikeBot(body)) return res.status(201).json({ ok: true });

    const { values, errors } = validateContact(body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    await db.query(
      'INSERT INTO contact_messages (name, email, company, message) VALUES ($1, $2, $3, $4)',
      [values.name, values.email, values.company, values.message],
    );

    // The message is already saved, so a mail failure shouldn't fail the sender's request.
    notify(values).catch((err) => console.error('Notification failed:', err.message));

    res.status(201).json({ ok: true });
  });

  return router;
}
