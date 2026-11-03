import { Router } from 'express';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateContact(body) {
  const name = clean(body.name).replace(/\s+/g, ' ');
  const email = clean(body.email);
  const company = clean(body.company).replace(/\s+/g, ' ');
  const message = clean(body.message);

  const errors = {};
  if (!name || name.length > 100) errors.name = 'Please enter your name.';
  if (!EMAIL.test(email) || email.length > 254) errors.email = 'Please enter a valid email address.';
  if (company.length > 100) errors.company = 'Please shorten the company name.';
  if (message.length < 10) errors.message = 'Please write a little more.';
  if (message.length > 5000) errors.message = 'Please keep your message under 5,000 characters.';

  return { values: { name, email, company: company || null, message }, errors };
}

export function contactRouter({ db, notify, limiter }) {
  const router = Router();

  router.post('/', limiter, async (req, res) => {
    // Hidden from people, so anything in it came from a bot. Report success so it moves on.
    if (clean(req.body?.website)) return res.status(201).json({ ok: true });

    const { values, errors } = validateContact(req.body ?? {});
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
