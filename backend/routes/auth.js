const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/setup', authController.setup);
router.put('/update/:id', authController.updateUser);

module.exports = router;
