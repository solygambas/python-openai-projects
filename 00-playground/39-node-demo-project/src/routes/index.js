const express = require('express');
const router = express.Router();
const { getIndex } = require('../controllers/index');

// Define routes
router.get('/', getIndex);

module.exports = router;