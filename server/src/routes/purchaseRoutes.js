const express = require('express');
const router = express.Router();
const { createPurchase, getPurchases, getPurchaseById } = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { purchaseValidator } = require('../validators/purchaseValidator');

router.use(protect);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', authorizeRoles('owner'), purchaseValidator, createPurchase);

module.exports = router;
