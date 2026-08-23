const express = require('express');
const router = express.Router();
const { adjustStock, getStockTransactions, getLowStockProducts } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { adjustStockValidator } = require('../validators/inventoryValidator');

router.use(protect);

router.get('/transactions', getStockTransactions);
router.get('/low-stock', getLowStockProducts);
router.post('/adjust', authorizeRoles('owner'), adjustStockValidator, adjustStock);

module.exports = router;
