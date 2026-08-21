const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  paxAdults: { type: Number, default: 2 },
  paxChildren: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
