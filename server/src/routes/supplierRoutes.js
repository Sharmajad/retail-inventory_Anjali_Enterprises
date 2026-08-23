const express = require('express');
const router = express.Router();
const { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { recordSupplierPayment } = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { supplierValidator } = require('../validators/supplierValidator');
const { supplierPaymentValidator } = require('../validators/purchaseValidator');

router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authorizeRoles('owner'), supplierValidator, createSupplier);
router.put('/:id', authorizeRoles('owner'), updateSupplier);
router.delete('/:id', authorizeRoles('owner'), deleteSupplier);

router.post('/:id/pay', authorizeRoles('owner'), supplierPaymentValidator, recordSupplierPayment);

module.exports = router;
