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

async function showDatabaseStructure() {
  try {
    // Get all tables
    const tables = await queryDatabase('SHOW TABLES FROM soloparent');
    console.log('Tables in database:');
    console.log(tables);
    
    // For each table, show its structure
    for (const tableObj of tables) {
      const tableName = tableObj[`Tables_in_soloparent`];
      const structure = await queryDatabase(`DESCRIBE ${tableName}`);
      console.log(`\nStructure of table ${tableName}:`);
      console.log(structure);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

showDatabaseStructure();

// Insert or update document
const upsertDocument = async (tableName, code_id, file_name, display_name) => {
  try {
    // Delete existing document if any
    const deleteQuery = `DELETE FROM ${tableName} WHERE code_id = ?`;
    await queryDatabase(deleteQuery, [code_id]);

    // Insert new document
    const insertQuery = `
      INSERT INTO ${tableName} (code_id, file_name, display_name, status)
      VALUES (?, ?, ?, 'Uploaded')
    `;
    const result = await queryDatabase(insertQuery, [code_id, file_name, display_name]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error(`Error upserting document in ${tableName}:`, error);
    throw error;
  }
};

// Get document status
const getDocumentStatus = async (tableName, code_id) => {
  try {
    const query = `
      SELECT file_name, status, rejection_reason, uploaded_at
      FROM ${tableName}
      WHERE code_id = ?
      ORDER BY uploaded_at DESC
      LIMIT 1
    `;
    const results = await queryDatabase(query, [code_id]);
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
    await queryDatabase(query, [code_id]);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document from ${tableName}:`, error);
    throw error;
  }
};

module.exports = {
  pool,
  queryDatabase,
  upsertDocument,
  getDocumentStatus,
  deleteDocument
};
