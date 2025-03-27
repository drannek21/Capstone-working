require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

const { sendStatusEmail } = require('./services/emailService');
const { pool, queryDatabase } = require('./database');

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Import routes
const documentsRouter = require('./routes/documents');
const usersRouter = require('./routes/users');
const faceAuthRouter = require('./routes/faceAuth');

// Use routes
app.use('/api/documents', documentsRouter);
app.use('/api/users', usersRouter);

// Configure special route for face authentication with logging
app.use('/api/authenticate-face', (req, res, next) => {
  console.log('Face auth route accessed with method:', req.method);
  console.log('Request body contains descriptor:', req.body && req.body.descriptor ? 'Yes' : 'No');
  console.log('Request headers:', req.headers);
  // Skip token verification for face authentication
  next();
}, faceAuthRouter);

// Implement direct route for check-user-status
app.post('/api/check-user-status', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('User status check requested for email:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Get user by email
    const users = await queryDatabase(
      'SELECT id, email, name, code_id, status, faceRecognitionPhoto FROM users WHERE email = ?', 
      [email]
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found with this email' 
      });
    }
    
    const user = users[0];
    
    // Return user status and whether they have face recognition
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        hasFaceRecognition: user.faceRecognitionPhoto ? true : false
      }
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error while checking user status' 
    });
  }
});

// Test route to verify server is running
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/users', async (req, res) => {
  const { email, password, name, barangay, role, status } = req.body;
  try {
    await queryDatabase('INSERT INTO users (email, password, name, barangay, role,  status) VALUES (?, ?, ?, ?, ?,?)', 
      [email, password, name, barangay, role, status]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error inserting user into database' });
  }
});

app.get("/admins", async (req, res) => {
  try {
    const results = await queryDatabase("SELECT id, email, barangay FROM admin");
    res.json({ success: true, users: results });
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/admins", async (req, res) => {
  const { email, password, barangay } = req.body;
  
  if (!email || !password || !barangay) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingAdmins = await queryDatabase("SELECT * FROM admin WHERE email = ? OR barangay = ?", [email, barangay]);

    if (existingAdmins.length > 0) {
      const existingAdmin = existingAdmins[0];
      if (existingAdmin.email === email) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      if (existingAdmin.barangay === barangay) {
        return res.status(400).json({ success: false, message: "Barangay already has an admin" });
      }
    }

    await queryDatabase("INSERT INTO admin (email, password, barangay) VALUES (?, ?, ?)", [email, password, barangay]);
    res.json({ success: true, message: "Admin created successfully" });
  } catch (err) {
    console.error('Error adding admin:', err);
    res.status(500).json({ success: false, message: "Error adding admin", error: err.message });
  }
});

app.put("/admins/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password, barangay } = req.body;
  
  if (!email || !barangay) {
    return res.status(400).json({ success: false, message: "Email and barangay are required" });
  }

  try {
    const existingAdmins = await queryDatabase("SELECT * FROM admin WHERE (email = ? OR barangay = ?) AND id != ?", 
      [email, barangay, id]);

    if (existingAdmins.length > 0) {
      const existingAdmin = existingAdmins[0];
      if (existingAdmin.email === email) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      if (existingAdmin.barangay === barangay) {
        return res.status(400).json({ success: false, message: "Barangay already has an admin" });
      }
    }

    const updateFields = password 
      ? [email, password, barangay, id]
      : [email, barangay, id];

    const sql = password
      ? "UPDATE admin SET email = ?, password = ?, barangay = ? WHERE id = ?"
      : "UPDATE admin SET email = ?, barangay = ? WHERE id = ?";

    const result = await queryDatabase(sql, updateFields);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.json({ success: true, message: "Admin updated successfully" });
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ success: false, message: "Error updating admin", error: err.message });
  }
});

