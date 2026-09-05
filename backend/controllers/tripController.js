const crypto = require('crypto');
const Trip = require('../models/Trip');

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate('client').populate('itinerary.hotel').populate('itinerary.driver');
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('client').populate('itinerary.hotel').populate('itinerary.driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTrip = async (req, res) => {
  const trip = new Trip(req.body);
  try {
    const newTrip = await trip.save();
    await newTrip.populate(['client', 'itinerary.hotel', 'itinerary.driver']);
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('client')
      .populate('itinerary.hotel')
      .populate('itinerary.driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateShareToken = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    // Generate a secure random token if one doesn't exist
    if (!trip.shareToken) {
      trip.shareToken = crypto.randomBytes(16).toString('hex');
      await trip.save();
    }
    
    res.json({ shareToken: trip.shareToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSharedTrip = async (req, res) => {
  try {
    // Populate client, hotel, driver to give full details on the client side
    const trip = await Trip.findOne({ shareToken: req.params.token })
      .populate('client', 'name paxAdults paxChildren')
      .populate('itinerary.hotel', 'name address')
      .populate('itinerary.driver', 'name phone');
      
    if (!trip) return res.status(404).json({ message: 'Trip not found or link invalid' });
    
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
