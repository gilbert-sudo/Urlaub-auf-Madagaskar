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
  itinerary: [{
    dayNumber: Number,
    date: Date,
    activities: String,
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    locationDetails: String // For the driver's specific logistic location (e.g., Location N°3)
  }],
  flights: {
    arrival: { date: Date, flightNumber: String, details: String },
    departure: { date: Date, flightNumber: String, details: String }
  },
  inclusions: [String],
  exclusions: [String]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
