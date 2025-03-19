const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'soloparent',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Improved queryDatabase function with better error handling
const queryDatabase = (sql, params) => new Promise((resolve, reject) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err);
      return reject(err);
    }

    connection.query(sql, params, (err, result) => {
      connection.release(); // Always release the connection
      if (err) {
        console.error('Query error:', err);
        return reject(err);
      }
      resolve(result);
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
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
    // Check if email or barangay already exists
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

    // If validation passes, insert new admin
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
    // Check if email or barangay already exists for other admins
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

    // If validation passes, update admin
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
    // First, get all pending users with their basic information
    const users = await queryDatabase(`
      SELECT u.id AS userId, u.email, u.name, u.status, u.barangay,
             s1.first_name, s1.middle_name, s1.last_name, s1.age, s1.gender, 
             s1.date_of_birth, s1.place_of_birth, s1.address, s1.education, 
             s1.civil_status, s1.occupation, s1.religion, s1.company, 
             s1.income, s1.employment_status, s1.contact_number, s1.email, 
             s1.pantawid_beneficiary, s1.indigenous, s1.code_id,

             -- Step 3: Classification
             s3.classification,

             -- Step 4: Needs/Problems
             s4.needs_problems,

             -- Step 5: Emergency Contact
             s5.emergency_name, s5.emergency_relationship, 
             s5.emergency_address, s5.emergency_contact

      FROM users u
      JOIN user_details_step1 s1 ON u.id = s1.user_id
      LEFT JOIN user_details_step3 s3 ON u.id = s3.user_id
      LEFT JOIN user_details_step4 s4 ON u.id = s4.user_id
      LEFT JOIN user_details_step5 s5 ON u.id = s5.user_id
      WHERE u.status = 'pending'
    `);

    // For each user, get their children
    const usersWithChildren = await Promise.all(users.map(async (user) => {
      const children = await queryDatabase(`
        SELECT first_name, middle_name, last_name, birthdate, age, educational_attainment
        FROM user_details_step2
        WHERE user_id = ?
      `, [user.userId]);

      return {
        ...user,
        children: children
      };
    }));

    res.status(200).json(usersWithChildren);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching pending users' });
  }
});

