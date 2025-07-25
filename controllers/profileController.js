const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const { user } = req;
    
    const result = await pool.query(
      'SELECT id, username, email, full_name, phone  FROM users WHERE id = $1',
      [user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { user } = req;
    const { username, email, full_name, phone } = req.body;
    
    // Check if email or username is already taken by another user
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
      [email, username, user.id]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email or username already taken' });
    }
    
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, full_name = $3, phone = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, username, email, full_name, phone`,
      [username, email, full_name, phone, user.id]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { user } = req;
    const { currentPassword, newPassword } = req.body;
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Upload profile picture (optional)
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { user } = req;
    const { profilePicture } = req.body; // Base64 encoded image
    
    // Here you would typically:
    // 1. Save the image to a file storage service
    // 2. Update the user's profile_picture_url in the database
    
    res.json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
};
