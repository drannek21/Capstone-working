const express = require('express');
const router = express.Router();
const { queryDatabase } = require('../database');

// User registration route
router.post('/register', async (req, res) => {
  const { email, firstName, lastName, password } = req.body;
  try {
    const insertQuery = 'INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)';
    const result = await queryDatabase(insertQuery, [email, firstName, lastName, password]);
    res.json({ success: true, userId: result.insertId });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Add route for changing password
router.post('/change-password', async (req, res) => {
  let { userId, email, currentPassword, newPassword } = req.body;
  console.log('Received change password request for userId:', userId, 'email:', email);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Ensure userId is treated as a number if it's a numeric string
  if (userId) {
    userId = Number(userId) || userId;
    console.log('Processed userId (after conversion):', userId, 'Type:', typeof userId);
  }

  try {
    let userResults = [];
    
    // First try to find user by ID
    if (userId) {
      console.log('Trying to find user by ID:', userId);
      const userByIdQuery = 'SELECT id, email, password FROM users WHERE id = ?';
      console.log('SQL Query (by ID):', userByIdQuery, 'Params:', [userId]);
      
      userResults = await queryDatabase(userByIdQuery, [userId]);
      console.log('Query results by ID:', JSON.stringify(userResults, null, 2));
    }
    
    // If not found by ID and email is provided, try to find by email
    if ((!userResults || userResults.length === 0) && email) {
      console.log('User not found by ID, trying email:', email);
      const userByEmailQuery = 'SELECT id, email, password FROM users WHERE email = ?';
      console.log('SQL Query (by email):', userByEmailQuery, 'Params:', [email]);
      
      userResults = await queryDatabase(userByEmailQuery, [email]);
      console.log('Query results by email:', JSON.stringify(userResults, null, 2));
    }
    
    // Still not found
    if (!userResults || userResults.length === 0) {
      console.log('User not found with ID:', userId, 'or email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResults[0];
    console.log('Found user:', JSON.stringify(user, null, 2));
    const storedPassword = user.password;
    console.log('Current password in DB:', storedPassword);
    console.log('Provided current password:', currentPassword);

    // Compare current password (simple string comparison)
    if (storedPassword !== currentPassword) {
      console.log('Password mismatch for user:', user.id);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      console.log('User attempted to reuse the same password:', user.id);
      return res.status(400).json({ message: 'New password must be different from your current password' });
    }

    // Set userId to the one we found in the database
    userId = user.id;

    // Update the password
    console.log('Updating password for user:', userId);
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    console.log('Update SQL Query:', updateQuery, 'Params:', [newPassword, userId]);
    
    const updateResult = await queryDatabase(updateQuery, [newPassword, userId]);
    
    console.log('Password update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResult && updateResult.affectedRows > 0) {
      console.log('Password successfully updated for user:', userId);
      return res.status(200).json({ message: 'Password updated successfully' });
    } else {
      console.log('No rows affected when updating password for user:', userId);
      return res.status(500).json({ message: 'Failed to update password' });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Add route to fetch accepted users
router.get('/accepted-users', async (req, res) => {
  try {
    console.log('Fetching accepted users...');
    const query = `
      SELECT 
        au.id,
        u.name,
        au.accepted_at
      FROM users u
      JOIN accepted_users au ON u.id = au.user_id
      ORDER BY au.accepted_at DESC
      LIMIT 5
    `;
    
    console.log('Executing query:', query);
    const results = await queryDatabase(query);
    console.log('Query results:', results);
    
    if (!results || results.length === 0) {
      console.log('No accepted users found');
      return res.json([]);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching accepted users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch accepted users', 
      details: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;