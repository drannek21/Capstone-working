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
  'death_cert': 'death_cert_documents'
};

// Update user document
router.post('/updateUserDocument', async (req, res) => {
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

    // Insert into database
    const result = await queryDatabase(
      `INSERT INTO ${tableName} (code_id, file_name, uploaded_at, display_name, status)
       VALUES (?, ?, ?, ?, ?)`,
      [code_id, documentUrl, new Date(), displayName, 'Pending']
    );
    console.log('Document insert result:', result);

    res.json({ 
      success: true, 
      message: `Document inserted successfully`,
      documentId: result.insertId
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document', details: error.message });
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
    
    const { step1, step2, step3, step4, step5 } = req.body;
    console.log('Received all steps data:', req.body);

    // Generate a shorter code_id
    const code_id = `SP${Date.now().toString().slice(-10)}`;
    console.log('Generated code_id:', code_id);

    // Step 1: Insert identifying information
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
    console.log('Step 1 inserted');

    // Step 2: Insert children information
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
      console.log('Step 2 inserted');
    }

    // Step 3: Insert classification
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
    console.log('Step 3 inserted');

    // Step 4: Insert needs/problems
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
    console.log('Step 4 inserted');

    // Step 5: Insert emergency contact
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
    console.log('Step 5 inserted');

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) {
          console.error('Error committing transaction:', err);
          return connection.rollback(() => reject(err));
        }
        resolve();
      });
    });

    console.log('All steps committed successfully');

    // Verify the code_id exists in step1_identifying_information
    const verifyQuery = `SELECT code_id FROM step1_identifying_information WHERE code_id = ? LIMIT 1`;
    const verifyResult = await new Promise((resolve, reject) => {
      connection.query(verifyQuery, [code_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log('Verification result:', verifyResult);

    if (!verifyResult || verifyResult.length === 0) {
      throw new Error('Failed to verify code_id after commit');
    }

    res.json({
      success: true,
      message: 'All steps submitted successfully',
      code_id: code_id
    });
  } catch (error) {
    console.error('Error submitting steps:', error);
    if (connection) {
      try {
        await new Promise((resolve, reject) => {
          connection.rollback(err => {
            if (err) {
              console.error('Error rolling back:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit steps',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Handle document upload
router.post('/:documentType', async (req, res) => {
  const { documentType } = req.params;
  const { code_id, file_name, uploaded_at, display_name, status = 'Pending' } = req.body;

  console.log('Received document upload request:', req.body);

  try {
    // Validate document type
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      throw new Error(`Invalid document type: ${documentType}`);
    }

    // Verify the code_id exists in step1_identifying_information
    const verifyQuery = `SELECT code_id FROM step1_identifying_information WHERE code_id = ? LIMIT 1`;
    const verifyResult = await queryDatabase(verifyQuery, [code_id]);
    
    if (!verifyResult || verifyResult.length === 0) {
      console.error('Invalid code_id:', code_id);
      console.error('Verification result:', verifyResult);
      throw new Error(`Invalid code_id: ${code_id}`);
    }

    // Check if document already exists
    const existingDoc = await queryDatabase(
      `SELECT * FROM ${tableName} WHERE code_id = ? LIMIT 1`,
      [code_id]
    );
    console.log('Existing document:', existingDoc);

    let result;
    if (existingDoc.length > 0) {
      // Update existing document
      result = await queryDatabase(
        `UPDATE ${tableName} 
         SET file_name = ?, uploaded_at = ?, display_name = ?, status = ?
         WHERE code_id = ?`,
        [file_name, new Date(), display_name, status, code_id]
      );
      console.log('Updated document:', result);
    } else {
      // Insert new document
      result = await queryDatabase(
        `INSERT INTO ${tableName} (code_id, file_name, uploaded_at, display_name, status)
         VALUES (?, ?, ?, ?, ?)`,
        [code_id, file_name, new Date(), display_name, status]
      );
      console.log('Inserted document:', result);
    }

    res.json({
      success: true,
      message: `Document ${existingDoc.length > 0 ? 'updated' : 'uploaded'} successfully`,
      documentId: result.insertId || existingDoc[0]?.id
    });
  } catch (error) {
    console.error(`Error uploading document to ${documentType}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

module.exports = router;
