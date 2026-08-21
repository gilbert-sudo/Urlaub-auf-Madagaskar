const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  languages: [String], // e.g., ['German', 'English']
  vehicleType: { type: String },
  status: { type: String, enum: ['Available', 'On Trip', 'Leave'], default: 'Available' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
