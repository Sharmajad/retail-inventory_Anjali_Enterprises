const express = require('express');
const router = express.Router();
const { getDashboardSummary, getMonthlyStatistics, getSalesAnalytics, getInventoryValuation } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/dashboard-summary', getDashboardSummary);
router.get('/monthly-statistics', authorizeRoles('owner'), getMonthlyStatistics);
router.get('/sales-analytics', authorizeRoles('owner'), getSalesAnalytics);
router.get('/inventory-valuation', authorizeRoles('owner'), getInventoryValuation);

module.exports = router;
