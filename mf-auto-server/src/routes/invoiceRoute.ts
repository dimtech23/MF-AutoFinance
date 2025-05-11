import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  processPayment,
  generatePDF,
  exportToExcel
} from '../controllers/invoiceController';
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";

const router = express.Router();

// Get all invoices - allow all users to view invoices
router.get('/', authenticateToken, getAllInvoices);

// Get a specific invoice by ID - allow all users to view invoice details
router.get('/:id', authenticateToken, getInvoiceById);

// Create a new invoice - Admin and Accountant only
router.post('/', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), createInvoice);

// Update an existing invoice - Admin and Accountant only
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateInvoice);

// Delete an invoice - Admin only
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), deleteInvoice);

// Mark invoice as paid - Admin and Accountant only
router.patch('/:id/pay', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), markAsPaid);

// Process a payment for an invoice - Admin and Accountant only
router.post('/:id/payment', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), processPayment);

// Generate PDF of invoice - allow all users to generate PDFs
router.get('/:id/pdf', authenticateToken, generatePDF);

// Export invoices to Excel - Admin and Accountant only
router.get('/export/excel', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), exportToExcel);

export { router as invoiceRouter };