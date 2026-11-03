import { createApp } from './app.js';
import { pool } from './db.js';
import { notifyEnabled, notifyNewMessage } from './notify.js';

const port = process.env.PORT || 3001;

createApp({ db: pool, notify: notifyNewMessage }).listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
  if (!notifyEnabled) console.log('Email notifications are off: SMTP_URL or NOTIFY_EMAIL is not set');
});
