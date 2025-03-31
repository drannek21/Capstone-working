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
      INNER JOIN (
        SELECT user_id, MAX(accepted_at) as latest_accepted_at
        FROM accepted_users
        WHERE message = 'Your application has been accepted.'
        GROUP BY user_id
      ) latest_au ON u.id = latest_au.user_id
      INNER JOIN accepted_users au ON u.id = au.user_id 
        AND au.accepted_at = latest_au.latest_accepted_at
      WHERE u.status IN ('Verified', 'Created')
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


router.get('/polulations-users', async (req, res) => {
  try {
    console.log('Fetching population users...');
    const { barangay, startDate, endDate } = req.query;
    
    // List of valid barangays
    const validBarangays = [
      'Adia', 'Bagong Pook', 'Bagumbayan', 'Bubucal', 'Cabooan', 'Calangay',
      'Cambuja', 'Coralan', 'Cueva', 'Inayapan', 'Jose P. Laurel, Sr.',
      'Jose P. Rizal', 'Juan Santiago', 'Kayhacat', 'Macasipac', 'Masinao',
      'Matalinting', 'Pao-o', 'Parang ng Buho', 'Poblacion Dos',
      'Poblacion Quatro', 'Poblacion Tres', 'Poblacion Uno', 'Talangka', 'Tungkod'
    ];
    
    let query = `
        SELECT 
          au.id,
          au.accepted_at,
          u.status,
          s1.barangay,
          u.id as user_id,
          u.code_id
        FROM users u
        INNER JOIN (
          SELECT user_id, MAX(accepted_at) as latest_accepted_at
          FROM accepted_users
          WHERE message = 'Your application has been accepted.'
          GROUP BY user_id
        ) latest_au ON u.id = latest_au.user_id
        INNER JOIN accepted_users au ON u.id = au.user_id 
          AND au.accepted_at = latest_au.latest_accepted_at
        INNER JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
        WHERE u.status IN ('Verified', 'Renewal', 'Pending Remarks', 'Terminated')
    `;

    const params = [];

    // Add barangay filter if specified and valid
    if (barangay && validBarangays.includes(barangay)) {
      query += ` AND s1.barangay = ?`;
      params.push(barangay);
    }

    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND DATE(au.accepted_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY au.accepted_at ASC`;
    
    console.log('Executing query:', query);
    console.log('Query params:', params);
    const results = await queryDatabase(query, params);
    console.log('Query results:', JSON.stringify(results, null, 2));
    
    if (!results || results.length === 0) {
      console.log('No users found');
      return res.json([]);
    }
    
    // Log unique status counts
    const statusCounts = results.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Status counts:', statusCounts);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching population users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch population users', 
      details: error.message,
      stack: error.stack 
    });
  }
});

router.get('/beneficiaries-users', async (req, res) => {
  try {
    console.log('Fetching beneficiaries users...');
    const { barangay, startDate, endDate } = req.query;

    let query = `
      SELECT 
        u.id,
        u.status,
        s1.barangay,
        s1.income,
        au.accepted_at,
        CASE 
          WHEN s1.income = 'Below ₱10,000' THEN 10000
          WHEN s1.income = '₱11,000-₱20,000' THEN 20000
          WHEN s1.income = '₱21,000-₱43,000' THEN 43000
          WHEN s1.income = '₱44,000 and above' THEN 250001
          ELSE CAST(REPLACE(REPLACE(s1.income, '₱', ''), ',', '') AS DECIMAL(10, 2))
        END as income_value
      FROM users u
      INNER JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      INNER JOIN (
        SELECT user_id, MAX(accepted_at) as latest_accepted_at
        FROM accepted_users
        WHERE message = 'Your application has been accepted.'
        GROUP BY user_id
      ) latest_au ON u.id = latest_au.user_id
      INNER JOIN accepted_users au ON u.id = au.user_id 
        AND au.accepted_at = latest_au.latest_accepted_at
      WHERE u.status = 'Verified'
    `;

    const params = [];

    // Add barangay filter if specified
    if (barangay && barangay !== 'All') {
      query += ` AND s1.barangay = ?`;
      params.push(barangay);
    }

    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND DATE(au.accepted_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY u.id ASC`;
    
    console.log('Executing query:', query);
    console.log('Query params:', params);
    const results = await queryDatabase(query, params);
    console.log('Query results:', results);
    
    if (!results || results.length === 0) {
      console.log('No users found');
      return res.json({
        beneficiaries: 0,
        nonBeneficiaries: 0,
        users: []
      });
    }

    // Process results to count beneficiaries and non-beneficiaries
    const processedResults = {
      beneficiaries: results.filter(user => user.income_value < 250000).length,
      nonBeneficiaries: results.filter(user => user.income_value >= 250000).length,
      users: results
    };
    
    res.json(processedResults);
  } catch (error) {
    console.error('Error fetching beneficiaries users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beneficiaries users', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Add the new application-status endpoint
router.get('/application-status', async (req, res) => {
  try {
    console.log('Fetching application status...');
    const { barangay, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        u.status,
        COUNT(*) as count,
        MAX(
          CASE 
            WHEN u.status = 'Verified' THEN au.accepted_at
            WHEN u.status = 'Created' THEN au.accepted_at
            WHEN u.status = 'Pending Remarks' THEN ur.remarks_at
            WHEN u.status = 'Terminated' THEN tu.terminated_at
            WHEN u.status = 'Declined' THEN du.declined_at
            WHEN u.status = 'Pending' THEN u.created_at
          END
        ) as latest_status_date
      FROM users u
      INNER JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      LEFT JOIN (
        SELECT user_id, MAX(accepted_at) as accepted_at
        FROM accepted_users
        GROUP BY user_id
      ) au ON u.id = au.user_id
      LEFT JOIN (
        SELECT user_id, MAX(remarks_at) as remarks_at
        FROM user_remarks
        GROUP BY user_id
      ) ur ON u.id = ur.user_id
      LEFT JOIN (
        SELECT user_id, MAX(terminated_at) as terminated_at
        FROM terminated_users
        GROUP BY user_id
      ) tu ON u.id = tu.user_id
      LEFT JOIN (
        SELECT user_id, MAX(declined_at) as declined_at
        FROM declined_users
        GROUP BY user_id
      ) du ON u.id = du.user_id
      WHERE u.status IN ('Declined', 'Pending', 'Verified', 'Created', 'Pending Remarks', 'Terminated')
    `;

    const params = [];

    // Add barangay filter if specified
    if (barangay && barangay !== 'All') {
      query += ` AND s1.barangay = ?`;
      params.push(barangay);
    }

    // Add date range filter if specified
    if (startDate && endDate) {
      query += ` AND DATE(
        CASE 
          WHEN u.status = 'Verified' THEN au.accepted_at
          WHEN u.status = 'Created' THEN au.accepted_at
          WHEN u.status = 'Pending Remarks' THEN ur.remarks_at
          WHEN u.status = 'Terminated' THEN tu.terminated_at
          WHEN u.status = 'Declined' THEN du.declined_at
          WHEN u.status = 'Pending' THEN u.created_at
        END
      ) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY u.status`;
    
    console.log('Executing query:', query);
    console.log('Query params:', params);
    const results = await queryDatabase(query, params);
    console.log('Query results:', results);
    
    // Initialize counts
    const statusCounts = {
      declined: 0,
      pending: 0,
      accepted: 0
    };

    // Process results
    results.forEach(row => {
      if (row.status === 'Declined') {
        statusCounts.declined = row.count;
      } else if (row.status === 'Pending') {
        statusCounts.pending = row.count;
      } else if (row.status === 'Verified' || row.status === 'Created' || 
                 row.status === 'Pending Remarks' || row.status === 'Terminated') {
        statusCounts.accepted += row.count;  // Add all accepted-type statuses to accepted count
      }
    });
    
    res.json(statusCounts);
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch application status', 
      details: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;