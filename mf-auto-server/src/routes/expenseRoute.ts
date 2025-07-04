import express from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  updateExpenseStatus,
  getExpenseStats,
  uploadReceipt
} from '../controllers/expenseController';
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Get all expenses - All authenticated users can view
router.get('/', authenticateToken, getAllExpenses);

// Get expense statistics - All authenticated users can view
router.get('/stats', authenticateToken, getExpenseStats);

// Get a specific expense by ID - All authenticated users can view
router.get('/:id', authenticateToken, getExpenseById);

// Create a new expense - Admin and Accountant can create
router.post('/', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), createExpense);

// Update an existing expense - Admin and Accountant can update
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateExpense);

// Delete an expense - Admin and Accountant only
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), deleteExpense);

// Update expense status (approve/reject) - Admin and Accountant only
router.patch('/:id/status', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateExpenseStatus);

// Upload receipt for expense - Admin and Accountant can upload
router.post('/:id/receipt', 
  authenticateToken, 
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), 
  upload.single('receipt'), 
  uploadReceipt
);

export { router as expenseRouter }; 