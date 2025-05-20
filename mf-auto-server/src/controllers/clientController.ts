import { Request, Response } from 'express';
import Client from '../models/Client';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


// Get all clients
export const getAllClients = async (req: Request, res: Response): Promise<Response> => {
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
    
    return res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific client by ID
export const getClientById = async (req: Request, res: Response): Promise<Response> => {
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
    
    return res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new client
export const createClient = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(201).json(savedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing client
export const updateClient = async (req: Request, res: Response): Promise<Response> => {
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
      { 
        $set: {
          ...req.body,
          updatedBy: (req as any).user._id
        }
      },
      { new: true, runValidators: true }
    );
    
    // Update related appointments after client update
    await updateRelatedAppointments(req.params.id, req.body);
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a client
export const deleteClient = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get client repair history
export const getClientHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // In a real application, you would fetch the client's repair history from a separate collection
    // For now, we'll return a placeholder response
    const repairHistory: any[] = [];

    
    // Everyone can view client history
    return res.status(200).json(repairHistory);
  } catch (error) {
    console.error('Error fetching client history:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update client repair status
export const updateClientStatus = async (req: Request, res: Response): Promise<Response> => {
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
      { 
        $set: { 
          repairStatus: status,
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update client payment status
export const updatePaymentStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { paymentStatus } = req.body;
    
    // Validate the payment status
    const validStatuses = ['pending', 'partial', 'paid'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Only Admin and Accountant can update payment status
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          paymentStatus,
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Mark client vehicle as delivered
export const markAsDelivered = async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Only Admin and Accountant can mark as delivered
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to mark client as delivered' });
    }
    
    // Check if payment is complete
    if (client.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Cannot mark as delivered until payment is complete' });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          repairStatus: 'delivered',
          deliveryDate: new Date(),
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error marking client as delivered:', error);
    return res.status(500).json({ message: 'Server error' });
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
export const registerAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: UserRole.ADMIN });
    if (adminExists) {
      return res.status(403).json({ message: 'Admin user already exists' });
    }
    
    const { firstName, lastName, email, phone, password } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user with full permissions
    const adminUser = new User({
      firstName,
      lastName,
      email,
      phone,
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
    
    await adminUser.save();
    
    return res.status(201).json({ 
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all client history with filtering
export const getAllClientHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, status, category } = req.query;
    
    // Build the query
    const query: any = {};
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    // Add type filter if provided
    if (type) query.type = type;
    
    // Add status filter if provided
    if (status) query.status = status;
    
    // Add category filter if provided
    if (category) query.category = category;
    
    // Get all clients first
    const clients = await Client.find().sort({ createdAt: -1 });
    
    // Transform client data into activity history
    const history = clients.flatMap(client => {
      const activities = [];
      
      // Add client creation as an activity
      activities.push({
        id: `create_${client._id}`,
        type: 'status_change',
        date: client.createdAt,
        status: 'created',
        category: 'client',
        description: `New client registered: ${client.clientName}`,
        clientName: client.clientName,
        vehicleInfo: client.carDetails,
        createdBy: client.createdBy,
        documents: client.documents || [],
        notes: client.notes
      });
      
      // Add status changes
      if (client.repairStatus) {
        activities.push({
          id: `status_${client._id}`,
          type: 'status_change',
          date: client.updatedAt,
          status: client.repairStatus,
          category: 'status',
          description: `Status updated to: ${client.repairStatus}`,
          clientName: client.clientName,
          vehicleInfo: client.carDetails,
          createdBy: client.updatedBy || client.createdBy
        });
      }
      
      // Add payment activities
      if (client.paymentStatus) {
        activities.push({
          id: `payment_${client._id}`,
          type: 'payment',
          date: client.updatedAt,
          status: client.paymentStatus,
          category: 'payment',
          description: `Payment status: ${client.paymentStatus}${client.partialPaymentAmount ? ` (Amount: ${client.partialPaymentAmount})` : ''}`,
          clientName: client.clientName,
          vehicleInfo: client.carDetails,
          amount: client.partialPaymentAmount || 0,
          createdBy: client.updatedBy || client.createdBy
        });
      }
      
      // Add delivery activity if delivered
      if (client.repairStatus === 'delivered' && client.deliveryDate) {
        activities.push({
          id: `delivery_${client._id}`,
          type: 'delivery',
          date: client.deliveryDate,
          status: 'delivered',
          category: 'delivery',
          description: `Vehicle delivered to client`,
          clientName: client.clientName,
          vehicleInfo: client.carDetails,
          createdBy: client.updatedBy || client.createdBy
        });
      }
      
      return activities;
    });
    
    // Apply filters
    const filteredHistory = history.filter(activity => {
      if (query.date && activity.date) {
        if (query.date.$gte && new Date(activity.date) < query.date.$gte) return false;
        if (query.date.$lte && new Date(activity.date) > query.date.$lte) return false;
      }
      if (query.type && activity.type !== query.type) return false;
      if (query.status && activity.status !== query.status) return false;
      if (query.category && activity.category !== query.category) return false;
      return true;
    });
    
    // Sort by date descending
    filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.status(200).json(filteredHistory);
  } catch (error) {
    console.error('Error fetching all client history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get client summary statistics
export const getClientSummary = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ repairStatus: { $in: ['waiting', 'in_progress'] } });
    const completedClients = await Client.countDocuments({ repairStatus: 'completed' });
    const deliveredClients = await Client.countDocuments({ repairStatus: 'delivered' });
    
    return res.status(200).json({
      totalClients,
      activeClients,
      completedClients,
      deliveredClients
    });
  } catch (error) {
    console.error('Error fetching client summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};