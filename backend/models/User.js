const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return !this.isGoogleAuth; },
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    sparse: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    select: false, // Exclude from the default user selection
    minlength: [6, 'Password must be at least 6 characters'],
    validate: {
      validator: function(v) {
        // Allow empty password for Google Auth users, otherwise ensure it's a valid password
        if (this.isGoogleAuth && !v) return true;
        return true;  // No validation, accept any password
      },
      message: 'Password is required'
    }
  },
  dob: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow empty for Google auth users
        const ageDiff = Date.now() - value.getTime();
        const ageDate = new Date(ageDiff);
        return Math.abs(ageDate.getUTCFullYear() - 1970) >= 14;
      },
      message: 'You must be at least 14 years old'
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  profileImage: String,
  isGoogleAuth: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate username for Google users
userSchema.pre('save', function(next) {
  // Only auto-generate username for new Google auth users
  if (this.isGoogleAuth && !this.username && this.isNew) {
    this.username = this.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

// No password hashing middleware (no bcrypt hashing)
userSchema.pre('save', function(next) {
  next();  // Skip hashing password
});

// Method to compare passwords (plain text)
userSchema.methods.comparePassword = function(candidatePassword) {
  if (this.isGoogleAuth) return false;  // Google users can't use password auth
  return this.password === candidatePassword;  // Directly compare plain text password
};

module.exports = mongoose.model('User', userSchema);
