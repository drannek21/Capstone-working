app.post('/updateUserStatus', async (req, res) => {
  const { userId, status, remarks } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update user status
    await connection.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    // Insert notification
    await connection.query(
      `INSERT INTO notifications (user_id, message, type, \`read\`, created_at) 
      VALUES (?, ?, ?, false, NOW())`,
      [
        userId,
        status === 'Verified' 
          ? 'Your application has been accepted.'
          : `Your application has been declined. Reason: ${remarks}`,
        status.toLowerCase()
      ]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating status:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
}); 