const express = require('express');
const { createWheel, getActiveWheel, getLatestWheel, joinWheel, manualStart } = require('../controllers/wheel.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authenticate, authorizeAdmin, createWheel);
router.get('/active', authenticate, getActiveWheel);
router.get('/latest', authenticate, getLatestWheel);
router.post('/:id/join', authenticate, joinWheel);
router.post('/:id/start', authenticate, authorizeAdmin, manualStart);

module.exports = router;
