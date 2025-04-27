/* eslint-disable @typescript-eslint/no-require-imports */
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

module.exports = sendEmail;
