// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

// Protect routes with JWT authentication
const protect = passport.authenticate('jwt', { session: false });

/**
 * @route GET /api/users/me
 * @desc Get current user's profile
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is set by passport.js after successful authentication
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user's profile
 * @access Private
 */
router.put('/me', protect, async (req, res) => {
  try {
    const updates = {
      username: req.body.username,
      email: req.body.email
      // Add other fields you want to be updatable
    };

    // Prevent changing sensitive fields
    if (req.body.password) {
      return res.status(400).json({ error: 'Use the /change-password endpoint to update password' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/users/change-password
 * @desc Change user's password
 * @access Private
 */
router.post('/change-password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Set new password
    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/users
 * @desc Get all users (Admin only)
 * @access Private/Admin
 */
router.get('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;