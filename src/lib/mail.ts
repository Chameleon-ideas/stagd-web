import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build');

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping email send: RESEND_API_KEY is not set.');
    return;
  }

  await resend.emails.send({
    from: 'Stag\'d <info@stagd.app>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
