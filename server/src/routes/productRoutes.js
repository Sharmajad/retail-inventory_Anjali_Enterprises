const express = require('express');
const router = express.Router();
const {
  getProducts,
  getSubcategories,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { productValidator } = require('../validators/productValidator');

router.use(protect);

router.get('/', getProducts);
router.get('/subcategories', getSubcategories);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProductById);

router.post('/', authorizeRoles('owner'), productValidator, createProduct);
router.put('/:id', authorizeRoles('owner'), updateProduct);
router.delete('/:id', authorizeRoles('owner'), deleteProduct);

module.exports = router;
