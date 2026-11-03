// Contact form rules, used by the browser for instant feedback and by the server as the real check.

export const NAME_MAX = 100;
export const COMPANY_MAX = 100;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

// People take longer than this to fill in the form. Faster submissions are treated as bots.
export const MIN_FILL_MS = 3000;

// The order errors are checked in, which is also the order the fields appear on the page.
export const FIELDS = ['name', 'email', 'company', 'message'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export function validateContact(body) {
  const name = clean(body.name).replace(/\s+/g, ' ');
  const email = clean(body.email);
  const company = clean(body.company).replace(/\s+/g, ' ');
  const message = clean(body.message);

  const errors = {};
  if (!name) errors.name = 'Please enter your name.';
  else if (name.length > NAME_MAX) errors.name = 'Please shorten your name.';
  if (!EMAIL.test(email) || email.length > EMAIL_MAX) {
    errors.email = 'Please enter a valid email address, like name@example.com.';
  }
  if (company.length > COMPANY_MAX) errors.company = 'Please shorten the company name.';
  if (message.length < MESSAGE_MIN) errors.message = 'Please write a little more.';
  if (message.length > MESSAGE_MAX) {
    errors.message = `Please keep your message under ${MESSAGE_MAX.toLocaleString('en-US')} characters.`;
  }

  return { values: { name, email, company: company || null, message }, errors };
}
