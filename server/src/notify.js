import nodemailer from 'nodemailer';

const { SMTP_URL, NOTIFY_EMAIL, SMTP_FROM } = process.env;
const transport = SMTP_URL && NOTIFY_EMAIL ? nodemailer.createTransport(SMTP_URL) : null;

export const notifyEnabled = Boolean(transport);

export async function notifyNewMessage({ name, email, company, message }) {
  if (!transport) return;

  await transport.sendMail({
    from: SMTP_FROM || NOTIFY_EMAIL,
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: `Portfolio message from ${name}`,
    text: `From: ${name} <${email}>\nCompany: ${company || '-'}\n\n${message}`,
  });
}
