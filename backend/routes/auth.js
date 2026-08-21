const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
    res.json({ token, user: payload.user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create Admin (One-time setup route or to be called via seed)
router.post('/setup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ email, password, name });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
