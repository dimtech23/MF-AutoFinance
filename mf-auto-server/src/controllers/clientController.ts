import { Request, Response } from 'express';
import Client from '../models/Client';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { PDFDocument } from 'pdf-lib';
import { format } from 'date-fns';
import { AuditService } from '../services/auditService';


// Get all clients
export const getAllClients = async (req: Request, res: Response): Promise<Response> => {
  try {
    const clients = await Client.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
    
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
    const client = await Client.findOne({ _id: req.params.id, deleted: { $ne: true } });
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

    // Create initial appointment for the new client
    const initialAppointment = new Appointment({
      title: `Initial Service - ${savedClient.clientName}`,
      date: new Date(),
      time: '10:00',
      clientId: savedClient._id,
      clientName: savedClient.clientName,
      vehicleInfo: savedClient.carDetails?.make + ' ' + savedClient.carDetails?.model,
      type: 'repair',
      status: 'scheduled',
      description: savedClient.issueDescription || 'Initial service appointment',
      createdBy: (req as any).user._id
    });

    await initialAppointment.save();
    
    // Log the creation for audit purposes
    await AuditService.logClientCreation(req, (savedClient._id as any).toString(), {
      clientName: savedClient.clientName,
      phoneNumber: savedClient.phoneNumber,
      carDetails: savedClient.carDetails
    });
    
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
    
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Store old data for audit logging
    const oldData = client.toObject();
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...req.body,
          updatedBy: (req as any).user._id
        }
      },
      { new: true, runValidators: true }
    );
    
    // Update related appointments after client update
    await updateRelatedAppointments(id, req.body);
    
    // Log the update for audit purposes
    if (updatedClient) {
      await AuditService.logClientUpdate(req, id, oldData, updatedClient.toObject());
    }
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a client (soft delete)
export const deleteClient = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Only Admin can delete clients
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to delete clients' });
    }
    
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    const client = await Client.findOne({ _id: id, deleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({ message: 'Client not found or already deleted' });
    }
    
    // Soft delete - mark as deleted instead of removing
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { 
        $set: { 
          deleted: true,
          deletedAt: new Date(),
          deletedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    // Log the deletion for audit purposes
    await AuditService.logClientDeletion(req, id, {
      clientName: client.clientName,
      phoneNumber: client.phoneNumber,
      carDetails: client.carDetails
    });
    
    return res.status(200).json({ 
      message: 'Client deleted successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Restore a deleted client
export const restoreClient = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Only Admin can restore clients
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to restore clients' });
    }
    
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    const client = await Client.findOne({ _id: id, deleted: true });
    if (!client) {
      return res.status(404).json({ message: 'Deleted client not found' });
    }
    
    // Restore the client
    const restoredClient = await Client.findByIdAndUpdate(
      id,
      { 
        $unset: { 
          deleted: 1,
          deletedAt: 1,
          deletedBy: 1
        }
      },
      { new: true }
    );
    
    // Log the restoration for audit purposes
    await AuditService.logClientRestoration(req, id, {
      clientName: client.clientName,
      phoneNumber: client.phoneNumber,
      carDetails: client.carDetails
    });
    
    return res.status(200).json({ 
      message: 'Client restored successfully',
      client: restoredClient
    });
  } catch (error) {
    console.error('Error restoring client:', error);
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

    // Fetch all repair appointments for this client
    const repairHistory = await Appointment.find({
      clientId: client._id,
      type: 'repair'
    }).sort({ date: -1 });

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
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    // Validate the status
    const validStatuses = ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const client = await Client.findById(id);
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
    
    // Store old status for audit logging
    const oldStatus = client.repairStatus;
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { 
        $set: { 
          repairStatus: status,
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );

    // Update related appointments with the new status
    await updateRelatedAppointments(id, { repairStatus: status });
    
    // Log the status change for audit purposes
    await AuditService.logStatusChange(req, id, oldStatus, status, 'repair');
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating client status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update payment status and amount
export const updatePaymentStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { paymentStatus, partialPaymentAmount, paymentMethod, paymentDate, paymentReference } = req.body;
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    // Validate the payment status
    const validStatuses = ['pending', 'partial', 'paid', 'not_paid'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Only Admin and Accountant can update payment status
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }
    
    // Store old payment data for audit logging
    const oldPaymentData = {
      paymentStatus: client.paymentStatus,
      partialPaymentAmount: client.partialPaymentAmount,
      paymentMethod: client.paymentMethod,
      paymentDate: client.paymentDate,
      paymentReference: client.paymentReference
    };
    
    // Prepare update data
    const updateData: any = {
      paymentStatus,
      updatedBy: (req as any).user._id
    };
    
    // Handle payment amount
    if (partialPaymentAmount !== undefined) {
      updateData.partialPaymentAmount = partialPaymentAmount;
    }
    
    // Handle payment method and date
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    if (paymentDate) {
      updateData.paymentDate = paymentDate;
    }
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    
    // Auto-adjust payment status based on amount if not explicitly set
    if (partialPaymentAmount !== undefined && !req.body.paymentStatus) {
      if (partialPaymentAmount === 0) {
        updateData.paymentStatus = 'not_paid';
      } else if (partialPaymentAmount > 0) {
        // Use estimatedCost if available, otherwise use a default threshold
        const costThreshold = client.estimatedCost || 1000; // Default threshold if no estimated cost
        updateData.paymentStatus = partialPaymentAmount >= costThreshold ? 'paid' : 'partial';
      }
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    
    // Create payment history record
    if (partialPaymentAmount && partialPaymentAmount > 0) {
      try {
        const PaymentHistory = mongoose.model('PaymentHistory');
        const paymentRecord = new PaymentHistory({
          clientId: client._id,
          amount: partialPaymentAmount,
          paymentMethod: paymentMethod || 'cash',
          paymentDate: paymentDate || new Date(),
          paymentReference: paymentReference || `Payment for ${client.clientName}`,
          status: updateData.paymentStatus,
          recordedBy: (req as any).user._id,
          description: `Payment for ${client.clientName} - ${client.carDetails?.make} ${client.carDetails?.model}`
        });
        await paymentRecord.save();
      } catch (error) {
        console.error('Error creating payment history:', error);
        // Don't fail the main operation if payment history fails
      }
    }
    
    // Log the payment update for audit purposes
    await AuditService.logPaymentUpdate(req, id, oldPaymentData, updateData);
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Mark client vehicle as delivered
export const markAsDelivered = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    const client = await Client.findById(id);
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
    
    const deliveryData = {
      deliveryDate: new Date(),
      deliveryNotes: req.body.deliveryNotes,
      deliveryImages: req.body.deliveryImages
    };
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { 
        $set: { 
          repairStatus: 'delivered',
          ...deliveryData,
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    // Log the delivery for audit purposes
    await AuditService.logDelivery(req, id, deliveryData);
    
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
      
      // Always update appointment status based on repair status if it changed
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
          
          // Update delivery date for repair appointments when completed
          if (updatedFields.repairStatus === 'completed' && !appointment.deliveryDate) {
            appointmentUpdates.deliveryDate = new Date();
          }
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

// Generate completion PDF for client
export const generateCompletionPDF = async (req: Request, res: Response): Promise<Response> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Only generate PDF for completed or delivered clients
    if (!['completed', 'delivered'].includes(client.repairStatus)) {
      return res.status(400).json({ message: 'Can only generate completion PDF for completed or delivered clients' });
    }
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="completion-${client.clientName}-${client._id}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Embed default font
    const helveticaFont = await pdfDoc.embedFont('Helvetica');
    const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');

    // Company header
    page.drawText('MF Auto Finance', {
      x: 180,
      y: 750,
      size: 24,
      font: helveticaBold,
    });

    page.drawText('Professional Auto Repair & Maintenance', {
      x: 180,
      y: 720,
      size: 12,
      font: helveticaFont,
    });

    page.drawText('123 Main Street, City, Country', {
      x: 180,
      y: 700,
      size: 10,
      font: helveticaFont,
    });

    page.drawText('Phone: (123) 456-7890 | Email: info@mfautofinance.com', {
      x: 180,
      y: 685,
      size: 10,
      font: helveticaFont,
    });

    // Add a horizontal line after header
    page.drawLine({
      start: { x: 40, y: 650 },
      end: { x: 555, y: 650 },
      thickness: 1,
    });

    // Completion title
    const titleText = 'REPAIR COMPLETION CERTIFICATE';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 20);
    page.drawText(titleText, {
      x: (595.28 - titleWidth) / 2,
      y: 620,
      size: 20,
      font: helveticaBold,
    });

    // Create two columns for client details
    const leftColumn = 40;
    const rightColumn = 320;

    // Left column - Client details
    page.drawText('Client Details:', {
      x: leftColumn,
      y: 580,
      size: 12,
      font: helveticaBold,
    });

    page.drawText(`Client Name: ${client.clientName}`, {
      x: leftColumn,
      y: 560,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Phone: ${client.phoneNumber}`, {
      x: leftColumn,
      y: 545,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Email: ${client.email || 'N/A'}`, {
      x: leftColumn,
      y: 530,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Status: ${client.repairStatus.toUpperCase()}`, {
      x: leftColumn,
      y: 515,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Completion Date: ${format(new Date(client.updatedAt), 'PPP')}`, {
      x: leftColumn,
      y: 500,
      size: 10,
      font: helveticaFont,
    });

    // Right column - Vehicle information
    page.drawText('Vehicle Information:', {
      x: rightColumn,
      y: 580,
      size: 12,
      font: helveticaBold,
    });

    page.drawText(`Make: ${client.carDetails?.make || 'N/A'}`, {
      x: rightColumn,
      y: 560,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Model: ${client.carDetails?.model || 'N/A'}`, {
      x: rightColumn,
      y: 545,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`Year: ${client.carDetails?.year || 'N/A'}`, {
      x: rightColumn,
      y: 530,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`License Plate: ${client.carDetails?.licensePlate || 'N/A'}`, {
      x: rightColumn,
      y: 515,
      size: 10,
      font: helveticaFont,
    });

    page.drawText(`VIN: ${client.carDetails?.vin || 'N/A'}`, {
      x: rightColumn,
      y: 500,
      size: 10,
      font: helveticaFont,
    });

    // Add a horizontal line before repair details
    page.drawLine({
      start: { x: 40, y: 470 },
      end: { x: 555, y: 470 },
      thickness: 1,
    });

    // Repair details
    page.drawText('Repair Details:', {
      x: 40,
      y: 450,
      size: 12,
      font: helveticaBold,
    });

    page.drawText(`Issue Description: ${client.issueDescription || 'N/A'}`, {
      x: 40,
      y: 430,
      size: 10,
      font: helveticaFont,
      maxWidth: 515,
    });

    let currentY = 410;

    // Procedures performed
    if (client.procedures && client.procedures.length > 0) {
      page.drawText('Procedures Performed:', {
        x: 40,
        y: currentY,
        size: 12,
        font: helveticaBold,
      });
      currentY -= 20;

      client.procedures.forEach((procedure: string, index: number) => {
        page.drawText(`${index + 1}. ${procedure}`, {
          x: 50,
          y: currentY,
          size: 10,
          font: helveticaFont,
          maxWidth: 505,
        });
        currentY -= 15;
      });
    }

    // Pre-existing issues
    if (client.preExistingIssues && Array.isArray(client.preExistingIssues)) {
      currentY -= 10;
      page.drawText('Pre-existing Issues:', {
        x: 40,
        y: currentY,
        size: 12,
        font: helveticaBold,
      });
      currentY -= 20;

      client.preExistingIssues.forEach((issue: string, index: number) => {
        page.drawText(`${index + 1}. ${issue}`, {
          x: 50,
          y: currentY,
          size: 10,
          font: helveticaFont,
          maxWidth: 505,
        });
        currentY -= 15;
      });
    }

    // Notes
    if (client.notes) {
      currentY -= 10;
      page.drawText('Additional Notes:', {
        x: 40,
        y: currentY,
        size: 12,
        font: helveticaBold,
      });
      currentY -= 20;

      page.drawText(client.notes, {
        x: 50,
        y: currentY,
        size: 10,
        font: helveticaFont,
        maxWidth: 505,
      });
      currentY -= 30;
    }

    // Add a horizontal line before signature
    page.drawLine({
      start: { x: 40, y: currentY },
      end: { x: 555, y: currentY },
      thickness: 1,
    });

    currentY -= 30;

    // Signature section
    page.drawText('Authorized by:', {
      x: 40,
      y: currentY,
      size: 12,
      font: helveticaBold,
    });

    currentY -= 40;

    page.drawText('________________________', {
      x: 40,
      y: currentY,
      size: 12,
      font: helveticaFont,
    });

    currentY -= 20;

    page.drawText('MF Auto Finance Representative', {
      x: 40,
      y: currentY,
      size: 10,
      font: helveticaFont,
    });

    // Finalize the PDF
    const pdfBytes = await pdfDoc.save();
    res.send(Buffer.from(pdfBytes));
    
    return res.status(200);
  } catch (error) {
    console.error('Error generating completion PDF:', error);
    return res.status(500).json({ message: 'Error generating PDF' });
  }
};

// Get client audit logs
export const getClientAuditLogs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    // Check if client exists
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Get audit logs for this client
    const auditLogs = await AuditService.getEntityAuditLogs('client', id, Number(limit));
    
    return res.status(200).json({
      clientId: id,
      clientName: client.clientName,
      auditLogs
    });
  } catch (error) {
    console.error('Error fetching client audit logs:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};