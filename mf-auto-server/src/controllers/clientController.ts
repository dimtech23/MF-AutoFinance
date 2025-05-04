import { Request, Response } from 'express';
import Client from '../models/Client';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


// Get all clients
export const getAllClients = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    
    // If user is a mechanic, only return limited info
    if ((req as any).user.role === UserRole.MECHANIC) {
      const limitedClients = clients.map(client => ({
        id: client._id,
        clientName: client.clientName,
        phoneNumber: client.phoneNumber,
        carDetails: client.carDetails,
        repairStatus: client.repairStatus,
        procedures: client.procedures,
        issueDescription: client.issueDescription,
        preExistingIssues: client.preExistingIssues,
        estimatedDuration: client.estimatedDuration,
        deliveryDate: client.deliveryDate
      }));
      return res.status(200).json(limitedClients);
    }
    
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific client by ID
export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // If user is a mechanic, limit the data returned
    if ((req as any).user.role === UserRole.MECHANIC) {
      const limitedClient = {
        id: client._id,
        clientName: client.clientName,
        phoneNumber: client.phoneNumber,
        carDetails: client.carDetails,
        repairStatus: client.repairStatus,
        procedures: client.procedures,
        issueDescription: client.issueDescription,
        preExistingIssues: client.preExistingIssues,
        estimatedDuration: client.estimatedDuration,
        deliveryDate: client.deliveryDate,
        images: client.images,
        notes: client.notes
      };
      return res.status(200).json(limitedClient);
    }
    
    res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new client
export const createClient = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can create clients
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to create clients' });
    }
    
    const newClient = new Client({
      ...req.body,
      createdBy: (req as any).user._id
    });
    
    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing client
export const updateClient = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can update clients
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to update clients' });
    }
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    // Update related appointments after client update
    await updateRelatedAppointments(req.params.id, req.body);
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a client
export const deleteClient = async (req: Request, res: Response) => {
  try {
    // Only Admin can delete clients
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to delete clients' });
    }
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get client repair history
export const getClientHistory = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // In a real application, you would fetch the client's repair history from a separate collection
    // For now, we'll return a placeholder response
    const repairHistory: any[] = [];

    
    // Everyone can view client history
    res.status(200).json(repairHistory);
  } catch (error) {
    console.error('Error fetching client history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update client repair status
export const updateClientStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    // Validate the status
    const validStatuses = ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // For mechanics, only allow updating to specific statuses
    if ((req as any).user.role === UserRole.MECHANIC) {
      // Mechanics can only update to in_progress or completed
      if (!['in_progress', 'completed'].includes(status)) {
        return res.status(403).json({ message: 'Mechanics can only update status to in_progress or completed' });
      }
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: { repairStatus: status } },
      { new: true }
    );
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update client payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can update payment status
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }
    
    const { paymentStatus, partialPaymentAmount } = req.body;
    
    // Validate the payment status
    const validPaymentStatuses = ['paid', 'not_paid', 'partial'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const updateData: any = { paymentStatus };
    if (paymentStatus === 'partial') {
      if (!partialPaymentAmount || partialPaymentAmount <= 0) {
        return res.status(400).json({ message: 'Partial payment amount is required and must be greater than 0' });
      }
      updateData.partialPaymentAmount = partialPaymentAmount;
    } else {
      // Reset partial payment amount if status is not partial
      updateData.partialPaymentAmount = 0;
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark client vehicle as delivered
export const markAsDelivered = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can mark as delivered
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to mark as delivered' });
    }
    
    const { deliveryNotes, deliveryImages } = req.body;
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Check if the client's repair status is completed
    if (client.repairStatus !== 'completed') {
      return res.status(400).json({ message: 'Client repair must be completed before marking as delivered' });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          repairStatus: 'delivered',
          deliveryNotes: deliveryNotes || '',
          deliveryImages: deliveryImages || [],
          deliveryDate: new Date()
        }
      },
      { new: true }
    );
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error marking as delivered:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to update related appointments when a client is modified
const updateRelatedAppointments = async (clientId: string, updatedFields: any): Promise<void> => {
  try {
    const client = await Client.findById(clientId);
    if (!client) return;
    
    // Only proceed if client name or vehicle info changed
    if (!updatedFields.clientName && !updatedFields.carDetails) return;
    
    // Find all appointments for this client
    const clientAppointments = await Appointment.find({ clientId });
    
    for (const appointment of clientAppointments) {
      const appointmentUpdates: Record<string, any> = {};
      
      // Update client name
      if (updatedFields.clientName && appointment.clientName !== updatedFields.clientName) {
        appointmentUpdates.clientName = updatedFields.clientName;
        
        // Update appointment title if it contains client name
        if (appointment.title && appointment.title.includes(appointment.clientName)) {
          appointmentUpdates.title = appointment.title.replace(
            appointment.clientName,
            updatedFields.clientName
          );
        }
      }
      
      // Update vehicle info
      if (updatedFields.carDetails) {
        const vehicleInfo = `${updatedFields.carDetails.year || ""} ${updatedFields.carDetails.make || ""} ${updatedFields.carDetails.model || ""}`.trim();
        
        if (vehicleInfo && appointment.vehicleInfo !== vehicleInfo) {
          appointmentUpdates.vehicleInfo = vehicleInfo;
        }
      }
      
      // Update appointment status based on repair status
      if (updatedFields.repairStatus && appointment.type === 'repair') {
        const statusMap: Record<string, string> = {
          'waiting': 'scheduled',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'delivered': 'completed',
          'cancelled': 'cancelled'
        };
        
        const newStatus = statusMap[updatedFields.repairStatus];
        if (newStatus && appointment.status !== newStatus) {
          appointmentUpdates.status = newStatus;
        }
      }
      
      // Only update if there are changes to make
      if (Object.keys(appointmentUpdates).length > 0) {
        await Appointment.findByIdAndUpdate(appointment._id, appointmentUpdates);
      }
    }
  } catch (error) {
    console.error('Error updating related appointments:', error);
  }
};


// Register an admin (special function, typically used once for initial setup)
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if there's already an admin user
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      permissions: {
        canManageUsers: true,
        canManageSystem: true,
        canManageClients: true,
        canManageInvoices: true,
        canManageFinances: true,
        canGenerateReports: true,
        canViewClientInfo: true,
        canUpdateRepairStatus: true
      },
      status: 'active'
    });
    
    await newUser.save();
    
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};