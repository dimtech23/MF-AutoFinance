import express from 'express';
import { authenticateToken, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../constants/roles";
import { 
    getAllAppointments, 
    getAppointmentById, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment,
    updateAppointmentStatus
} from '../controllers/appointmentController';

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, getAllAppointments);

// Get a specific appointment by ID
router.get('/:id', authenticateToken, getAppointmentById);

// Create a new appointment
router.post('/', authenticateToken, createAppointment);

// Update an existing appointment
router.put('/:id', authenticateToken, updateAppointment);

// Update appointment status
router.patch('/:id/status', authenticateToken, updateAppointmentStatus);

// Delete an appointment
router.delete('/:id', authenticateToken, deleteAppointment);



export { router as appointmentRouter };