const mysql = require('mysql');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'soloparent',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log('Database config:', dbConfig);

const pool = mysql.createPool(dbConfig);

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

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

const upsertDocument = async (tableName, code_id, file_name, display_name, status = 'Pending') => {
  try {
    // Check if document exists
    const existingDoc = await queryDatabase(
      `SELECT * FROM ${tableName} WHERE code_id = ? LIMIT 1`,
      [code_id]
    );

    if (existingDoc.length > 0) {
      // Update existing document
      await queryDatabase(
        `UPDATE ${tableName} 
         SET file_name = ?, display_name = ?, status = ?
         WHERE code_id = ?`,
        [file_name, display_name, status, code_id]
      );
      return {
        action: 'updated',
        id: existingDoc[0].id
      };
    } else {
      // Insert new document
      const result = await queryDatabase(
        `INSERT INTO ${tableName} (code_id, file_name, display_name, status)
         VALUES (?, ?, ?, ?)`,
        [code_id, file_name, display_name, status]
      );
      return {
        action: 'inserted',
        id: result.insertId
      };
    }
  } catch (error) {
    console.error(`Error upserting document in ${tableName}:`, error);
    throw error;
  }
};

const deleteDocument = async (tableName, code_id) => {
  try {
    const result = await queryDatabase(
      `DELETE FROM ${tableName} WHERE code_id = ?`,
      [code_id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error deleting document from ${tableName}:`, error);
    throw error;
  }
};

const getUserDocuments = async (code_id) => {
  try {
    const documents = {};
    const tables = [
      'psa_documents',
      'itr_documents',
      'med_cert_documents',
      'marriage_documents',
      'cenomar_documents',
      'death_cert_documents'
    ];

    for (const table of tables) {
      const result = await queryDatabase(
        `SELECT * FROM ${table} WHERE code_id = ? LIMIT 1`,
        [code_id]
      );
      if (result.length > 0) {
        documents[table] = result[0];
      }
    }

    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

const getDocumentStatus = async (tableName, code_id) => {
  try {
    if (!code_id) {
      throw new Error('code_id is required');
    }

    const query = `
      SELECT id, file_name, uploaded_at, display_name, status, rejection_reason
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

module.exports = {
  pool,
  queryDatabase,
  upsertDocument,
  deleteDocument,
  getUserDocuments,
  getDocumentStatus
};
