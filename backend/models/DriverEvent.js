const mongoose = require('mongoose');

const driverEventSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  type: { type: String, enum: ['tour', 'personal', 'unavailable'], default: 'personal' },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null }, // Only if type is 'tour'
  notes: { type: String, default: '' },
  allDay: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DriverEvent', driverEventSchema);
