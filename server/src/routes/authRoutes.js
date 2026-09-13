const express = require('express');
const router = express.Router();
const { login, getMe, seedOwner, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginValidator } = require('../validators/authValidator');

router.post('/seed-owner', seedOwner);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
