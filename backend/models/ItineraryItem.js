const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  dayNumber: Number,
  date: Date,
  activities: String,
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  locationDetails: String, // For the driver's specific logistic location (e.g., Location N°3)
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('ItineraryItem', itineraryItemSchema);
