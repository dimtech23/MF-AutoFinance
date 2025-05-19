import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Client from '../models/Client';
import mongoose from 'mongoose';

// Get all appointments
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    // Extract query parameters for filtering
    const { startDate, endDate, clientId, status, type } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate as string) };
    }
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .populate('clientId', 'clientName carDetails')
      .populate('invoiceId', 'invoiceNumber')
      .populate('createdBy', 'firstName lastName');
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// Get a specific appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'clientName carDetails email phoneNumber')
      .populate('invoiceId', 'invoiceNumber total')
      .populate('createdBy', 'firstName lastName');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create a new appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { title, date, time, clientId, clientName, vehicleInfo, type, status, description, invoiceId } = req.body;
    
    // Combine date and time
    const appointmentDateTime = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      appointmentDateTime.setHours(hours, minutes);
    }
    
    // Validate client if clientId is provided
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
    }
    
    // Create new appointment
    const newAppointment = new Appointment({
      title,
      date: appointmentDateTime,
      time,
      clientId: clientId || null,
      clientName: clientName || 'Unspecified',
      vehicleInfo,
      type,
      status,
      description,
      invoiceId: invoiceId || null,
      createdBy: (req as any).user._id
    });
    
    const savedAppointment = await newAppointment.save();
    
    // If this is a repair appointment and it's linked to a client, update client repair status
    if (clientId && type === 'repair') {
      const statusMap: Record<string, string> = {
        'scheduled': 'waiting',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };
      
      await Client.findByIdAndUpdate(
        clientId,
        { $set: { repairStatus: statusMap[status] || 'waiting' } },
        { new: true }
      );
    }
    
    res.status(201).json(savedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update an existing appointment
export const updateAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Update the appointment
      const appointment = await Appointment.findByIdAndUpdate(
        id, 
        updates,
        { new: true, runValidators: true }
      );
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Update related client data
      await updateRelatedClient(id, updates);
      
      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'waiting'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Update appointment status
      appointment.status = status;
      await appointment.save();
      
      // Update related client using our sync function
      await updateRelatedClient(req.params.id, { status });
      
      res.status(200).json(appointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

// Function to update related client data when an appointment is modified
const updateRelatedClient = async (appointmentId: string, updatedFields: any): Promise<void> => {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || !appointment.clientId) return;
      
      const client = await Client.findById(appointment.clientId);
      if (!client) return;
      
      const clientUpdates: Record<string, any> = {};
      
      // Update client status based on appointment status for repair appointments
      if (appointment.type === 'repair' && updatedFields.status) {
        const statusMap: Record<string, string> = {
          'scheduled': 'waiting',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'cancelled': 'cancelled'
        };
        
        const newStatus = statusMap[updatedFields.status];
        if (newStatus && client.repairStatus !== newStatus) {
          clientUpdates.repairStatus = newStatus;
        }
      }
      
      // Update next appointment date if rescheduled
      if (updatedFields.date || updatedFields.time) {
        // Find all future appointments for this client
        const futureAppointments = await Appointment.find({
          clientId: appointment.clientId,
          date: { $gte: new Date() },
          status: 'scheduled'
        }).sort({ date: 1 });
        
        if (futureAppointments.length > 0) {
          clientUpdates.nextAppointmentDate = futureAppointments[0].date;
        }
      }
      
      // Update last service date if appointment completed
      if (updatedFields.status === 'completed' && appointment.type === 'repair') {
        clientUpdates.lastServiceDate = new Date();
      }
      
      // Only update if there are changes to make
      if (Object.keys(clientUpdates).length > 0) {
        await Client.findByIdAndUpdate(client._id, clientUpdates);
      }
    } catch (error) {
      console.error('Error updating related client:', error);
    }
  };

// Delete an appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};