require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger';
  const text = `Hello ${name},\n Thank you for registering to Backend Ledger`;
  const html = `<p>Hello ${name},<br> Thank you for registering to Backend Ledger</p>`;

  await sendEmail(userEmail, subject, text, html); // ← this line was missing
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful'
  const text = `HELLO ${name},\n\nYour transaction of $${amount} to account was Successful .\n The Backend ledger`;
  const html = `<p> Hello ${name},</p><p>Your transation of ${amount} to account was Successful .</p><p><br>The Backend ledger</p>`;

  await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Fail'
  const text = `HELLO ${name},\n\nYour transaction of $${amount} to account was Failed .\n The Backend ledger`;
  const html = `<p> Hello ${name},</p><p>Your transation of ${amount} to account was Failed .</p><p><br>The Backend ledger</p>`;

  await sendEmail(userEmail, subject, text, html);
}

// Single export at the bottom
module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };