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
});const { queryDatabase } = require('./database.js');

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

module.exports = { pool, queryDatabase };
