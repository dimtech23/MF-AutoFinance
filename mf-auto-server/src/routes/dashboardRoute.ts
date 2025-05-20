import express, { Router } from 'express';
import { authenticateToken } from "../middlewares/authMiddleware";
import { getDashboardStats, getTransactions, getAppointments } from '../controllers/dashboardController';

const router: Router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

// Get recent transactions
router.get('/transactions', authenticateToken, getTransactions);

// Get upcoming appointments
router.get('/appointments', authenticateToken, getAppointments);

export { router as dashboardRouter };
