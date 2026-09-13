const express = require('express');
const router = express.Router();
const {
  getUsers,
  createStaff,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetStaffPassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { createStaffValidator } = require('../validators/authValidator');

router.use(protect);
router.use(authorizeRoles('owner'));

router.route('/')
  .get(getUsers)
  .post(createStaffValidator, createStaff);

router.post('/staff', createStaffValidator, createStaff);

router.route('/:id')
  .put(updateUser)
  .delete(deactivateUser);

router.put('/:id/deactivate', deactivateUser);
router.put('/:id/reactivate', reactivateUser);
router.post('/:id/reset-password', resetStaffPassword);

module.exports = router;