app.get('/pendingUsers', async (req, res) => {
  try {
    const users = await queryDatabase(`
      SELECT u.id AS userId, u.email, u.name, u.status, u.code_id,
             s1.first_name, s1.middle_name, s1.last_name, s1.age, s1.gender, 
             s1.date_of_birth, s1.place_of_birth, s1.barangay, s1.education, 
             s1.civil_status, s1.occupation, s1.religion, s1.company, 
             s1.income, s1.employment_status, s1.contact_number, s1.email, 
             s1.pantawid_beneficiary, s1.indigenous,
             s3.classification,
             s4.needs_problems,
             s5.emergency_name, s5.emergency_relationship, 
             s5.emergency_address, s5.emergency_contact
      FROM users u
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      LEFT JOIN step3_classification s3 ON u.code_id = s3.code_id
      LEFT JOIN step4_needs_problems s4 ON u.code_id = s4.code_id
      LEFT JOIN step5_in_case_of_emergency s5 ON u.code_id = s5.code_id
      WHERE u.status = 'Pending'
    `);

    if (users.length === 0) {
      return res.status(200).json([]);
    }

    const codeIds = users.map(user => user.code_id);

    const familyQuery = `
      SELECT code_id, 
             family_member_name,
             birthdate,
             educational_attainment,
             age
      FROM step2_family_occupation
      WHERE code_id IN (?)
    `;

    const familyMembers = await queryDatabase(familyQuery, [codeIds]);

    const familyByUser = {};
    familyMembers.forEach(member => {
      if (!familyByUser[member.code_id]) {
        familyByUser[member.code_id] = [];
      }
      familyByUser[member.code_id].push(member);
    });

    // Fetch documents for each user from all document tables
    const documentTables = [
      'psa_documents',
      'itr_documents', 
      'med_cert_documents', 
      'marriage_documents', 
      'cenomar_documents', 
      'death_cert_documents',
      'barangay_cert_documents'
    ];
    
    let allDocuments = [];
    
    // Query each document table and combine results
    for (const table of documentTables) {
      const documentsQuery = `
        SELECT code_id,
               file_name,
               uploaded_at,
               display_name,
               status,
               '${table}' as document_type,
               CASE 
                 WHEN file_name LIKE 'http%' THEN file_name 
                 ELSE CONCAT('http://localhost:8081/uploads/', file_name) 
               END as file_url
        FROM ${table}
        WHERE code_id IN (?)
      `;

      try {
        const docs = await queryDatabase(documentsQuery, [codeIds]);
        allDocuments = [...allDocuments, ...docs];
      } catch (err) {
        console.error(`Error fetching from ${table}:`, err);
        // Continue with other tables even if one fails
      }
    }

    const documentsByUser = {};
    allDocuments.forEach(doc => {
      if (!documentsByUser[doc.code_id]) {
        documentsByUser[doc.code_id] = [];
      }
      documentsByUser[doc.code_id].push(doc);
    });

    const usersWithFamily = users.map(user => ({
      ...user,
      familyMembers: familyByUser[user.code_id] || [],
      documents: documentsByUser[user.code_id] || []
    }));

    res.status(200).json(usersWithFamily);
  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).json({ error: 'Error fetching pending users' });
  }
});

app.post('/pendingUsers/updateClassification', async (req, res) => {
  const { code_id, classification } = req.body;

  try {
    if (!code_id || !classification) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await queryDatabase(`
      UPDATE step3_classification 
      SET classification = ? 
      WHERE code_id = ?
    `, [classification, code_id]);

    res.status(200).json({ message: 'Classification updated successfully', classification });
  } catch (err) {
    console.error('Error updating classification:', err);
    res.status(500).json({ error: 'Error updating classification', details: err.message });
  }
});

