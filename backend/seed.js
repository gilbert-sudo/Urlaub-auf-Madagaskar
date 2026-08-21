const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Client = require('./models/Client');
const Driver = require('./models/Driver');
const Hotel = require('./models/Hotel');
const Trip = require('./models/Trip');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/klaus_agency')
  .then(() => console.log('Connected to MongoDB for Seeding'))
  .catch((err) => console.error('MongoDB connection error:', err));

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Client.deleteMany();
    await Driver.deleteMany();
    await Hotel.deleteMany();
    await Trip.deleteMany();

    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await User.create({
      name: 'Klaus Konnerth',
      email: 'admin@klaus.com',
      password: hashedPassword
    });

    // Create Client
    const gruber = await Client.create({
      name: 'Patrick & Nadine Gruber',
      email: 'gruber@example.com',
      paxAdults: 2,
      paxChildren: 0,
      notes: 'Hochzeitsreise'
    });

    // Create Driver
    const aina = await Driver.create({
      name: 'Aina',
      email: 'aina@example.com',
      phone: '+261331234567',
      languages: ['German', 'French', 'English'],
      vehicleType: '4x4 Nissan'
    });
    
    const transfer = await Driver.create({
      name: 'Transfer',
      email: 'transfer@example.com',
      phone: '',
      languages: [],
      vehicleType: 'Van'
    });

    const hotelbetreuung = await Driver.create({
      name: 'Hotelbetreuung',
      email: 'hotelbetreuung@example.com',
      phone: '',
      languages: [],
      vehicleType: 'None'
    });

    // Create Hotels
    const hRelais = await Hotel.create({ name: 'Relais des Plateaux', location: 'Antananarivo', standardRate: 120 });
    const hMahafaly = await Hotel.create({ name: 'Mahafaly Hotel', location: 'Antsirabe', standardRate: 80 });
    const hSetam = await Hotel.create({ name: 'Setam Lodge', location: 'Ranomafana', standardRate: 100 });
    const hLac = await Hotel.create({ name: 'Lac Hotel', location: 'Sahambavy', standardRate: 90 });
    const hReine = await Hotel.create({ name: 'Relais de la Reine', location: 'Isalo', standardRate: 150 });
    const hEden = await Hotel.create({ name: 'Residence Eden Lodge', location: 'Sarondrano', standardRate: 180 });

    // Create Trip
    await Trip.create({
      title: 'Honeymoon Tour South',
      client: gruber._id,
      duration: 10,
      startDate: new Date('2026-09-04T00:00:00Z'),
      endDate: new Date('2026-09-13T00:00:00Z'),
      guestType: 'Hochzeitsreise',
      totalPrice: 2270,
      status: 'Booked',
      inclusions: [
        'erfahrener englischsprachiger Fahrer/Reiseleiter',
        'Logistik und Begleitung',
        'Übernachtungen',
        'Frühstück',
        'Transfers und Ausflüge wie angegeben',
        'Auto mit Allradantrieb, Fahrer und Treibstoff'
      ],
      exclusions: [
        'Mittag und Abendessen',
        'Aufpreis für Einzelbelegung',
        'Individuelle Freizeitaktivitäten',
        'Zusätzliche Kosten, die aufgrund von verschobenen oder stornierten Flügen entstehen.',
        'Nationalparkgebühren Trinkgelder und persönliche Ausgaben',
        'Besichtigungen und Ausflüge mit zusätzlichen lokalen Führern und fakultative Freizeitaktivitäten',
        'Internationale Flüge und Inlandsflüge einschließlich Flughafengebühren und Steuern',
        'Reiserücktritts und Reisekrankenversicherung',
        'Visa Gebühren'
      ],
      flights: {
        arrival: { date: new Date('2026-09-04T16:50:00Z'), flightNumber: 'Emirates', details: '16H50' },
        departure: { date: new Date('2026-09-13T18:35:00Z'), flightNumber: 'Emirates', details: '18h35' }
      },
      itinerary: [
        {
          dayNumber: 1,
          date: new Date('2026-09-04T00:00:00Z'),
          activities: 'Ankunft in Antananarivo',
          hotel: hRelais._id,
          driver: transfer._id,
          locationDetails: 'Transfer'
        },
        {
          dayNumber: 2,
          date: new Date('2026-09-05T00:00:00Z'),
          activities: 'Antananarivo - Antsirabe',
          hotel: hMahafaly._id,
          driver: aina._id,
          locationDetails: 'Location N°1'
        },
        {
          dayNumber: 3,
          date: new Date('2026-09-06T00:00:00Z'),
          activities: 'Antsirabe - Ranomafana',
          hotel: hSetam._id,
          driver: aina._id,
          locationDetails: 'Location N°2'
        },
        {
          dayNumber: 4,
          date: new Date('2026-09-07T00:00:00Z'),
          activities: 'Ranomafana NP - Sahambavy',
          hotel: hLac._id,
          driver: aina._id,
          locationDetails: 'Location N°3'
        },
        {
          dayNumber: 5,
          date: new Date('2026-09-08T00:00:00Z'),
          activities: 'Sahambavy - Anja Park - Isalo',
          hotel: hReine._id,
          driver: aina._id,
          locationDetails: 'Location N°4'
        },
        {
          dayNumber: 6,
          date: new Date('2026-09-09T00:00:00Z'),
          activities: 'Isalo und Umgebung',
          hotel: hReine._id,
          driver: aina._id,
          locationDetails: 'Location N°5'
        },
        {
          dayNumber: 7,
          date: new Date('2026-09-10T00:00:00Z'),
          activities: 'Isalo - Sarondrano',
          hotel: hEden._id,
          driver: aina._id,
          locationDetails: 'Location N°6'
        },
        {
          dayNumber: 8,
          date: new Date('2026-09-11T00:00:00Z'),
          activities: 'Sarondrano und Umgebung',
          hotel: hEden._id,
          driver: hotelbetreuung._id,
          locationDetails: 'Location N°7'
        },
        {
          dayNumber: 9,
          date: new Date('2026-09-12T00:00:00Z'),
          activities: 'Tulear - Antananarivo (Inlandsflug)',
          hotel: hRelais._id,
          driver: transfer._id,
          locationDetails: 'Transfer'
        },
        {
          dayNumber: 10,
          date: new Date('2026-09-13T00:00:00Z'),
          activities: 'Rückflug',
          hotel: null,
          driver: null,
          locationDetails: ''
        }
      ]
    });

    console.log('Database seeded successfully with real Gruber Patrick data!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
