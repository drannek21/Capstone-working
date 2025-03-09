const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'soloparent',
});

const queryDatabase = (sql, params) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
});

app.post('/users', async (req, res) => {
  const { email, password, name, role, status } = req.body;
  try {
    await queryDatabase('INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, ?, ?)', 
      [email, password, name, role, status]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error inserting user into database' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const results = await queryDatabase('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (results.length > 0) {
      res.status(200).json({ user: results[0] }); 
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/getUserDetails', async (req, res) => {
  const { userId } = req.body;
  try {
    const results = await queryDatabase('SELECT * FROM users WHERE id = ?', [userId]);
    if (results.length > 0) {
      res.status(200).json(results[0]); 
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
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
      userId, firstName, middleName, lastName, age, gender, dateOfBirth,
      placeOfBirth, address, education, civilStatus, occupation, religion,
      company, income, employmentStatus, contactNumber, email, pantawidBeneficiary,
      indigenous, codeId
    ]);

    res.status(201).json({ message: 'Data inserted successfully with random codeId value' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting data into user_details_step1' });
  }
});

app.listen(8081, () => {
  console.log('Server is listening on port 8081');
});
