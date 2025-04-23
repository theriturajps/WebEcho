const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = process.env.BASE_URL;

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify()
  .then(() => console.log('Ready to send emails'))
  .catch(err => console.error('Email verification error:', err));

// Email sending function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"WebEcho" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  verification: (token) => {
    const verificationUrl = `${BASE_URL}/auth/email/signup/callback/${token}`;

    return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2563EB; margin-bottom: 15px;">Verify Your Email</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #2563EB; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 3px;">Verify Email</a>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">Or copy this link: <span style="color: #2563EB; word-break: break-all;">${verificationUrl}</span></p>
      <p style="font-size: 13px; color: #666;">This link expires in 15 minutes.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">© WebEcho</p>
    </div>
    `;
  },

  passwordReset: (token) => {
    const resetUrl = `${BASE_URL}/auth/reset-password/${token}`;

    return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2563EB; margin-bottom: 15px;">Reset Your Password</h2>
      <p>Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #2563EB; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 3px;">Reset Password</a>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">Or copy this link: <span style="color: #2563EB; word-break: break-all;">${resetUrl}</span></p>
      <p style="font-size: 13px; color: #666;">This link expires in 1 hour.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">© WebEcho</p>
    </div>
    `;
  },

  passwordResetOTP: (email, otp) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #2563EB; margin-bottom: 15px;">Password Reset Code</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-radius: 3px; text-align: center;">
        ${otp}
      </div>
      <p style="font-size: 13px; color: #666;">This code expires in 5 minutes.</p>
      <p style="font-size: 13px; color: #666;">Please <a style="text-decoration: none;" href="${ BASE_URL}/auth/reset-password?email=${email}">Click Here</a> to visit Reset Password page.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">© WebEcho</p>
    </div>
    `;
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};