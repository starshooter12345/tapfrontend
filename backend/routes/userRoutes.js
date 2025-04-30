const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');

// Protect routes with JWT authentication
const protect = passport.authenticate('jwt', { session: false });

// GET current user's profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// Update current user's profile
router.put('/me', protect, [
  check('username', 'Username must be 3-30 characters').optional().isLength({ min: 3, max: 30 }),
  check('dob', 'Date of birth is required').optional().isISO8601()
], async (req, res) => {
  console.log('Received update request:', {
    body: req.body,
    user: req.user
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Log current user data before update
    console.log('User before update:', {
      username: user.username,
      dob: user.dob,
      isGoogleAuth: user.isGoogleAuth
    });

    // Update basic fields
    if (req.body.username) user.username = req.body.username;
    if (req.body.dob) user.dob = new Date(req.body.dob);

    // Handle password change
    if (req.body.newPassword) {
      // For Google auth users, no current password needed
      if (!user.isGoogleAuth) {
        if (!req.body.currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password is required'
          });
        }

        if (user.password !== req.body.currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password is incorrect'
          });
        }
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password and confirmation do not match'
        });
      }

      user.password = req.body.newPassword;
    }

    // Add this to verify the changes before saving
    console.log('User changes to be saved:', {
      username: user.username,
      dob: user.dob,
      passwordChanged: !!req.body.newPassword
    });

    const updatedUser = await user.save();

    // Log the saved user data
    console.log('User after save:', {
      username: updatedUser.username,
      dob: updatedUser.dob,
      _id: updatedUser._id
    });

    // Verify the update in database
    const dbUser = await User.findById(req.user.id);
    console.log('User from database after save:', {
      username: dbUser.username,
      dob: dbUser.dob
    });

    // Return updated user without sensitive data
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Update error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.post('/change-password', protect, [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    if (user.password !== req.body.currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password directly as plain text
    user.password = req.body.newPassword;  // Store plain text password
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;