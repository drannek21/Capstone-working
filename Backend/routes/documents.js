const express = require('express');
const router = express.Router();
const { queryDatabase, upsertDocument, deleteDocument, getUserDocuments } = require('../database');

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
    const result = await upsertDocument(tableName, code_id, documentUrl, displayName);
    console.log('Document upsert result:', result);

    res.json({ 
      success: true, 
      message: `Document ${result.action} successfully`,
      documentId: result.id
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

module.exports = router;
