import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: 'Stag\'d <info@stagd.app>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
