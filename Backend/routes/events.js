const express = require('express');
const EventService = require('../services/event');
const router = express.Router();

router.post('/checkAttendance', async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    console.log('Checking attendance for:', { eventId, userId });
    
    if (!eventId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { eventId, userId }
      });
    }

    const attended = await EventService.checkAttendance(eventId, userId);
    console.log('Attendance result:', attended);
    res.json({ attended });
  } catch (error) {
    console.error('Error in checkAttendance route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
