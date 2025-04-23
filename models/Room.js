const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  password: {
    type: String,
    required: function () {
      return !!this.claimedBy;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

RoomSchema.pre('save', function (next) {
  if (this.name === 'default' && this.isModified('claimedBy')) {
    throw new Error('The default room cannot be claimed');
  }
  next();
});

// Generate a random password
RoomSchema.methods.generatePassword = function () {
  const crypto = require('crypto');
  this.password = crypto.randomBytes(4).toString('hex'); // 8 character password
  return this.password;
};

module.exports = mongoose.model('Room', RoomSchema);