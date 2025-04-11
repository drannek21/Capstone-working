const { queryDatabase } = require('../database');

const EventService = {
  checkAttendance: async (eventId, userId) => {
    try {
      console.log('Executing attendance check query for:', { eventId, userId });
      const result = await queryDatabase(
        `SELECT id FROM attendees 
         WHERE event_id = ? AND code_id = ?`,
        [eventId, userId]
      );
      
      if (!result) {
        console.error('Database returned null/undefined result');
        return false;
      }
      
      console.log('Query result:', result);
      return Array.isArray(result) ? result.length > 0 : false;
    } catch (error) {
      console.error('Database error in checkAttendance:', {
        error: error.message,
        stack: error.stack,
        queryParams: { eventId, userId }
      });
      throw error;
    }
  }
};

module.exports = EventService;
