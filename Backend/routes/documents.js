const express = require('express');
const router = express.Router();
const { queryDatabase, upsertDocument, deleteDocument, getUserDocuments } = require('../database');
const { pool } = require('../database');

// Map frontend document types to database table names
const TABLE_NAMES = {
  'psa': 'psa_documents',
  'itr': 'itr_documents',
  'med_cert': 'med_cert_documents',
  'marriage': 'marriage_documents',
  'cenomar': 'cenomar_documents',
  'death_cert': 'death_cert_documents',
  'barangay_cert': 'barangay_cert_documents'
};

// Update user document
router.post('/updateUserDocument', async (req, res) => {
  let connection;
  try {
    const { userId, documentType, documentUrl, displayName } = req.body;
    console.log('Received document update request:', req.body);
    
    if (!userId || !documentType || !documentUrl || !displayName) {
      console.error('Missing required fields:', { userId, documentType, documentUrl, displayName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          userId: !userId ? 'missing' : 'present',
          documentType: !documentType ? 'missing' : 'present',
          documentUrl: !documentUrl ? 'missing' : 'present',
          displayName: !displayName ? 'missing' : 'present'
        }
      });
    }
    
    // Get connection and start transaction
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Get the user's code_id first
    const userQuery = 'SELECT code_id FROM users WHERE id = ?';
    console.log('Executing user query:', userQuery, 'with userId:', userId);
    const userResult = await new Promise((resolve, reject) => {
      connection.query(userQuery, [userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('User query result:', userResult);
    
    if (!userResult || userResult.length === 0) {
      console.error('User not found:', userId);
      throw new Error(`User with ID ${userId} not found`);
    }

    const code_id = userResult[0].code_id;
    console.log('Found code_id:', code_id);

    // Validate table name
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      console.error('Invalid document type:', documentType);
      throw new Error(`Invalid document type: ${documentType}`);
    }

    // Check if document already exists
    const checkDocQuery = `SELECT id FROM ${tableName} WHERE code_id = ? LIMIT 1`;
    const existingDoc = await new Promise((resolve, reject) => {
      connection.query(checkDocQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('Existing document check:', existingDoc);

    let result;
    if (existingDoc && existingDoc.length > 0) {
      // Update existing document
      console.log(`Document already exists for ${documentType}, updating instead of inserting`);
      const updateQuery = `
        UPDATE ${tableName} 
        SET file_name = ?, uploaded_at = ?, display_name = ?, status = ?
        WHERE code_id = ?`;
      result = await new Promise((resolve, reject) => {
        connection.query(updateQuery, [documentUrl, new Date(), displayName, 'Pending', code_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log('Document update result:', result);
    } else {
      // Insert new document
      const insertQuery = `
        INSERT INTO ${tableName} (code_id, file_name, uploaded_at, display_name, status)
        VALUES (?, ?, ?, ?, ?)`;
      result = await new Promise((resolve, reject) => {
        connection.query(insertQuery, [code_id, documentUrl, new Date(), displayName, 'Pending'], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log('Document insert result:', result);
    }

    // Commit the transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          connection.rollback(() => reject(err));
        } else {
          resolve();
        }
      });
    });

    res.json({ 
      success: true, 
      message: existingDoc.length > 0 ? 'Document updated successfully' : 'Document inserted successfully',
      documentId: result.insertId || existingDoc[0]?.id
    });
  } catch (error) {
    console.error('Error updating document:', error);
    
    // Rollback transaction if there was an error
    if (connection) {
      await new Promise(resolve => {
        connection.rollback(() => resolve());
      });
    }
    
    res.status(500).json({ error: 'Failed to update document', details: error.message });
  } finally {
    // Release connection
    if (connection) {
      connection.release();
    }
  }
});

// Get all documents for a user
router.get('/getUserDocuments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching documents for userId:', userId);

    // Get user's code_id
    const userQuery = 'SELECT code_id FROM users WHERE id = ?';
    console.log('Executing user query:', userQuery, 'with userId:', userId);
    const userResult = await queryDatabase(userQuery, [userId]);
    console.log('User query result:', userResult);
    
    if (!userResult || userResult.length === 0) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }

    const code_id = userResult[0].code_id;
    console.log('Found code_id:', code_id);

    // Get all documents for the user
    const documents = await getUserDocuments(code_id);
    console.log('Retrieved documents:', documents);

    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
});

// Delete document
router.post('/deleteDocument', async (req, res) => {
  try {
    const { userId, documentType } = req.body;
    console.log('Received delete request:', req.body);
    
    if (!userId || !documentType) {
      console.error('Missing required fields:', { userId, documentType });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the user's code_id first
    const userQuery = 'SELECT code_id FROM users WHERE id = ?';
    console.log('Executing user query:', userQuery, 'with userId:', userId);
    const userResult = await queryDatabase(userQuery, [userId]);
    console.log('User query result:', userResult);
    
    if (!userResult || userResult.length === 0) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }

    const code_id = userResult[0].code_id;
    console.log('Found code_id:', code_id);

    // Validate table name
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      console.error('Invalid document type:', documentType);
      return res.status(400).json({ error: `Invalid document type: ${documentType}` });
    }

    // Delete from database
    const result = await deleteDocument(tableName, code_id);
    console.log('Delete result:', result);

    res.json({ 
      success: true, 
      message: 'Document deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
});

// Submit all steps
router.post('/submitAllSteps', async (req, res) => {
  let connection;
  try {
    const { step1, step2, step3, step4, step5 } = req.body;
    console.log('Received all steps data:', req.body);
    
    // Get connection and start transaction
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
    
    // Use the strongest transaction isolation level
    await new Promise((resolve, reject) => {
      connection.query("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // First, check if an entry with this email already exists
    const timestamp = Date.now();
    console.log(`[${timestamp}] Checking for existing email: ${step1.email}`);
    
    const emailCheckQuery = `SELECT code_id FROM step1_identifying_information WHERE email = ? LIMIT 1`;
    const existingEmail = await new Promise((resolve, reject) => {
      connection.query(emailCheckQuery, [step1.email], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // If entry already exists with this email, reject the submission
    if (existingEmail && existingEmail.length > 0) {
      console.log(`[${timestamp}] Found existing entry with email ${step1.email}, code_id: ${existingEmail[0].code_id}`);
      await new Promise((resolve) => connection.rollback(() => resolve()));
      connection.release();
      
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        details: `A form with email ${step1.email} has already been submitted.`,
        existing_code_id: existingEmail[0].code_id
      });
    }
    
    // Generate a code_id with the format XXXX_XX_XXXXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Generate a random 6-digit number for the last part
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const code_id = `${year}_${month}_${randomDigits}`;
    
    console.log(`[${timestamp}] Generated code_id: ${code_id}`);
    console.log(`[${timestamp}] Starting transaction with code_id: ${code_id}`);

    try {
      // Step 1: Insert identifying information
      console.log(`[${timestamp}] Inserting step 1...`);
      const step1Query = `
        INSERT INTO step1_identifying_information (
          code_id, first_name, middle_name, last_name, age, gender,
          date_of_birth, place_of_birth, barangay, education,
          civil_status, occupation, religion, company, income,
          employment_status, contact_number, email,
          pantawid_beneficiary, indigenous
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(step1Query, [
          code_id,
          step1.first_name,
          step1.middle_name,
          step1.last_name,
          step1.age,
          step1.gender,
          step1.date_of_birth,
          step1.place_of_birth,
          step1.barangay,
          step1.education,
          step1.civil_status,
          step1.occupation,
          step1.religion,
          step1.company,
          step1.income,
          step1.employment_status,
          step1.contact_number,
          step1.email,
          step1.pantawid_beneficiary,
          step1.indigenous
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`[${timestamp}] Step 1 inserted`);

      // Step 2: Insert children information
      console.log(`[${timestamp}] Inserting step 2...`);
      if (step2.children && step2.children.length > 0) {
        const childrenQuery = `
          INSERT INTO step2_family_occupation (
            code_id, family_member_name, age, educational_attainment, birthdate
          ) VALUES ?
        `;
        const childrenValues = step2.children.map(child => [
          code_id,
          `${child.first_name} ${child.middle_name} ${child.last_name}`.trim(),
          child.age,
          child.educational_attainment,
          child.birthdate
        ]);
        
        await new Promise((resolve, reject) => {
          connection.query(childrenQuery, [childrenValues], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        console.log(`[${timestamp}] Step 2 inserted`);
      } else {
        console.log(`[${timestamp}] No children to insert for step 2`);
      }

      // Step 3: Insert classification
      console.log(`[${timestamp}] Inserting step 3...`);
      const step3Query = `
        INSERT INTO step3_classification (
          code_id, classification
        ) VALUES (?, ?)
      `;
      await new Promise((resolve, reject) => {
        connection.query(step3Query, [
          code_id,
          step3.classification
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`[${timestamp}] Step 3 inserted`);

      // Step 4: Insert needs/problems
      console.log(`[${timestamp}] Inserting step 4...`);
      const step4Query = `
        INSERT INTO step4_needs_problems (
          code_id, needs_problems
        ) VALUES (?, ?)
      `;
      await new Promise((resolve, reject) => {
        connection.query(step4Query, [
          code_id,
          step4.needs_problems
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`[${timestamp}] Step 4 inserted`);

      // Step 5: Insert emergency contact
      console.log(`[${timestamp}] Inserting step 5...`);
      const step5Query = `
        INSERT INTO step5_in_case_of_emergency (
          code_id, emergency_name, emergency_relationship,
          emergency_address, emergency_contact
        ) VALUES (?, ?, ?, ?, ?)
      `;
      await new Promise((resolve, reject) => {
        connection.query(step5Query, [
          code_id,
          step5.emergency_name,
          step5.emergency_relationship,
          step5.emergency_address,
          step5.emergency_contact
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`[${timestamp}] Step 5 inserted`);

      // Create user account in the same transaction
      console.log(`[${timestamp}] Creating user account...`);
      
      // First check if user with this email already exists
      const checkEmailQuery = `SELECT id, email FROM users WHERE email = ? LIMIT 1`;
      const existingUser = await new Promise((resolve, reject) => {
        connection.query(checkEmailQuery, [step1.email], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      // Create name by combining first, middle and last names
      const fullName = `${step1.first_name} ${step1.middle_name || ''} ${step1.last_name}`.trim().replace(/\s+/g, ' ');
      
      // Use the birthdate as the password
      const password = step1.date_of_birth;
      
      if (existingUser && existingUser.length > 0) {
        // If user already exists, update their code_id
        console.log(`[${timestamp}] User with email ${step1.email} already exists, updating code_id`);
        const updateQuery = `UPDATE users SET code_id = ? WHERE id = ?`;
        await new Promise((resolve, reject) => {
          connection.query(updateQuery, [code_id, existingUser[0].id], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        console.log(`[${timestamp}] Updated existing user with new code_id`);
      } else {
        // If user doesn't exist, create new user
        console.log(`[${timestamp}] Creating new user with email ${step1.email}`);
        const userQuery = `
          INSERT INTO users (
            email, code_id, status, name, password
          ) VALUES (?, ?, ?, ?, ?)
        `;
        
        await new Promise((resolve, reject) => {
          connection.query(userQuery, [
            step1.email, 
            code_id, 
            'Pending',
            fullName,
            password
          ], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        console.log(`[${timestamp}] User account created with password set to birthdate`);
      }

      // Commit transaction only after all operations succeed
      await new Promise((resolve, reject) => {
        connection.commit(err => {
          if (err) {
            console.error(`[${timestamp}] Error committing transaction:`, err);
            return connection.rollback(() => reject(err));
          }
          resolve();
        });
      });

      console.log(`[${timestamp}] All steps committed successfully`);

      res.json({
        success: true,
        message: 'All steps submitted successfully',
        code_id: code_id
      });
    } catch (innerError) {
      // If we encounter any error during the insert steps, roll back and throw
      console.error(`[${timestamp}] Error during steps submission:`, innerError);
      await new Promise((resolve) => connection.rollback(() => resolve()));
      throw innerError;
    }
  } catch (error) {
    console.error('Error submitting steps:', error);
    // Roll back transaction if an error occurred
    if (connection) {
      try {
        await new Promise((resolve) => connection.rollback(() => resolve()));
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    
    // Provide user-friendly error responses based on error type
    if (error.code === 'ER_DUP_ENTRY') {
      const match = error.message.match(/key '(.+?)'/);
      const keyName = match ? match[1] : 'unknown';
      
      res.status(400).json({
        success: false,
        error: 'Duplicate entry detected',
        details: `A record with this ${keyName.includes('email') ? 'email' : 'information'} already exists.`,
        errorCode: error.code
      });
    } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
      res.status(409).json({
        success: false,
        error: 'Database busy',
        details: 'The system is currently processing another request. Please try again in a moment.',
        errorCode: error.code
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to submit steps',
        details: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR'
      });
    }
  } finally {
    if (connection) {
      // Reset isolation level before releasing
      try {
        await new Promise(resolve => {
          connection.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ", () => {
            resolve();
          });
        });
      } catch (err) {
        console.error('Error resetting isolation level:', err);
      }
      
      connection.release();
    }
  }
});

// Handle document upload
router.post('/:documentType', async (req, res) => {
  const { documentType } = req.params;
  const { code_id, file_name, uploaded_at, display_name, status = 'Pending' } = req.body;
  let connection;

  console.log('Received document upload request:', req.body);

  try {
    // Validate document type
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      throw new Error(`Invalid document type: ${documentType}`);
    }

    // Get a connection and start transaction
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verify the code_id exists in step1_identifying_information
    const verifyQuery = `SELECT code_id FROM step1_identifying_information WHERE code_id = ? LIMIT 1`;
    const verifyResult = await new Promise((resolve, reject) => {
      connection.query(verifyQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    if (!verifyResult || verifyResult.length === 0) {
      console.error('Invalid code_id:', code_id);
      console.error('Verification result:', verifyResult);
      throw new Error(`Invalid code_id: ${code_id}`);
    }

    // Check if document already exists
    const existingDocQuery = `SELECT * FROM ${tableName} WHERE code_id = ? LIMIT 1`;
    const existingDoc = await new Promise((resolve, reject) => {
      connection.query(existingDocQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('Existing document:', existingDoc);

    let result;
    if (existingDoc.length > 0) {
      // Update existing document
      const updateQuery = `
        UPDATE ${tableName} 
        SET file_name = ?, uploaded_at = ?, display_name = ?, status = ?
        WHERE code_id = ?`;
      result = await new Promise((resolve, reject) => {
        connection.query(updateQuery, [file_name, new Date(), display_name, 'Submitted', code_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log('Updated document:', result);
    } else {
      // Insert new document
      const insertQuery = `
        INSERT INTO ${tableName} (code_id, file_name, uploaded_at, display_name, status)
        VALUES (?, ?, ?, ?, ?)`;
      result = await new Promise((resolve, reject) => {
        connection.query(insertQuery, [code_id, file_name, new Date(), display_name, 'Submitted'], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log('Inserted document:', result);
    }

    // Commit the transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          connection.rollback(() => reject(err));
        } else {
          resolve();
        }
      });
    });

    res.json({
      success: true,
      message: `Document ${existingDoc.length > 0 ? 'updated' : 'uploaded'} successfully`,
      documentId: result.insertId || existingDoc[0]?.id
    });
  } catch (error) {
    console.error(`Error uploading document to ${documentType}:`, error);
    
    // Rollback transaction if there was an error
    if (connection) {
      await new Promise(resolve => {
        connection.rollback(() => resolve());
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  } finally {
    // Release connection
    if (connection) {
      connection.release();
    }
  }
});

// Handle barangay certificate upload
router.post('/barangay_cert', async (req, res) => {
  let connection;
  try {
    const { code_id, file_name, display_name } = req.body;
    console.log('Received barangay certificate upload request:', req.body);

    if (!code_id || !file_name || !display_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: {
          code_id: !code_id ? 'missing' : 'present',
          file_name: !file_name ? 'missing' : 'present',
          display_name: !display_name ? 'missing' : 'present'
        }
      });
    }

    // Get connection and start transaction
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verify the code_id exists in users table
    const verifyQuery = `SELECT code_id FROM users WHERE code_id = ? LIMIT 1`;
    const verifyResult = await new Promise((resolve, reject) => {
      connection.query(verifyQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    if (!verifyResult || verifyResult.length === 0) {
      console.error('Invalid code_id:', code_id);
      throw new Error(`Invalid code_id: ${code_id}`);
    }

    // Check if document already exists
    const existingDocQuery = `SELECT * FROM barangay_cert_documents WHERE code_id = ? LIMIT 1`;
    const existingDoc = await new Promise((resolve, reject) => {
      connection.query(existingDocQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    let result;
    if (existingDoc.length > 0) {
      // Update existing document
      const updateQuery = `
        UPDATE barangay_cert_documents 
        SET file_name = ?, uploaded_at = ?, display_name = ?, status = ?
        WHERE code_id = ?`;
      result = await new Promise((resolve, reject) => {
        connection.query(updateQuery, [file_name, new Date(), display_name, 'Submitted', code_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } else {
      // Insert new document
      const insertQuery = `
        INSERT INTO barangay_cert_documents (code_id, file_name, uploaded_at, display_name, status)
        VALUES (?, ?, ?, ?, ?)`;
      result = await new Promise((resolve, reject) => {
        connection.query(insertQuery, [code_id, file_name, new Date(), display_name, 'Submitted'], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // Commit the transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          connection.rollback(() => reject(err));
        } else {
          resolve();
        }
      });
    });

    res.json({
      success: true,
      message: `Barangay certificate ${existingDoc.length > 0 ? 'updated' : 'uploaded'} successfully`,
      documentId: result.insertId || existingDoc[0]?.id
    });
  } catch (error) {
    console.error('Error uploading barangay certificate:', error);
    
    // Rollback transaction if there was an error
    if (connection) {
      await new Promise(resolve => {
        connection.rollback(() => resolve());
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload barangay certificate',
      details: error.message
    });
  } finally {
    // Release connection
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
