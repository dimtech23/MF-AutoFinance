import express from 'express';
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController';
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";

const router = express.Router();

// Get all budgets
router.get('/', authenticateToken, getAllBudgets);

// Get a specific budget by ID
router.get('/:id', authenticateToken, getBudgetById);

// Create a new budget - Admin and Accountant only
router.post('/', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), createBudget);

// Update an existing budget - Admin and Accountant only
router.put('/:id', authenticateToken, authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]), updateBudget);

// Delete a budget - Admin only
router.delete('/:id', authenticateToken, authorize([UserRole.ADMIN]), deleteBudget);

export { router as budgetRouter };