import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientHistory,
  updateClientStatus,
  updatePaymentStatus,
  markAsDelivered
} from "../controllers/clientController";
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";

const router = express.Router();

// Get all clients - all users can view clients
router.get('/', authenticateToken, getAllClients);

// Get a specific client by ID - all users can view client details
router.get('/:id', authenticateToken, getClientById);

// Create a new client - Admin and Accountant only
router.post('/', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), createClient);

// Update an existing client - Admin and Accountant only 
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateClient);

// Delete a client - Admin only
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), deleteClient);

// Get client repair history - all users can view history
router.get('/:id/history', authenticateToken, getClientHistory);

// Update client repair status - all users can update status
router.patch('/:id/status', authenticateToken, updateClientStatus);

// Update client payment status - Admin and Accountant only
router.patch('/:id/payment', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updatePaymentStatus);

// Mark client vehicle as delivered - Admin and Accountant only
router.patch('/:id/delivery', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), markAsDelivered);

export { router as clientRouter };