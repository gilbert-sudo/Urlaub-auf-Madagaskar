const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/shared/:token', tripController.getSharedTrip);
router.post('/:id/share', tripController.generateShareToken);

router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);
router.post('/', tripController.createTrip);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
