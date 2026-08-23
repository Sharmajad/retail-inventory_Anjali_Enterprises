const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { categoryValidator } = require('../validators/categoryValidator');

router.use(protect);

router.get('/', getCategories);
router.post('/', authorizeRoles('owner'), categoryValidator, createCategory);
router.put('/:id', authorizeRoles('owner'), updateCategory);
router.delete('/:id', authorizeRoles('owner'), deleteCategory);

module.exports = router;
