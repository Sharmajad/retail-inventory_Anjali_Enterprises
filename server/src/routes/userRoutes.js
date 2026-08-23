const express = require('express');
const router = express.Router();
const { getUsers, createStaff, updateUser, deactivateUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { createStaffValidator } = require('../validators/authValidator');

router.use(protect);
router.use(authorizeRoles('owner'));

router.route('/')
  .get(getUsers)
  .post(createStaffValidator, createStaff);

router.route('/:id')
  .put(updateUser)
  .delete(deactivateUser);

module.exports = router;
