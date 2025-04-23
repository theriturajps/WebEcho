const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController'); // Add this line
const rateLimit = require('express-rate-limit');

// Rate limiting
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many signup attempts. Please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many login attempts. Please try again later.'
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many verification requests. Please try again later.'
});

router.get('/reset-password', (req, res) => {
  const { email } = req.query;
  res.render('resetpass', {
    email: email || '',
    isAuthenticated: false // Since this is a password reset page
  });
});

// Auth routes
router.post('/signup', signupLimiter, authController.signup);
router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

router.get('/email/signup/callback/:token', authController.verifyEmail);
router.post('/email/signup/resend', resendLimiter, authController.resendVerification);

router.post('/update-password', profileController.updatePassword);
router.post('/update-preferences', profileController.updatePreferences);

router.post('/verify-reset-otp', authController.verifyResetOTP);
router.get('/reset-password', (req, res) => res.render('resetpass'));

module.exports = router;