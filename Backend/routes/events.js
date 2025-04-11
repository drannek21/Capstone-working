const express = require('express');
const EventService = require('../services/event');
const { queryDatabase } = require('../database');
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

    const result = await EventService.checkAttendance(eventId, userId);
    console.log('Attendance check result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error in checkAttendance route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      attended: false
    });
  }
});

// Add attendee to event
router.post('/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    // First get user details
    const userQuery = `
      SELECT u.id, u.code_id, u.name, u.email 
      FROM users u 
      WHERE u.id = ? AND u.status = 'Verified'
    `;
    const userResult = await queryDatabase(userQuery, [userId]);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found or not verified' });
    }

    const user = userResult[0];

    // Check if user is already an attendee
    const checkQuery = `
      SELECT id FROM attendees 
      WHERE event_id = ? AND code_id = ?
    `;
    const existingAttendee = await queryDatabase(checkQuery, [eventId, user.code_id]);

    if (existingAttendee && existingAttendee.length > 0) {
      return res.status(400).json({ error: 'User is already an attendee' });
    }

    // Add attendee
    const insertQuery = `
      INSERT INTO attendees (event_id, code_id, name, email, attend_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    await queryDatabase(insertQuery, [
      eventId,
      user.code_id,
      user.name,
      user.email
    ]);

    // Get updated attendees list
    const attendeesQuery = `
      SELECT a.id, a.event_id, a.code_id, a.name, a.email, a.attend_at, 
             s1.barangay
      FROM attendees a
      LEFT JOIN step1_identifying_information s1 ON a.code_id = s1.code_id
      WHERE a.event_id = ?
      ORDER BY a.attend_at DESC
    `;
    
    const attendees = await queryDatabase(attendeesQuery, [eventId]);
    
    res.json({
      message: 'Attendee added successfully',
      attendees: attendees
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({ 
      error: 'Failed to add attendee', 
      details: error.message 
    });
  }
});

// Get event attendees
router.get('/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const query = `
      SELECT a.id, a.event_id, a.code_id, a.name, a.email, a.attend_at,
             s1.barangay
      FROM attendees a
      LEFT JOIN step1_identifying_information s1 ON a.code_id = s1.code_id
      WHERE a.event_id = ?
      ORDER BY a.attend_at DESC
    `;
    
    const attendees = await queryDatabase(query, [eventId]);
    res.json(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attendees', 
      details: error.message 
    });
  }
});

// Add this before updating an event
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // First check if the event is completed
    const checkQuery = 'SELECT status FROM events WHERE id = ?';
    const [event] = await queryDatabase(checkQuery, [eventId]);
    
    if (event && event.status === 'Completed') {
      return res.status(403).json({
        error: 'Cannot modify completed events',
        message: 'Events marked as completed cannot be edited'
      });
    }

    // If not completed, proceed with the update
    const { title, description, startDate, endDate, startTime, endTime, location, status } = req.body;
    
    const updateQuery = `
      UPDATE events 
      SET title = ?, description = ?, startDate = ?, endDate = ?, 
          startTime = ?, endTime = ?, location = ?, status = ?
      WHERE id = ?
    `;
    
    await queryDatabase(updateQuery, [
      title, description, startDate, endDate, 
      startTime, endTime, location, status, eventId
    ]);

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      error: 'Failed to update event',
      message: error.message 
    });
  }
});

module.exports = router;
