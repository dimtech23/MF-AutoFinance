import express from 'express';
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";
import { getDashboardStats, getTransactions, getAppointments, getInventoryAlerts } from '../controllers/dashboardController';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

// Get recent transactions
router.get('/transactions/recent', authenticateToken, getTransactions);

// Get upcoming appointments
router.get('/appointments/upcoming', authenticateToken, getAppointments);


export { router as dashboardRouter };
