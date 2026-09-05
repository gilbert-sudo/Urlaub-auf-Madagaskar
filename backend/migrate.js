require('dotenv').config();
const mongoose = require('mongoose');
const ItineraryItem = require('./models/ItineraryItem');
const Trip = require('./models/Trip');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const trips = await db.collection('trips').find().toArray();
    console.log(`Found ${trips.length} trips to check`);

    let migratedCount = 0;

    for (const trip of trips) {
      if (trip.itinerary && Array.isArray(trip.itinerary) && trip.itinerary.length > 0) {
        // Check if the first item is an embedded object rather than an ObjectId
        // If it has dayNumber or activities, it's an old embedded object
        const firstItem = trip.itinerary[0];
        if (firstItem && typeof firstItem === 'object' && !mongoose.isObjectIdOrHexString(firstItem) && ('dayNumber' in firstItem || 'activities' in firstItem)) {
          console.log(`Migrating trip ${trip._id}`);
          
          const newItineraryIds = [];
          for (const day of trip.itinerary) {
            // Create ItineraryItem document
            const item = new ItineraryItem({
              trip: trip._id,
              dayNumber: day.dayNumber,
              date: day.date,
              activities: day.activities,
              hotel: day.hotel,
              driver: day.driver,
              locationDetails: day.locationDetails,
              coordinates: day.coordinates
            });
            const savedItem = await item.save();
            newItineraryIds.push(savedItem._id);
          }

          // Update the trip with the new array of ObjectIds
          await db.collection('trips').updateOne(
            { _id: trip._id },
            { $set: { itinerary: newItineraryIds } }
          );
          migratedCount++;
        }
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} trips.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
