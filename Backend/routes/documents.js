const express = require('express');
const router = express.Router();

// Simple endpoint to confirm upload
router.post('/save', async (req, res) => {
  try {
    // Just return success since we're only handling Cloudinary uploads
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Simple endpoint to confirm delete
router.post('/delete', async (req, res) => {
  try {
    // Just return success since we're only handling Cloudinary uploads
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
