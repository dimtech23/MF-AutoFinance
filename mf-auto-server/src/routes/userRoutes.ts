import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  resetUserPassword 
} from '../controllers/userController';
import { registerUserByAdmin } from '../controllers/registrationController';
import { authenticateToken, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../constants/roles';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, authorize([UserRole.ADMIN]), getAllUsers);

// Get a specific user
router.get('/:id', authenticateToken, authorize([UserRole.ADMIN]), getUserById);

// Create a new user (Admin only)
router.post('/', authenticateToken, authorize([UserRole.ADMIN]), registerUserByAdmin);

// Update a user
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN]), updateUser);

// Delete a user (Admin only)
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), deleteUser);

// Reset user password (Admin only)
router.post('/:id/reset-password', authenticateToken, authorize([UserRole.ADMIN]), resetUserPassword);

export { router };