app.post('/pendingUsers/updateClassification', async (req, res) => {
  const { userId, classification } = req.body;

  try {
    if (!userId || !classification) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await queryDatabase(`
      UPDATE user_details_step3 
      SET classification = ? 
      WHERE user_id = ?
    `, [classification, userId]);

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
    // First check users table
    let results = await queryDatabase('SELECT *, "user" as role FROM users WHERE email = ? AND password = ?', [email, password]);
    
    // If not found in users, check admin table
    if (results.length === 0) {
      results = await queryDatabase('SELECT *, "admin" as role FROM admin WHERE email = ? AND password = ?', [email, password]);
    }
    
    // If not found in admin, check superadmin table
    if (results.length === 0) {
      results = await queryDatabase('SELECT *, "superadmin" as role FROM superadmin WHERE email = ? AND password = ?', [email, password]);
    }

    if (results.length > 0) {
      const user = results[0];
      res.status(200).json({ 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name || null,
          status: user.status || 'active',
          barangay: user.barangay || null
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/getUserDetails', async (req, res) => {
  const { userId } = req.body;
  try {
    // Fetch user details
    const userResults = await queryDatabase('SELECT * FROM users WHERE id = ?', [userId]);

    if (userResults.length > 0) {
      const user = userResults[0];

      // If the user is verified, fetch all related details
      if (user.status === 'Verified') {
        // Get user's personal details from step1
        const detailsResults = await queryDatabase('SELECT * FROM user_details_step1 WHERE user_id = ?', [userId]);

        // Get user's classification from step3
        const classificationResult = await queryDatabase('SELECT classification FROM user_details_step3 WHERE user_id = ?', [userId]);

        // Get the valid date from accepted_users table and add 1 year
        const validDateResult = await queryDatabase(
          'SELECT DATE_FORMAT(DATE_ADD(accepted_at, INTERVAL 1 YEAR), "%Y-%m-%d") as accepted_at FROM accepted_users WHERE user_id = ? ORDER BY accepted_at DESC LIMIT 1', 
          [userId]
        );

        // Get all children from step2 where the parent_id matches the logged-in user's ID
        const childrenResults = await queryDatabase(
          `SELECT s2.first_name, s2.middle_name, s2.last_name, s2.birthdate, s2.age, 
                  s2.educational_attainment, s2.user_id as parent_id
           FROM user_details_step2 s2
           WHERE s2.user_id = ?`, [userId]);

        if (detailsResults.length > 0) {
          // Merge user details with personal info and children data
          const userDetails = { 
            ...user, 
            ...detailsResults[0],
            classification: classificationResult.length > 0 ? classificationResult[0].classification : null,
            validUntil: validDateResult.length > 0 ? validDateResult[0].accepted_at : null,
            children: childrenResults || [] 
          };

          return res.status(200).json(userDetails);
        } else {
          return res.status(404).json({ error: 'User details not found' });
        }
      } else {
        return res.status(200).json(user); // Just return basic user info if not verified
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

app.post('/userDetailsStep1', async (req, res) => {
  const {
    userId, firstName, middleName, lastName, age, gender, dateOfBirth,
    placeOfBirth, address, education, civilStatus, occupation, religion,
    company, income, employmentStatus, contactNumber, email, pantawidBeneficiary,
    indigenous
  } = req.body;

  const createDate = new Date();
  const year = createDate.getFullYear();
  const month = (createDate.getMonth() + 1).toString().padStart(2, '0');  // Format month as 2 digits

  try {
    // Get the highest codeId for the current month
    const result = await queryDatabase(`
      SELECT codeId FROM user_details_step1 
      WHERE codeId LIKE ? 
      ORDER BY codeId DESC LIMIT 1
    `, [`${year}-${month}-%`]);

    // Generate the new codeId based on a random number (6 digits)
    let newId = Math.floor(Math.random() * 1000000); // Random number between 0 and 999999
    newId = newId.toString().padStart(6, '0'); // Pad with leading zeros if necessary

    const codeId = `${year}-${month}-${newId}`;

    // Insert the new record with the generated `codeId`
    await queryDatabase(`
      INSERT INTO user_details_step1 (
        userId, firstName, middleName, lastName, age, gender, dateOfBirth,
        placeOfBirth, address, education, civilStatus, occupation, religion,
        company, income, employmentStatus, contactNumber, email, pantawidBeneficiary,
        indigenous, codeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      firstName, 
      middleName, 
      lastName, 
      age, 
      gender, 
      dateOfBirth,
      placeOfBirth, 
      address, 
      education, 
      civilStatus, 
      occupation, 
      religion,
      company, 
      income, 
      employmentStatus, 
      contactNumber, 
      email, 
      pantawidBeneficiary,
      indigenous, 
      codeId
    ]);

    res.status(201).json({ message: 'Data inserted successfully with random codeId value' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting data into user_details_step1' });
  }
});

app.post('/userDetailsStep2', async (req, res) => {
  const { userId, numberOfChildren, children } = req.body;

  try {
    // Insert each child as a new row
    for (let i = 0; i < numberOfChildren; i++) {
      const child = children[i];
      await queryDatabase(`
        INSERT INTO user_details_step2(user_id, first_name, middle_name, last_name, birthdate, age, educational_attainment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        child.firstName,
        child.middleName,
        child.lastName,
        child.birthdate,
        child.age,
        child.educationalAttainment
      ]);
    }

    res.status(201).json({ message: 'Family and occupation data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving family and occupation data', details: err.message });
  }
});

app.post('/userDetailsStep3', async (req, res) => {
  const { userId, classification, othersDetails } = req.body;

  try {
    if (!userId || !classification) {
      return res.status(400).json({ error: 'Missing required fields: userId or classification' });
    }

    const saveValue = classification === '013' ? othersDetails : classification;

    await queryDatabase(`
      INSERT INTO user_details_step3 (userId, classification) 
      VALUES (?, ?)
    `, [userId, saveValue]);

    res.status(201).json({ message: 'Classification data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving classification data', details: err.message });
  }
});

app.post('/userDetailsStep4', async (req, res) => {
  const { userId, needsProblems } = req.body;

  try {
    if (!userId || !needsProblems) {
      return res.status(400).json({ error: 'Missing required fields: userId or needsProblems' });
    }

    await queryDatabase(`
      INSERT INTO user_details_step4 (userId, needsProblems) 
      VALUES (?, ?)
    `, [userId, needsProblems]);

    res.status(201).json({ message: 'Needs/problems data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving needs/problems data', details: err.message });
  }
});

app.post('/userDetailsStep5', async (req, res) => {
  const {
    userId,
    emergencyName,
    emergencyRelationship,
    emergencyAddress,
    emergencyContact
  } = req.body;

  try {
    if (!userId || !emergencyName || !emergencyRelationship || !emergencyAddress || !emergencyContact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await queryDatabase(`
      INSERT INTO user_details_step5 (user_id, emergency_name, emergency_relationship, emergency_address, emergency_contact)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, emergencyName, emergencyRelationship, emergencyAddress, emergencyContact]);

    res.status(201).json({ message: 'Emergency contact data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving emergency contact data', details: err.message });
  }
});

app.post('/updateUserStatus', async (req, res) => {
  const { userId, status, remarks } = req.body;
  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      // Start transaction
      await queryDatabase('START TRANSACTION');

      // First get the current status of the user with FOR UPDATE to lock the row
      const userResult = await queryDatabase('SELECT status FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (!userResult || userResult.length === 0) {
        throw new Error('User not found');
      }
      const currentStatus = userResult[0].status;

      // Update the user's status
      await queryDatabase('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

      if (status === "Declined" && remarks) {
        // Check if there's already a declined notification for this user
        const existingDeclined = await queryDatabase(
          'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0',
          [userId]
        );

        if (existingDeclined.length === 0) {
          await queryDatabase(
            'INSERT INTO declined_users (user_id, remarks, declined_at, is_read) VALUES (?, ?, NOW(), 0)', 
            [userId, remarks]
          );
        }
      }

      if (status === "Verified") {
        // Check if there's already an unread notification for this user with the same message
        const message = currentStatus === "Renewal" ? 'You have renewed' : 'Your application has been accepted.';
        const existingAccepted = await queryDatabase(
          'SELECT * FROM accepted_users WHERE user_id = ? AND message = ? AND is_read = 0',
          [userId, message]
        );

        if (existingAccepted.length === 0) {
          // Only insert if there's no existing unread notification with the same message
          await queryDatabase(
            'INSERT INTO accepted_users (user_id, accepted_at, message, is_read) VALUES (?, NOW(), ?, 0)', 
            [userId, message]
          );
        }
      }

      // Commit transaction
      await queryDatabase('COMMIT');
      res.status(200).json({ message: 'User status updated successfully' });
      return;

    } catch (err) {
      // Rollback transaction
      await queryDatabase('ROLLBACK');
      lastError = err;
      
      // If it's not a lock timeout error, throw immediately
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        throw err;
      }
      
      retries--;
      if (retries === 0) {
        console.error('Error updating user status after all retries:', err);
        res.status(500).json({ error: 'Database error while updating user status. Please try again.' });
      } else {
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
});

app.post('/updateUserProfile', async (req, res) => {
  const { userId, profilePic } = req.body;
  
  try {
    if (!userId || !profilePic) {
      return res.status(400).json({ error: 'Missing required fields: userId or profilePic' });
    }
    
    await queryDatabase('UPDATE users SET profilePic = ? WHERE id = ?', [profilePic, userId]);
    
    res.status(200).json({ success: true, message: 'Profile picture updated successfully' });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ error: 'Database error while updating profile picture' });
  }
});

app.post('/submitAllSteps', async (req, res) => {
  const { userId, formData } = req.body;

  try {
    const user = await queryDatabase('SELECT status FROM users WHERE id = ?', [userId]);
    if (user[0].status === 'pending') {
      return res.status(400).json({ error: 'Your verification form is pending. Please wait for approval before submitting again.' });
    }

    const createDate = new Date();
    const year = createDate.getFullYear();
    const month = (createDate.getMonth() + 1).toString().padStart(2, '0');
    const newId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const codeId = `${year}-${month}-${newId}`;

    await queryDatabase('START TRANSACTION');

    await queryDatabase('UPDATE users SET status = ? WHERE id = ?', ['pending', userId]);

    await queryDatabase(`
      INSERT INTO user_details_step1 (
        user_id, first_name, middle_name, last_name, age, gender, date_of_birth,
        place_of_birth, address, education, civil_status, occupation, religion,
        company, income, employment_status, contact_number, email, pantawid_beneficiary,
        indigenous, code_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      formData.firstName || "", 
      formData.middleName || "", 
      formData.lastName || "", 
      formData.age || "", 
      formData.gender || "", 
      formData.dateOfBirth || "", 
      formData.placeOfBirth || "", 
      formData.address || "", 
      formData.education || "", 
      formData.civilStatus || "", 
      formData.occupation || "", 
      formData.religion || "", 
      formData.company || "", 
      formData.income || "", 
      formData.employmentStatus || "", 
      formData.contactNumber || "", 
      formData.email || "", 
      formData.pantawidBeneficiary || "",
      formData.indigenous || "", 
      codeId
    ]);

    if (formData.children && formData.children.length > 0) {
      console.log("Processing children:", JSON.stringify(formData.children, null, 2));
      for (const child of formData.children) {
        await queryDatabase(
          'INSERT INTO user_details_step2 (user_id, first_name, middle_name, last_name, birthdate, age, educational_attainment, code_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userId, 
            child.firstName || "", 
            child.middleName || "", 
            child.lastName || "", 
            child.birthdate || "", 
            child.age || "", 
            child.educationalAttainment || "", 
            codeId
          ]
        );
      }
    }

    await queryDatabase(
      'INSERT INTO user_details_step3 (user_id, classification, code_id) VALUES (?, ?, ?)',
      [userId, formData.Classification || "", codeId]
    );

    await queryDatabase(
      'INSERT INTO user_details_step4 (user_id, needs_problems, code_id) VALUES (?, ?, ?)',
      [userId, formData.needsProblems || "", codeId]
    );

    await queryDatabase(
      'INSERT INTO user_details_step5 (user_id, emergency_name, emergency_address, emergency_relationship, emergency_contact, code_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        formData.emergencyContact?.emergencyName || "",
        formData.emergencyContact?.emergencyAddress || "",
        formData.emergencyContact?.emergencyRelationship || "",
        formData.emergencyContact?.emergencyContact || "",
        codeId
      ]
    );

    await queryDatabase('COMMIT');
    res.status(201).json({ message: 'Form submitted successfully. Your verification is now pending.', codeId });

  } catch (err) {
    await queryDatabase('ROLLBACK');
    console.error('Error saving form data:', err);
    res.status(500).json({ error: 'Error saving form data: ' + err.message });
  }
});

// Debug endpoint to check user_details_step2 relationships
app.get('/debug/user-children', async (req, res) => {
  try {
    const results = await queryDatabase(`
      SELECT 
        u.id as user_id,
        u.name as parent_name,
        u.email as parent_email,
        s2.first_name,
        s2.middle_name,
        s2.last_name,
        s2.birthdate,
        s2.age,
        s2.educational_attainment
      FROM users u
      LEFT JOIN user_details_step2 s2 ON u.id = s2.user_id
      ORDER BY u.id, s2.first_name
    `);
    
    // Group children by parent
    const userChildren = {};
    results.forEach(row => {
      if (!userChildren[row.user_id]) {
        userChildren[row.user_id] = {
          parent_name: row.parent_name,
          parent_email: row.parent_email,
          children: []
        };
      }
      if (row.first_name) { // Only add if there's actually a child
        userChildren[row.user_id].children.push({
          first_name: row.first_name,
          middle_name: row.middle_name,
          last_name: row.last_name,
          birthdate: row.birthdate,
          age: row.age,
          educational_attainment: row.educational_attainment
        });
      }
    });
    
    res.status(200).json(userChildren);
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ error: 'Error fetching user-children relationships' });
  }
});

app.get('/notifications/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Get all notifications (both read and unread) ordered by date
    const accepted = await queryDatabase(
      'SELECT accepted_at, is_read, message FROM accepted_users WHERE user_id = ? ORDER BY accepted_at DESC', 
      [userId]
    );
    
    const declined = await queryDatabase(
      'SELECT declined_at, remarks, is_read FROM declined_users WHERE user_id = ? ORDER BY declined_at DESC', 
      [userId]
    );
    
    let notifications = [];

    // Add all accepted notifications (including renewals)
    accepted.forEach(accept => {
      notifications.push({
        id: `accepted-${userId}-${accept.accepted_at}`,
        type: accept.message === "You have renewed" ? 'renewal_accepted' : 'application_accepted',
        message: accept.message,
        read: accept.is_read === 1, // Convert to boolean
        created_at: accept.accepted_at,
      });
    });

    // Add declined notifications
    declined.forEach(decline => {
      notifications.push({
        id: `declined-${userId}-${decline.declined_at}`,
        type: 'application_declined',
        message: `Your application has been declined. Remarks: ${decline.remarks}`,
        read: decline.is_read === 1, // Convert to boolean
        created_at: decline.declined_at,
      });
    });

    // Sort all notifications by date
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
      // Start transaction
      await queryDatabase('START TRANSACTION');

      if (type === 'application_accepted' || type === 'renewal_accepted') {
        // Update all unread accepted notifications for this user with FOR UPDATE
        await queryDatabase(
          'SELECT * FROM accepted_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        
        await queryDatabase(
          'UPDATE accepted_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      } else if (type === 'application_declined') {
        // Update all unread declined notifications for this user with FOR UPDATE
        await queryDatabase(
          'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
          [userId]
        );
        
        await queryDatabase(
          'UPDATE declined_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [userId]
        );
      }

      // Commit transaction
      await queryDatabase('COMMIT');
      res.json({ success: true, message: 'Notification marked as read' });
      return;

    } catch (err) {
      // Rollback transaction
      await queryDatabase('ROLLBACK');
      
      // If it's not a lock timeout error, throw immediately
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        throw err;
      }
      
      retries--;
      if (retries === 0) {
        console.error('Error updating notification after all retries:', err);
        res.status(500).json({ error: 'Database error while updating notifications. Please try again.' });
      } else {
        // Wait for a short time before retrying
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
      // Start transaction
      await queryDatabase('START TRANSACTION');

      // Lock and update accepted notifications
      await queryDatabase(
        'SELECT * FROM accepted_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      
      await queryDatabase(
        'UPDATE accepted_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      // Lock and update declined notifications
      await queryDatabase(
        'SELECT * FROM declined_users WHERE user_id = ? AND is_read = 0 FOR UPDATE',
        [userId]
      );
      
      await queryDatabase(
        'UPDATE declined_users SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      // Commit transaction
      await queryDatabase('COMMIT');
      res.json({ success: true, message: 'All notifications marked as read' });
      return;

    } catch (err) {
      // Rollback transaction
      await queryDatabase('ROLLBACK');
      
      // If it's not a lock timeout error, throw immediately
      if (err.code !== 'ER_LOCK_WAIT_TIMEOUT') {
        throw err;
      }
      
      retries--;
      if (retries === 0) {
        console.error('Error updating notifications after all retries:', err);
        res.status(500).json({ error: 'Database error while updating notifications. Please try again.' });
      } else {
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
});

app.get('/renewalUsers/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // First get the admin's barangay
    const adminResult = await queryDatabase('SELECT barangay FROM admin WHERE id = ?', [adminId]);
    
    if (adminResult.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminBarangay = adminResult[0].barangay;

    // Get renewal users from the same barangay as the admin
    const users = await queryDatabase(`
      SELECT u.id AS userId, u.email, u.name, u.status, u.barangay,
             s1.first_name, s1.middle_name, s1.last_name, s1.age, s1.gender, 
             s1.date_of_birth, s1.place_of_birth, s1.address, s1.education, 
             s1.civil_status, s1.occupation, s1.religion, s1.company, 
             s1.income, s1.employment_status, s1.contact_number, s1.email, 
             s1.pantawid_beneficiary, s1.indigenous, s1.code_id,
             s3.classification,
             s4.needs_problems,
             s5.emergency_name, s5.emergency_relationship, 
             s5.emergency_address, s5.emergency_contact

      FROM users u
      JOIN user_details_step1 s1 ON u.id = s1.user_id
      LEFT JOIN user_details_step3 s3 ON u.id = s3.user_id
      LEFT JOIN user_details_step4 s4 ON u.id = s4.user_id
      LEFT JOIN user_details_step5 s5 ON u.id = s5.user_id
      WHERE u.status = 'Renewal' AND u.barangay = ?
    `, [adminBarangay]);

    // For each user, get their children
    const usersWithChildren = await Promise.all(users.map(async (user) => {
      const children = await queryDatabase(`
        SELECT first_name, middle_name, last_name, birthdate, age, educational_attainment
        FROM user_details_step2
        WHERE user_id = ?
      `, [user.userId]);

      return {
        ...user,
        children: children
      };
    }));

    res.status(200).json(usersWithChildren);
  } catch (err) {
    console.error('Error fetching renewal users:', err);
    res.status(500).json({ error: 'Error fetching renewal users' });
  }
});

// Update accepted users table - modified to always insert new entries
app.post('/updateAcceptedUser', async (req, res) => {
  const { userId, message } = req.body;
  
  try {
    // Always insert a new record instead of updating
    await queryDatabase(
      'INSERT INTO accepted_users (user_id, message, accepted_at) VALUES (?, ?, NOW())',
      [userId, message]
    );

    res.status(200).json({ message: 'New notification added successfully' });
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ error: 'Failed to add notification' });
  }
});

// Add proper server startup
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  pool.end((err) => {
    if (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
});