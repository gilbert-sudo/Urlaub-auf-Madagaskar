const Hotel = require('../models/Hotel');
const ItineraryItem = require('../models/ItineraryItem');

exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });

    // Calculate usage count dynamically across itinerary items
    try {
      const counts = await ItineraryItem.aggregate([
        { $match: { hotel: { $ne: null } } },
        { $group: { _id: '$hotel', count: { $sum: 1 } } }
      ]);
      const countMap = {};
      counts.forEach(c => {
        if (c._id) countMap[c._id.toString()] = c.count;
      });

      const hotelsWithStats = hotels.map(h => {
        const doc = h.toObject();
        doc.usageCount = countMap[h._id.toString()] || 0;
        return doc;
      });
      return res.json(hotelsWithStats);
    } catch (aggErr) {
      // Fallback if aggregation fails
      return res.json(hotels);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createHotel = async (req, res) => {
  try {
    const { placeId, name, location, city, address, coordinates, email, phone, standardRate, notes, rating, userRatingsTotal, website, photoUrl, isCustom } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Hotel name is required' });
    }

    let existingHotel = null;

    // 1. Try finding by Google placeId if provided
    if (placeId) {
      existingHotel = await Hotel.findOne({ placeId });
    }

    // 2. Fallback to case-insensitive name match if placeId not found
    if (!existingHotel && name) {
      existingHotel = await Hotel.findOne({ 
        name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      });
    }

    if (existingHotel) {
      // Update missing or newer fields if provided
      let hasChanges = false;
      if (placeId && !existingHotel.placeId) { existingHotel.placeId = placeId; hasChanges = true; }
      if (coordinates && coordinates.lat && coordinates.lng) {
        if (!existingHotel.coordinates || !existingHotel.coordinates.lat) {
          existingHotel.coordinates = coordinates;
          hasChanges = true;
        }
      }
      if (address && !existingHotel.address) { existingHotel.address = address; hasChanges = true; }
      if (city && !existingHotel.city) { existingHotel.city = city; hasChanges = true; }
      if (location && !existingHotel.location) { existingHotel.location = location; hasChanges = true; }
      if (rating && !existingHotel.rating) { existingHotel.rating = rating; hasChanges = true; }
      if (userRatingsTotal && !existingHotel.userRatingsTotal) { existingHotel.userRatingsTotal = userRatingsTotal; hasChanges = true; }
      if (website && !existingHotel.website) { existingHotel.website = website; hasChanges = true; }
      if (photoUrl && !existingHotel.photoUrl) { existingHotel.photoUrl = photoUrl; hasChanges = true; }
      if (email && !existingHotel.email) { existingHotel.email = email; hasChanges = true; }
      if (phone && !existingHotel.phone) { existingHotel.phone = phone; hasChanges = true; }
      if (standardRate !== undefined && standardRate !== null && !existingHotel.standardRate) { 
        existingHotel.standardRate = standardRate; 
        hasChanges = true; 
      }

      if (hasChanges) {
        await existingHotel.save();
      }
      return res.status(200).json(existingHotel);
    }

    // 3. Otherwise create new hotel
    const hotel = new Hotel({
      name: name.trim(),
      placeId: placeId || undefined,
      location: location || '',
      city: city || '',
      address: address || '',
      coordinates: (coordinates && coordinates.lat && coordinates.lng) ? coordinates : undefined,
      email: email || '',
      phone: phone || '',
      standardRate: standardRate ? Number(standardRate) : undefined,
      notes: notes || '',
      rating: rating || undefined,
      userRatingsTotal: userRatingsTotal || undefined,
      website: website || '',
      photoUrl: photoUrl || '',
      isCustom: Boolean(isCustom)
    });

    const newHotel = await hotel.save();
    res.status(201).json(newHotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Hotel not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const deleted = await Hotel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Hotel not found' });
    res.json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
