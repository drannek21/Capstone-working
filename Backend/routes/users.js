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

module.exports = router;