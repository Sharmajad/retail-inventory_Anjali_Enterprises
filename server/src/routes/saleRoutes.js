const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const { saleValidator } = require('../validators/saleValidator');

router.use(protect);

router.post('/', saleValidator, createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

module.exports = router;
