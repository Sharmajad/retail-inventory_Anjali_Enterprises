const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById, editSale, voidSale } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { saleValidator } = require('../validators/saleValidator');

router.use(protect);

router.post('/', saleValidator, createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

// Owner-only Edit and Void routes
router.put('/:id', authorizeRoles('owner'), editSale);
router.put('/:id/void', authorizeRoles('owner'), voidSale);

module.exports = router;
