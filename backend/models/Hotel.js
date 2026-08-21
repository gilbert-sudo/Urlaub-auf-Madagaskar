const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  standardRate: { type: Number },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
