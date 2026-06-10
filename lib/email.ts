import nodemailer from "nodemailer";

export async function sendEmailNotification(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP belum dikonfigurasi");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}