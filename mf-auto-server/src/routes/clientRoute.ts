import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  restoreClient,
  getClientHistory,
  getAllClientHistory,
  updateClientStatus,
  updatePaymentStatus,
  markAsDelivered,
  registerAdmin,
  getClientSummary,
  generateCompletionPDF,
  getClientAuditLogs
} from "../controllers/clientController";
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all clients - all users can view clients
router.get('/', getAllClients);

// Get client summary - all users can view summary
router.get('/summary', getClientSummary);

// Get all client history - Admin only
router.get('/history', getAllClientHistory);

// Get a specific client by ID - all users can view client details
router.get('/:id', getClientById);

// Get client audit logs - Admin only
router.get('/:id/audit-logs', authorize([UserRole.ADMIN]), getClientAuditLogs);

// Create a new client - Admin and Accountant only
router.post('/', authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), createClient);

// Update an existing client - Admin and Accountant only 
router.put('/:id', authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateClient);

// Delete a client - Admin only
router.delete('/:id', authorize([UserRole.ADMIN]), deleteClient);

// Restore a deleted client - Admin only
router.patch('/:id/restore', authorize([UserRole.ADMIN]), restoreClient);

// Get client repair history - all users can view history
router.get('/:id/history', getClientHistory);

// Update client repair status - all users can update status
router.patch('/:id/status', updateClientStatus);

// Update client payment status - Admin and Accountant only
router.patch('/:id/payment', authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updatePaymentStatus);

// Mark client vehicle as delivered - Admin and Accountant only
router.patch('/:id/delivery', authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), markAsDelivered);

// Admin registration route
router.post('/register-admin', registerAdmin);

// Add the PDF generation route
router.get('/:id/completion-pdf', generateCompletionPDF);

export { router as clientRouter };