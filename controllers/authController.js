const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/nodemailer');

// Register new user
exports.signup = async (req, res) => {
  try {
    const { email, password, roomName } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword
    });

    // Generate verification token
    const verificationToken = newUser.generateVerificationToken();

    // Save user
    await newUser.save();

    // Send verification email
    await sendEmail(
      email,
      'Verify Your WebEcho Account',
      emailTemplates.verification(verificationToken)
    );

    // If a room name was provided, store it in session for claiming after verification
    if (roomName) {
      req.session.roomToClaim = roomName;
    }

    // Set user session
    req.session.userId = newUser._id;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      verified: false
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with matching token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() } // This checks if token is still valid
    });

    if (!user) {
      return res.render('verification', {
        success: false,
        message: 'Verification link has expired (valid for 15 minutes) or is invalid',
        isAuthenticated: false
      });
    }

    // Mark as verified and remove token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Set user session
    req.session.userId = user._id;

    // Check if there's a room to claim
    const roomToClaim = req.session.roomToClaim;

    // Clear the session variable
    req.session.roomToClaim = undefined;

    // Render verification page with success
    return res.render('verification', {
      success: true,
      message: 'Email verification successful! You can now claim rooms.',
      isAuthenticated: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.render('verification', {
      success: false,
      message: 'Verification failed. Please try again.',
      isAuthenticated: false
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, roomName } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Set user session
    req.session.userId = user._id;
    
    // If user is not verified, remind them
    if (!user.isVerified) {
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful, but please verify your email to claim rooms',
        verified: false
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      verified: true,
      roomName: roomName
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Logout user
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: true, // Always true
      sameSite: 'none' // Required for cross-site
    });

    return res.status(200).json({ success: true, message: 'Logout successful' });
  });
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP with 5-minute expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send email with OTP
    await sendEmail(
      user.email,
      'Your Password Reset OTP',
      emailTemplates.passwordResetOTP(user.email, otp)
    );

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email (valid for 5 minutes)',
      email: user.email
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Generate new verification token with 15-minute expiration
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await sendEmail(
      user.email,
      'Verify Your WebEcho Account',
      emailTemplates.verification(verificationToken)
    );

    return res.status(200).json({
      success: true,
      message: 'New verification email sent. Link expires in 15 minutes.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

// Verify OTP
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() } // Check if OTP is still valid
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP (OTP expires after 5 minutes)'
      });
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'No account found with that email'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Internal server error during password reset',
      // details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};