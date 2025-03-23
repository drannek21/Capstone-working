const express = require('express');
const router = express.Router();
const { queryDatabase, upsertDocument, deleteDocument } = require('../database');

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
    console.log('Received update request:', { userId, documentType, documentUrl, displayName });
    
    if (!userId || !documentType || !documentUrl || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the user's code_id first
    const userQuery = 'SELECT code_id FROM users WHERE id = ?';
    const userResult = await queryDatabase(userQuery, [userId]);
    console.log('User query result:', userResult);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const code_id = userResult[0].code_id;
    console.log('Found code_id:', code_id);

    // Validate table name
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Insert into database
    const result = await upsertDocument(tableName, code_id, documentUrl, displayName);
    console.log('Insert result:', result);

    res.json({ success: true, message: 'Document updated successfully' });
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
    const userResult = await queryDatabase(userQuery, [userId]);
    console.log('User query result:', userResult);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const code_id = userResult[0].code_id;
    console.log('Found code_id:', code_id);
    const documents = {};

    // Get documents from each table
    for (const [frontendType, tableName] of Object.entries(TABLE_NAMES)) {
      console.log(`Checking table ${tableName} for documents...`);
      const query = `
        SELECT file_name, display_name, status, uploaded_at 
        FROM ${tableName} 
        WHERE code_id = ?
        ORDER BY uploaded_at DESC 
        LIMIT 1
      `;
      
      try {
        const result = await queryDatabase(query, [code_id]);
        console.log(`Results for ${tableName}:`, result);
        if (result && result.length > 0) {
          documents[frontendType] = {
            url: result[0].file_name,
            name: result[0].display_name,
            status: result[0].status,
            uploaded_at: result[0].uploaded_at
          };
        }
      } catch (error) {
        console.error(`Error querying ${tableName}:`, error);
      }
    }

    console.log('Final documents object:', documents);
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.post('/deleteDocument', async (req, res) => {
  try {
    const { userId, documentType } = req.body;
    
    if (!userId || !documentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the user's code_id first
    const userQuery = 'SELECT code_id FROM users WHERE id = ?';
    const userResult = await queryDatabase(userQuery, [userId]);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const code_id = userResult[0].code_id;

    // Validate table name
    const tableName = TABLE_NAMES[documentType];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Delete from database
    await deleteDocument(tableName, code_id);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
