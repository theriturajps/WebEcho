const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  verificationToken: {
    type: String
  },
  verificationExpires: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate email verification token
UserSchema.methods.generateVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = verificationToken;
  this.verificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes in milliseconds
  return verificationToken;
};

UserSchema.pre('remove', async function (next) {
  // Remove all rooms claimed by this user
  await this.model('Room').deleteMany({ claimedBy: this._id });
  next();
});

module.exports = mongoose.model('User', UserSchema);