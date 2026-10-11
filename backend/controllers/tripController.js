const crypto = require('crypto');
const Trip = require('../models/Trip');
const ItineraryItem = require('../models/ItineraryItem');

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('client')
      .populate({
        path: 'itinerary',
        populate: [
          { path: 'hotel' }
        ]
      });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('client')
      .populate({
        path: 'itinerary',
        populate: [
          { path: 'hotel' }
        ]
      });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sanitizeTripData = (data) => {
  const sanitized = { ...data };
  if (!sanitized.startDate) delete sanitized.startDate;
  if (!sanitized.endDate) delete sanitized.endDate;
  if (sanitized.totalPrice === '' || sanitized.totalPrice === null || sanitized.totalPrice === undefined || isNaN(sanitized.totalPrice)) {
    delete sanitized.totalPrice;
  }
  if (!sanitized.client) {
    delete sanitized.client;
  }
  if (sanitized.flights) {
    const flights = { ...sanitized.flights };
    if (flights.arrival) {
      flights.arrival = { ...flights.arrival };
      if (!flights.arrival.date) delete flights.arrival.date;
    }
    if (flights.departure) {
      flights.departure = { ...flights.departure };
      if (!flights.departure.date) delete flights.departure.date;
    }
    sanitized.flights = flights;
  }
  return sanitized;
};

const sanitizeItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map(item => {
    const copy = { ...item };
    if (!copy.date) delete copy.date;
    if (!copy.hotel) delete copy.hotel;
    if (!copy.driver) delete copy.driver;
    return copy;
  });
};

exports.createTrip = async (req, res) => {
  const { itinerary, ...tripData } = req.body;
  const sanitizedTripData = sanitizeTripData(tripData);
  const trip = new Trip(sanitizedTripData);
  try {
    const newTrip = await trip.save();
    
    if (itinerary && itinerary.length > 0) {
      const sanitizedItinerary = sanitizeItinerary(itinerary);
      const itineraryDocs = sanitizedItinerary.map(item => ({
        ...item,
        trip: newTrip._id
      }));
      const insertedItems = await ItineraryItem.insertMany(itineraryDocs);
      newTrip.itinerary = insertedItems.map(item => item._id);
      await newTrip.save();
    }

    await newTrip.populate([
      { path: 'client' },
      { path: 'itinerary', populate: [{ path: 'hotel' }] }
    ]);
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTrip = async (req, res) => {
  const { itinerary, ...tripData } = req.body;
  const sanitizedTripData = sanitizeTripData(tripData);
  try {
    let trip = await Trip.findByIdAndUpdate(req.params.id, sanitizedTripData, { new: true });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (itinerary !== undefined) {
      // Remove old itinerary items for this trip
      await ItineraryItem.deleteMany({ trip: trip._id });
      
      // Insert new itinerary items
      if (itinerary.length > 0) {
        const sanitizedItinerary = sanitizeItinerary(itinerary);
        const itineraryDocs = sanitizedItinerary.map(item => ({
          ...item,
          trip: trip._id
        }));
        const insertedItems = await ItineraryItem.insertMany(itineraryDocs);
        trip.itinerary = insertedItems.map(item => item._id);
      } else {
        trip.itinerary = [];
      }
      await trip.save();
    }

    await trip.populate([
      { path: 'client' },
      { path: 'itinerary', populate: [{ path: 'hotel' }] }
    ]);
    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    await ItineraryItem.deleteMany({ trip: trip._id });
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
      .populate({
        path: 'itinerary',
        populate: [
          { path: 'hotel', select: 'name address' }
        ]
      });
      
    if (!trip) return res.status(404).json({ message: 'Trip not found or link invalid' });
    
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
