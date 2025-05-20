import express, { Router } from 'express';
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus
} from '../controllers/appointmentController';

const router: Router = express.Router();

// Create new appointment
router.post('/', authenticateToken, createAppointment);

// Get all appointments
router.get('/', authenticateToken, getAllAppointments);

// Get appointment by ID
router.get('/:id', authenticateToken, getAppointmentById);

// Update appointment
router.put('/:id', authenticateToken, updateAppointment);

// Delete appointment
router.delete('/:id', authenticateToken, deleteAppointment);

// Update appointment status
router.patch('/:id/status', authenticateToken, updateAppointmentStatus);

export { router as appointmentRouter };