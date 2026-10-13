const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  city: { type: String },
  address: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  placeId: { type: String, sparse: true, index: true },
  rating: { type: Number },
  userRatingsTotal: { type: Number },
  website: { type: String },
  photoUrl: { type: String },
  standardRate: { type: Number },
  notes: { type: String },
  bookingCount: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
