/* eslint-disable @typescript-eslint/no-require-imports */
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can replace this with another service if needed
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendEmail;
