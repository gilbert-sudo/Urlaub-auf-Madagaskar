const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  duration: { type: Number, default: 1 }, // in days
  startDate: { type: Date },
  endDate: { type: Date },
  guestType: { type: String }, // e.g., Honeymoon
  totalPrice: { type: Number },
  status: { type: String, enum: ['Inquiry', 'Proposal', 'Booked', 'Active', 'Completed'], default: 'Inquiry' },
  itinerary: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ItineraryItem' }],
  shareToken: { type: String, unique: true, sparse: true },
  flights: {
    arrival: { date: Date, flightNumber: String, details: String },
    departure: { date: Date, flightNumber: String, details: String }
  },
  inclusions: [String],
  exclusions: [String]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
