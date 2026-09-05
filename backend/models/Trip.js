const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  duration: { type: Number, required: true }, // in days
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
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
