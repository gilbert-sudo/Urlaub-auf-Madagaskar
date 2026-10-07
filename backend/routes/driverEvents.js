const express = require('express');
const router = express.Router();
const DriverEvent = require('../models/DriverEvent');
const { verifyToken, verifyRole } = require('./auth'); // Assuming there's a basic verifyToken middleware

// Get events for a specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const events = await DriverEvent.find({ driverId: req.params.driverId }).populate('tripId', 'title startDate endDate');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all events (for CEO)
router.get('/', async (req, res) => {
  try {
    const events = await DriverEvent.find().populate('driverId', 'name avatar').populate('tripId', 'title');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  const { driverId, title, start, end, type, tripId, notes, allDay } = req.body;
  const newEvent = new DriverEvent({ driverId, title, start, end, type, tripId, notes, allDay });
  
  try {
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const updatedEvent = await DriverEvent.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    await DriverEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
