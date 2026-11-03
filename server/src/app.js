import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { contactRouter } from './routes/contact.js';
import { profileRouter } from './routes/profile.js';

const clientDist = path.join(import.meta.dirname, '../../client/dist');

export function createApp({ db, notify, contactLimit = 5 }) {
  const app = express();

  // Hosts terminate TLS at a proxy; rate limiting needs the real client IP.
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));

  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: contactLimit,
    // Only sends count, so someone fixing a typo isn't locked out.
    skipFailedRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many messages. Please try again later.' },
  });

  app.get('/api/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true });
  });
  app.use('/api/profile', profileRouter({ db }));
  app.use('/api/contact', contactRouter({ db, notify, limiter }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // Page URLs like /about are routed in the browser, so they all get the app shell.
    app.get(/^\/(?!assets\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((err, req, res, next) => {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Something went wrong' : err.message });
  });

  return app;
}
