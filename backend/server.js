const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const hotelRoutes = require('./routes/hotels');
const clientRoutes = require('./routes/clients');
const driverRoutes = require('./routes/drivers');

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/drivers', driverRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
