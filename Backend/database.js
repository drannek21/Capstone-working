const mysql = require('mysql');

// Create MySQL connection pool
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

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

// Promisified query function
const queryDatabase = (sql, params) => new Promise((resolve, reject) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err);
      return reject(err);
    }

    connection.query(sql, params, (err, result) => {
      connection.release(); 
      if (err) {
        console.error('Query error:', err);
        return reject(err);
      }
      resolve(result);
    });
  });
});

// Insert or update document
const upsertDocument = async (tableName, code_id, file_name, display_name) => {
  try {
    console.log('Upserting document:', { tableName, code_id, file_name, display_name });

    // First check if document exists
    const checkQuery = `SELECT * FROM ${tableName} WHERE code_id = ?`;
    const existingDoc = await queryDatabase(checkQuery, [code_id]);
    console.log('Existing document:', existingDoc);

    let result;
    if (existingDoc && existingDoc.length > 0) {
      // Update existing document
      const updateQuery = `
        UPDATE ${tableName} 
        SET file_name = ?, 
            display_name = ?, 
            status = 'Uploaded',
            uploaded_at = CURRENT_TIMESTAMP
        WHERE code_id = ?
      `;
      result = await queryDatabase(updateQuery, [file_name, display_name, code_id]);
      console.log('Updated existing document:', result);
    } else {
      // Insert new document
      const insertQuery = `
        INSERT INTO ${tableName} (code_id, file_name, display_name, status)
        VALUES (?, ?, ?, 'Uploaded')
      `;
      result = await queryDatabase(insertQuery, [code_id, file_name, display_name]);
      console.log('Inserted new document:', result);
    }

    return { 
      success: true, 
      id: result.insertId || existingDoc[0]?.id,
      action: existingDoc.length > 0 ? 'updated' : 'inserted'
    };
  } catch (error) {
    console.error(`Error upserting document in ${tableName}:`, error);
    throw error;
  }
};

// Get document status
const getDocumentStatus = async (tableName, code_id) => {
  try {
    const query = `
      SELECT id, file_name, display_name, status, rejection_reason, uploaded_at
      FROM ${tableName}
      WHERE code_id = ?
      ORDER BY uploaded_at DESC
      LIMIT 1
    `;
    const results = await queryDatabase(query, [code_id]);
    console.log(`Document status for ${tableName}:`, results[0] || null);
    return results[0] || null;
  } catch (error) {
    console.error(`Error getting document status from ${tableName}:`, error);
    throw error;
  }
};

// Delete document
const deleteDocument = async (tableName, code_id) => {
  try {
    const query = `DELETE FROM ${tableName} WHERE code_id = ?`;
    const result = await queryDatabase(query, [code_id]);
    console.log(`Deleted document from ${tableName}:`, result);
    return { 
      success: true,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`Error deleting document from ${tableName}:`, error);
    throw error;
  }
};

// Get all documents for a user
const getUserDocuments = async (code_id) => {
  try {
    console.log('Getting documents for code_id:', code_id);
    const tables = [
      'psa_documents',
      'itr_documents',
      'med_cert_documents',
      'marriage_documents',
      'cenomar_documents',
      'death_cert_documents'
    ];

    const documents = {};
    for (const table of tables) {
      try {
        const doc = await getDocumentStatus(table, code_id);
        if (doc) {
          const docType = table.replace('_documents', '');
          documents[docType] = {
            id: doc.id,
            url: doc.file_name,
            name: doc.display_name,
            status: doc.status,
            uploaded_at: doc.uploaded_at
          };
        }
      } catch (error) {
        console.error(`Error getting document from ${table}:`, error);
      }
    }

    console.log('Retrieved documents:', documents);
    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

module.exports = {
  pool,
  queryDatabase,
  upsertDocument,
  getDocumentStatus,
  deleteDocument,
  getUserDocuments
};