app.get('/verified-users', async (req, res) => {
  try {
    const query = `
      SELECT * FROM users 
      WHERE status = 'Verified' 
      ORDER BY created_at DESC
    `;
    const users = await queryDatabase(query);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching verified users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let result;

    // Check users table first
    result = await queryDatabase('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    let user = result.length > 0 ? result[0] : null;

    // Check admin table if user not found
    if (!user) {
      result = await queryDatabase('SELECT * FROM admin WHERE email = ? AND password = ?', [email, password]);
      if (result.length > 0) {
        user = result[0];
        user.role = 'admin';
      }
    }

    // Check superadmin table if still not found
    if (!user) {
      result = await queryDatabase('SELECT * FROM superadmin WHERE email = ? AND password = ?', [email, password]);
      if (result.length > 0) {
        user = result[0];
        user.role = 'superadmin';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Prevent login if status is 'Pending'
    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Account is pending approval' });
    }

    // Update status to Verified on first login if previously Created
    if (user.status === 'Created') {
      await queryDatabase('UPDATE users SET status = ? WHERE id = ?', ['Verified', user.id]);
      user.status = 'Verified';
    }

    res.status(200).json({ 
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


app.post('/getUserDetails', async (req, res) => {
  const { userId } = req.body;
  try {
    const userResults = await queryDatabase(`
      SELECT u.*, s1.* 
      FROM users u
      LEFT JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      WHERE u.id = ?`, [userId]);

    if (userResults.length > 0) {
      const user = userResults[0];
      
      // We'll let the frontend handle the default avatar
      // No need to set a default profilePic here

      // Fetch documents from all document tables
      const documentTables = [
        'psa_documents',
        'itr_documents', 
        'med_cert_documents', 
        'marriage_documents', 
        'cenomar_documents', 
        'death_cert_documents',
        'barangay_cert_documents'
      ];
      
      let allDocuments = [];
      
      // Query each document table and combine results
      for (const table of documentTables) {
        const documentsQuery = `
          SELECT code_id,
                 file_name,
                 uploaded_at,
                 display_name,
                 status,
                 '${table}' as document_type,
                 CASE 
                   WHEN file_name LIKE 'http%' THEN file_name 
                   ELSE CONCAT('http://localhost:8081/uploads/', file_name) 
                 END as file_url
          FROM ${table}
          WHERE code_id = ?
        `;

        try {
          const docs = await queryDatabase(documentsQuery, [user.code_id]);
          allDocuments = [...allDocuments, ...docs];
        } catch (err) {
          console.error(`Error fetching from ${table}:`, err);
          // Continue with other tables even if one fails
        }
      }

      if (user.status === 'Verified') {
        const classificationResult = await queryDatabase(
          'SELECT classification FROM step3_classification WHERE code_id = ?', 
          [user.code_id]
        );

        const validDateResult = await queryDatabase(
          'SELECT DATE_FORMAT(DATE_ADD(accepted_at, INTERVAL 1 YEAR), "%Y-%m-%d") as accepted_at FROM accepted_users WHERE user_id = ? ORDER BY accepted_at DESC LIMIT 1', 
          [userId]
        );

        console.log('Valid date result:', validDateResult);

        const familyResults = await queryDatabase(
          `SELECT family_member_name, birthdate, educational_attainment, age
           FROM step2_family_occupation
           WHERE code_id = ?`, 
          [user.code_id]
        );

        const userDetails = { 
          ...user,
          classification: classificationResult.length > 0 ? classificationResult[0].classification : null,
          validUntil: validDateResult.length > 0 ? validDateResult[0].accepted_at : null,
          familyMembers: familyResults || [],
          documents: allDocuments || []
        };

        console.log('User details with validUntil:', userDetails);
        return res.status(200).json(userDetails);
      } else {
        return res.status(200).json({
          ...user,
          documents: allDocuments || []
        });
      }
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await queryDatabase('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.get('/admin', async (req, res) => {
  try {
    const adminData = await queryDatabase('SELECT * FROM admin');
    res.json(adminData);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching admin data' });
  }
});

app.get('/superadmin', async (req, res) => {
  try {
    const superadminData = await queryDatabase('SELECT * FROM superadmin');
    res.json(superadminData);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching superadmin data' });
  }
});

app.post('/updateUserStatus', async (req, res) => {
  const { code_id, status, remarks, email, firstName, action } = req.body;
  console.log('Received request to update status:', { code_id, status, remarks, email, firstName, action });

  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      await queryDatabase('START TRANSACTION');

      const userResult = await queryDatabase(`
        SELECT u.id, u.status, s1.date_of_birth, u.password 
        FROM users u 
        JOIN step1_identifying_information s1 ON u.code_id = s1.code_id 
        WHERE u.code_id = ? 
        FOR UPDATE`, [code_id]);

      if (!userResult || userResult.length === 0) {
        console.error('User not found for code_id:', code_id);
        throw new Error('User not found');
      }

      const userId = userResult[0].id;
      const currentStatus = userResult[0].status;

      // Update user status
      await queryDatabase('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
      console.log('User status updated successfully for user ID:', userId);

      // Handle different status updates
      if (status === "Renewal") {
        const message = 'Your ID has expired. Please submit your renewal application.';
        await queryDatabase(
          'INSERT INTO accepted_users (user_id, message, accepted_at, is_read) VALUES (?, ?, NOW(), 0)', 
          [userId, message]
        );
        console.log('Renewal notification created for user_id:', userId);
      } else if (status === "Declined" && remarks) {
        const existingDeclined = await queryDatabase(
          'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0',
          [userId]
        );

        if (existingDeclined.length === 0) {
          await queryDatabase(
            'INSERT INTO declined_users (user_id, remarks, declined_at, is_read) VALUES (?, ?, NOW(), 0)', 
            [userId, remarks]
          );
          console.log('Declined user record created for user_id:', userId);
        }
      } else if (status === "Verified" || status === "Created") {
        const message = 'Your application has been accepted.';
        const existingAccepted = await queryDatabase(
          'SELECT * FROM accepted_users WHERE user_id = ? AND message = ? AND is_read = 0',
          [userId, message]
        );

        if (existingAccepted.length === 0) {
          await queryDatabase(
            'INSERT INTO accepted_users (user_id, accepted_at, message, is_read) VALUES (?, NOW(), ?, 0)', 
            [userId, message]
          );
          console.log('Accepted user record created for user_id:', userId);
        }
      }

      const emailSent = await sendStatusEmail(
        email, 
        firstName, 
        action, 
        remarks, 
        userResult[0].date_of_birth,
        userResult[0].password
      );

      await queryDatabase('COMMIT');
      
      res.json({ 
        success: true, 
        message: emailSent ? 'Status updated and email sent' : 'Status updated but email failed'
      });
      return;

    } catch (err) {
      await queryDatabase('ROLLBACK');
      lastError = err;
      console.error('Error updating user status:', err);
      
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        res.status(500).json({ success: false, message: err.message });
        return;
      }
      
      retries--;
      if (retries === 0) {
        res.status(500).json({ error: 'Database error while updating user status. Please try again.' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
});

app.post('/updateUserProfile', async (req, res) => {
  const { userId, profilePic, faceRecognitionPhoto } = req.body;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }
    
    // Update profilePic if provided
    if (profilePic) {
      await queryDatabase('UPDATE users SET profilePic = ? WHERE id = ?', [profilePic, userId]);
    }
    
    // Update faceRecognitionPhoto if provided
    if (faceRecognitionPhoto) {
      await queryDatabase('UPDATE users SET faceRecognitionPhoto = ? WHERE id = ?', [faceRecognitionPhoto, userId]);
      console.log(`Updated faceRecognitionPhoto for user ${userId} to ${faceRecognitionPhoto}`);
    }
    
    res.status(200).json({ success: true, message: 'User profile updated successfully' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Database error while updating user profile' });
  }
});

app.get('/debug/family-occupation', async (req, res) => {
  try {
    const results = await queryDatabase(`
      SELECT 
        s1.code_id,
        s1.first_name as parent_first_name,
        s1.last_name as parent_last_name,
        s2.family_member_name,
        s2.educational_attainment,
        s2.birthdate,
        s2.age
      FROM step1_identifying_information s1
      LEFT JOIN step2_family_occupation s2 ON s1.code_id = s2.code_id
      ORDER BY s1.code_id, s2.family_member_name
    `);
    
    const familyData = {};
    results.forEach(row => {
      if (!familyData[row.code_id]) {
        familyData[row.code_id] = {
          parent_name: `${row.parent_first_name} ${row.parent_last_name}`,
          family_members: []
        };
      }
      if (row.family_member_name) { 
        familyData[row.code_id].family_members.push({
          name: row.family_member_name,
          relationship: row.educational_attainment,
          occupation: row.birthdate,
          age: row.age
        });
      }
    });
    
    res.status(200).json(familyData);
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ error: 'Error fetching family occupation data' });
  }
});

app.get('/notifications/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const accepted = await queryDatabase(
      'SELECT accepted_at, is_read, message FROM accepted_users WHERE user_id = ? ORDER BY accepted_at DESC', 
      [userId]
    );
    
    const declined = await queryDatabase(
      'SELECT declined_at, remarks, is_read FROM declined_users WHERE user_id = ? ORDER BY declined_at DESC', 
      [userId]
    );

    const terminated = await queryDatabase(
      'SELECT terminated_at, message, is_read FROM terminated_users WHERE user_id = ? ORDER BY terminated_at DESC',
      [userId]
    );

    const remarks = await queryDatabase(
      'SELECT remarks_at, remarks, is_read FROM user_remarks WHERE user_id = ? ORDER BY remarks_at DESC',
      [userId]
    );
    
    let notifications = [];

    accepted.forEach(accept => {
      notifications.push({
        id: `accepted-${userId}-${accept.accepted_at}`,
        type: accept.message === "You have renewed" ? 'renewal_accepted' : 'application_accepted',
        message: accept.message,
        read: accept.is_read === 1,
        created_at: accept.accepted_at,
      });
    });

    declined.forEach(decline => {
      notifications.push({
        id: `declined-${userId}-${decline.declined_at}`,
        type: 'application_declined',
        message: `Your application has been declined. Remarks: ${decline.remarks}`,
        read: decline.is_read === 1,
        created_at: decline.declined_at,
      });
    });

    terminated.forEach(term => {
      notifications.push({
        id: `terminated-${userId}-${term.terminated_at}`,
        type: 'application_terminated',
        message: term.message,
        read: term.is_read === 1,
        created_at: term.terminated_at,
      });
    });

    remarks.forEach(remark => {
      notifications.push({
        id: `remark-${userId}-${remark.remarks_at}`,
        type: 'application_remarks',
        message: `Your application is under investigation. Reason: ${remark.remarks}`,
        read: remark.is_read === 1,
        created_at: remark.remarks_at,
      });
    });

    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Database error while fetching notifications' });
  }
});

app.put('/notifications/mark-as-read/:userId/:type', async (req, res) => {
  const { userId, type } = req.params;
  let retries = 3;

  while (retries > 0) {
    try {
      await queryDatabase('START TRANSACTION');

      if (type === 'application_accepted' || type === 'renewal_accepted') {
        await queryDatabase(
          'SELECT * FROM accepted_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        await queryDatabase(
          'UPDATE accepted_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      } else if (type === 'application_declined') {
        await queryDatabase(
          'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        await queryDatabase(
          'UPDATE declined_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      } else if (type === 'application_terminated') {
        await queryDatabase(
          'SELECT * FROM terminated_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        await queryDatabase(
          'UPDATE terminated_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      } else if (type === 'application_remarks') {
        await queryDatabase(
          'SELECT * FROM user_remarks WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        await queryDatabase(
          'UPDATE user_remarks SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      }

      await queryDatabase('COMMIT');
      res.json({ success: true, message: 'Notification marked as read' });
      return;

    } catch (err) {
      await queryDatabase('ROLLBACK');
      
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        throw err;
      }
      
      retries--;
      if (retries === 0) {
        console.error('Error updating notification after all retries:', err);
        res.status(500).json({ error: 'Database error while updating notifications. Please try again.' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
});

app.put('/notifications/mark-all-as-read/:userId', async (req, res) => {
  const { userId } = req.params;
  let retries = 3;

  while (retries > 0) {
    try {
      await queryDatabase('START TRANSACTION');

      await queryDatabase(
        'SELECT * FROM accepted_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      await queryDatabase(
        'UPDATE accepted_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await queryDatabase(
        'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      await queryDatabase(
        'UPDATE declined_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await queryDatabase(
        'SELECT * FROM terminated_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      await queryDatabase(
        'UPDATE terminated_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await queryDatabase(
        'SELECT * FROM user_remarks WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      await queryDatabase(
        'UPDATE user_remarks SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await queryDatabase('COMMIT');
      res.json({ success: true, message: 'All notifications marked as read' });
      return;

    } catch (err) {
      await queryDatabase('ROLLBACK');
      
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        throw err;
      }
      
      retries--;
      if (retries === 0) {
        console.error('Error updating notifications after all retries:', err);
        res.status(500).json({ error: 'Database error while updating notifications. Please try again.' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
});

app.get('/allRenewalUsers', async (req, res) => {
  try {
    // First get all renewal users
    const users = await queryDatabase(`
      SELECT u.id AS userId, u.code_id, s1.first_name, s1.middle_name, s1.last_name, s1.barangay
      FROM users u
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      WHERE u.status = 'Renewal'
    `);

    // Get documents for each user
    const usersWithDocuments = await Promise.all(users.map(async (user) => {
      const documentsQuery = `
        SELECT code_id,
               file_name,
               uploaded_at,
               display_name,
               status,
               'barangay_cert_documents' as document_type,
               CASE 
                 WHEN file_name LIKE 'http%' THEN file_name 
                 ELSE CONCAT('http://localhost:8081/uploads/', file_name) 
               END as file_url
        FROM barangay_cert_documents
        WHERE code_id = ?
      `;

      try {
        const documents = await queryDatabase(documentsQuery, [user.code_id]);
        return {
          ...user,
          documents: documents
        };
      } catch (err) {
        console.error(`Error fetching documents for user ${user.code_id}:`, err);
        return {
          ...user,
          documents: []
        };
      }
    }));

    res.status(200).json(usersWithDocuments);
  } catch (err) {
    console.error('Error fetching renewal users:', err);
    res.status(500).json({ error: 'Error fetching renewal users' });
  }
});

app.post('/superadminUpdateStatus', async (req, res) => {
  const { userId, status, remarks } = req.body;
  
  try {
    // Get the user info first to get code_id and email
    const userInfo = await queryDatabase(`
      SELECT u.code_id, u.email, s1.first_name 
      FROM users u 
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id 
      WHERE u.id = ?
    `, [userId]);
    
    if (!userInfo || userInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update user status
    await queryDatabase('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    
    // Add to accepted_users or declined_users based on status
    if (status === "Verified") {
      await queryDatabase(
        'INSERT INTO accepted_users (user_id, message, accepted_at, is_read) VALUES (?, ?, NOW(), 0)', 
        [userId, remarks || "Your renewal has been approved by a superadmin"]
      );
    } else if (status === "Declined" && remarks) {
      await queryDatabase(
        'INSERT INTO declined_users (user_id, remarks, declined_at, is_read) VALUES (?, ?, NOW(), 0)', 
        [userId, remarks]
      );
    }
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating user status by superadmin:', err);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

app.post('/updateAcceptedUser', async (req, res) => {
  const { code_id, message } = req.body;
  
  try {
    await queryDatabase(
      'INSERT INTO accepted_users (user_id, message, accepted_at) VALUES (?, ?, NOW())',
      [code_id, message]
    );

    res.status(200).json({ message: 'New notification added successfully' });
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ error: 'Failed to add notification' });
  }
});

app.get('/getTerminatedUsers', async (req, res) => {
  try {
    let query = `
      SELECT 
        s1.code_id,
        CONCAT(s1.first_name, ' ', s1.last_name) as user_name,
        u.id as user_id,
        a.barangay as admin_barangay,
        tu.terminated_at
      FROM users u
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      JOIN terminated_users tu ON u.id = tu.user_id
      LEFT JOIN admin a ON s1.barangay = a.barangay
      WHERE u.status = 'Terminated'
      ORDER BY tu.terminated_at DESC
    `;

    const terminatedUsers = await queryDatabase(query);
    res.json(terminatedUsers);
  } catch (err) {
    console.error('Error fetching terminated users:', err);
    res.status(500).json({ error: 'Failed to fetch terminated users' });
  }
});

app.post('/unTerminateUser', async (req, res) => {
  const { userId } = req.body;

  try {
    await queryDatabase('START TRANSACTION');

    await queryDatabase(
      'UPDATE users SET status = ? WHERE id = ?',
      ['Verified', userId]
    );

    await queryDatabase(
      'INSERT INTO accepted_users (user_id, message, accepted_at, is_read) VALUES (?, ?, NOW(), 0)',
      [userId, 'Your account has been reactivated.']
    );

    await queryDatabase('COMMIT');

    res.status(200).json({ message: 'User status updated to Verified' });
  } catch (error) {
    await queryDatabase('ROLLBACK');
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.get('/verifiedUsers/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { status } = req.query; 
    
    const adminResult = await queryDatabase('SELECT barangay FROM admin WHERE id = ?', [adminId]);
    
    if (adminResult.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminBarangay = adminResult[0].barangay;

    let statusCondition = "u.status IN ('Verified', 'Pending Remarks', 'Terminated')";
    if (status && (status === 'Verified' || status === 'Pending Remarks' || status === 'Terminated')) {
      statusCondition = "u.status = ?";
    }

    const users = await queryDatabase(`
      SELECT u.id AS userId, u.email, u.name, u.status, s1.barangay,
             s1.first_name, s1.middle_name, s1.last_name, s1.age, s1.gender, 
             s1.date_of_birth, s1.place_of_birth, s1.education, 
             s1.civil_status, s1.occupation, s1.religion, s1.company, 
             s1.income, s1.employment_status, s1.contact_number, s1.email, 
             s1.pantawid_beneficiary, s1.indigenous, s1.code_id,
             s3.classification,
             s4.needs_problems,
             s5.emergency_name, s5.emergency_relationship, 
             s5.emergency_address, s5.emergency_contact,
             (SELECT remarks 
              FROM user_remarks ur 
              WHERE ur.user_id = u.id 
              ORDER BY ur.remarks_at DESC 
              LIMIT 1) as latest_remarks
      FROM users u
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      LEFT JOIN step3_classification s3 ON u.code_id = s3.code_id
      LEFT JOIN step4_needs_problems s4 ON u.code_id = s4.code_id
      LEFT JOIN step5_in_case_of_emergency s5 ON u.code_id = s5.code_id
      WHERE ${statusCondition} AND s1.barangay = ?
    `, status ? [status, adminBarangay] : [adminBarangay]);

    const usersWithChildren = await Promise.all(users.map(async (user) => {
      const children = await queryDatabase(`
        SELECT family_member_name, educational_attainment, birthdate, age
        FROM step2_family_occupation
        WHERE code_id = ?
      `, [user.code_id]);

      return {
        ...user,
        remarks: user.latest_remarks || 'No remarks',
        children: children
      };
    }));

    res.status(200).json(usersWithChildren);
  } catch (err) {
    console.error('Error fetching verified users:', err);
    res.status(500).json({ error: 'Error fetching verified users' });
  }
});

app.post('/saveRemarks', async (req, res) => {
  const { code_id, remarks, user_id, admin_id } = req.body;

  try {
    await queryDatabase('START TRANSACTION');

    await queryDatabase(
      'INSERT INTO user_remarks (code_id, remarks, user_id, admin_id) VALUES (?, ?, ?, ?)',
      [code_id, remarks, user_id, admin_id]
    );

    await queryDatabase(
      'UPDATE users SET status = ? WHERE id = ?',
      ['Pending Remarks', user_id]
    );

    await queryDatabase('COMMIT');

    res.status(200).json({ message: 'Remarks saved successfully and status updated to Pending Remarks' });
  } catch (error) {
    await queryDatabase('ROLLBACK');
    console.error('Error saving remarks:', error);
    res.status(500).json({ error: 'Failed to save remarks' });
  }
});

app.get('/getAllRemarks', async (req, res) => {
  try {
    let query = `
      SELECT 
        r.code_id,
        r.remarks,
        r.remarks_at,
        r.user_id,
        CONCAT(s1.first_name, ' ', s1.last_name) as user_name,
        a.barangay as admin_barangay,
        u.status
      FROM user_remarks r
      JOIN users u ON r.user_id = u.id
      JOIN step1_identifying_information s1 ON u.code_id = s1.code_id
      JOIN admin a ON r.admin_id = a.id
      WHERE u.status = 'Pending Remarks'
      ORDER BY r.remarks_at DESC
    `;

    const remarks = await queryDatabase(query);
    res.json(remarks);
  } catch (err) {
    console.error('Error fetching remarks:', err);
    res.status(500).json({ error: 'Failed to fetch remarks' });
  }
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

const executeWithRetry = async (fn) => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'ER_LOCK_DEADLOCK' && retries < MAX_RETRIES - 1) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }
  }
};

app.post('/acceptRemarks', async (req, res) => {
  const { code_id } = req.body;

  try {
    const userResult = await queryDatabase('SELECT id FROM users WHERE code_id = ?', [code_id]);
    if (userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user_id = userResult[0].id;

    // Just update the user status since we don't have notifications table yet
    await queryDatabase(
      'UPDATE users SET status = ? WHERE code_id = ?',
      ['Verified', code_id]
    );

    res.status(200).json({ success: true, message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ success: false, message: 'Failed to verify user' });
  }
});

app.post('/declineRemarks', async (req, res) => {
  const { code_id } = req.body;

  try {
    const userResult = await queryDatabase('SELECT id FROM users WHERE code_id = ?', [code_id]);
    if (userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user_id = userResult[0].id;

    // Update user status and add to terminated_users
    await Promise.all([
      queryDatabase(
        'UPDATE users SET status = ? WHERE code_id = ?',
        ['Terminated', code_id]
      ),
      queryDatabase(
        'INSERT INTO terminated_users (user_id, message, terminated_at, is_read) VALUES (?, ?, NOW(), 0)',
        [user_id, 'Your application has been terminated.']
      )
    ]);

    res.status(200).json({ success: true, message: 'User terminated successfully' });
  } catch (error) {
    console.error('Error terminating user:', error);
    res.status(500).json({ success: false, message: 'Failed to terminate user' });
  }
});

app.post('/saveDocument', async (req, res) => {
  const { userId, documentType, documentUrl, documentName } = req.body;

  try {
    // Update the users table with the document information
    // We'll store documents as JSON in the documents column
    const user = await queryDatabase('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get existing documents or initialize empty array
    let documents = user[0].documents ? JSON.parse(user[0].documents) : [];

    // Update or add new document
    const existingDocIndex = documents.findIndex(doc => doc.type === documentType);
    if (existingDocIndex !== -1) {
      documents[existingDocIndex] = {
        ...documents[existingDocIndex],
        url: documentUrl,
        status: 'pending'
      };
    } else {
      documents.push({
        type: documentType,
        name: documentName,
        url: documentUrl,
        status: 'pending'
      });
    }

    // Update user's documents in the database
    await queryDatabase(
      'UPDATE users SET documents = ? WHERE id = ?',
      [JSON.stringify(documents), userId]
    );

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ success: false, message: 'Failed to save document' });
  }
});

app.get('/getUserDocuments/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await queryDatabase('SELECT documents FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const documents = user[0].documents ? JSON.parse(user[0].documents) : [];
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

app.get('/check-tables', async (req, res) => {
  try {
    const tables = [
      'step1_identifying_information',
      'step2_family_occupation',
      'step3_classification',
      'step4_needs_problems',
      'step5_in_case_of_emergency',
      'users',
      'psa_documents',
      'itr_documents',
      'med_cert_documents',
      'marriage_documents',
      'cenomar_documents',
      'death_cert_documents'
    ];

    const results = {};
    for (const table of tables) {
      try {
        const columns = await queryDatabase(`DESCRIBE ${table}`);
        results[table] = columns;
      } catch (err) {
        results[table] = { error: err.message };
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/getUserDocuments', async (req, res) => {
  const { code_id } = req.query;

  try {
    if (!code_id) {
      return res.status(400).json({ error: 'code_id is required' });
    }

    const documentsQuery = `
      SELECT code_id,
             file_name,
             uploaded_at,
             display_name,
             status,
             'barangay_cert_documents' as document_type,
             CASE 
               WHEN file_name LIKE 'http%' THEN file_name 
               ELSE CONCAT('http://localhost:8081/uploads/', file_name) 
             END as file_url
      FROM barangay_cert_documents
      WHERE code_id = ?
    `;

    const documents = await queryDatabase(documentsQuery, [code_id]);
    res.json(documents);
  } catch (err) {
    console.error('Error fetching barangay certificates:', err);
    res.status(500).json({ error: 'Error fetching barangay certificates' });
  }
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Set port and start server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Face authentication endpoint: http://localhost:${PORT}/api/authenticate-face`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  pool.end((err) => {
    if (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
});

// Implement direct route for password reset
app.post('/api/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    console.log(`Password reset requested for email: ${email}`);
    
    // Check if email exists in database and status is Verified
    const users = await queryDatabase(
      'SELECT id, email, name, status FROM users WHERE email = ?', 
      [email]
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found with this email' 
      });
    }
    
    const user = users[0];
    
    // Check if user status is Verified
    if (user.status !== 'Verified') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only verified users can reset their password. Please contact an administrator.' 
      });
    }
    
    // Generate reset token and expiration
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    try {
      // Add resetPasswordToken column if it doesn't exist
      await queryDatabase(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS resetPasswordToken VARCHAR(100) NULL,
        ADD COLUMN IF NOT EXISTS resetPasswordExpires DATETIME NULL
      `);
    } catch (alterError) {
      console.log("Table alteration attempted. If columns already exist, this error can be ignored.");
      console.error(alterError);
    }
    
    // Save token to database
    await queryDatabase(
      'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
      [resetToken, resetTokenExpires, user.id]
    );
    
    // Create reset URL
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'baisasangelo8@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password-here'
      }
    });
    
    // Set up email options
    const mailOptions = {
      from: '"Solo Parent Support System" <baisasangelo8@gmail.com>',
      to: email,
      subject: 'Password Reset - Solo Parent Support System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16C47F; text-align: center;">Password Reset Request</h2>
          <p>Hello ${user.name || email},</p>
          <p>We received a request to reset your password for the Solo Parent Support System. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #16C47F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
          </div>
          <p>If you didn't request this password reset, you can safely ignore this email. The link will expire in 1 hour.</p>
          <p>If the button doesn't work, copy and paste the following URL into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          <hr style="border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; color: #777; font-size: 14px;">Solo Parent Support System</p>
        </div>
      `
    };
    
    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
      
      return res.json({ 
        success: true, 
        message: 'Password reset link has been sent to your email address'
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Still return success but with a warning
      return res.json({ 
        success: true, 
        message: 'Password reset link was processed but email sending failed. For testing, you can use this token:',
        token: resetToken
      });
    }
    
  } catch (error) {
    console.error('Error in password reset request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error processing password reset request: ' + error.message
    });
  }
});

// Verify reset token endpoint
app.get('/api/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token is required' 
      });
    }
    
    // Look for user with this reset token
    const users = await queryDatabase(
      'SELECT id FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()', 
      [token]
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    // Token is valid
    res.json({ 
      valid: true,
      message: 'Token is valid'
    });
    
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Server error verifying token: ' + error.message
    });
  }
});

// Process password reset
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  try {
    // Verify token is valid and get associated email
    const [tokenResults] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires > NOW()',
      [token]
    );
    
    if (tokenResults.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
    
    const { email } = tokenResults[0];
    
    // Check if new password is same as old password
    const [userResults] = await pool.execute(
      'SELECT password FROM users WHERE email = ?',
      [email]
    );
    
    if (userResults.length > 0 && userResults[0].password === password) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password cannot be the same as your current password' 
      });
    }
    
    // Update user's password
    await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [password, email]
    );
    
    // Delete used token
    await pool.execute(
      'DELETE FROM password_reset_tokens WHERE token = ?',
      [token]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add route for changing password
app.post('/changePassword', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // First, verify the current password
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const storedPassword = rows[0].password;

    // Compare current password (basic comparison for now)
    if (storedPassword !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update the password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});