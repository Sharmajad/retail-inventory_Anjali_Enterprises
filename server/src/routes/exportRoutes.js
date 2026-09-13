const express = require('express');
const router = express.Router();
const { exportData } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('owner'));

router.get('/', exportData);

module.exports = router;
