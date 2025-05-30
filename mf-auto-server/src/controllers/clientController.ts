import { Request, Response } from 'express';
import Client from '../models/Client';
import Appointment from '../models/Appointment';
import User from '../models/User';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { BufferedPDFDocument } from 'pdf-lib';
import { format } from 'date-fns';


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

    // Update related appointments with the new status
    await updateRelatedAppointments(req.params.id, { repairStatus: status });
    
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
  let doc: BufferedPDFDocument | null = null;
  
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Only generate PDF for completed or delivered clients
    if (!['completed', 'delivered'].includes(client.repairStatus)) {
      return res.status(400).json({ message: 'Can only generate completion PDF for completed or delivered clients' });
    }
    
    // Create PDF document with smaller margins for more space
    doc = createBufferedPDF({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });
    
    if (!doc) {
      throw new Error('Failed to create PDF document');
    }

    const pdfDoc = doc as BufferedPDFDocument;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="completion-${client.clientName}-${client._id}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    pdfDoc.pipe(res);
    
    // Add company logo with proper spacing
    try {
      const logoBuffer = await getCompanyLogo();
      if (logoBuffer) {
        pdfDoc.image(logoBuffer, 40, 40, {
          width: 120,
          height: 120,
          fit: [120, 120]
        });
      }
    } catch (error) {
      console.error('Error adding company logo:', error);
      // Continue without the logo
    }

    // Company header - positioned to the right of the logo
    pdfDoc.fontSize(24)
        .text('MF Auto Finance', 180, 60)
        .fontSize(12)
        .text('Professional Auto Repair & Maintenance', 180, 90)
        .fontSize(10)
        .text('123 Main Street, City, Country', 180, 110)
        .text('Phone: (123) 456-7890 | Email: info@mfautofinance.com', 180, 125);

    // Add a horizontal line after header
    pdfDoc.moveTo(40, 170)
          .lineTo(pdfDoc.page.width - 40, 170)
          .stroke();

    // Completion title and details - starting at y=190
    pdfDoc.fontSize(20)
        .text('REPAIR COMPLETION CERTIFICATE', { align: 'center' })
        .moveDown(0.5);

    // Create two columns for client details
    const leftColumn = 40;
    const rightColumn = pdfDoc.page.width / 2 + 20;
    const columnWidth = (pdfDoc.page.width - 80) / 2;

    // Left column - Client details
    pdfDoc.fontSize(12)
        .text('Client Details:', leftColumn, 210)
        .fontSize(10)
        .text(`Client Name: ${client.clientName}`, leftColumn, 230)
        .text(`Phone: ${client.phoneNumber}`, leftColumn, 245)
        .text(`Email: ${client.email || 'N/A'}`, leftColumn, 260)
        .text(`Status: ${client.repairStatus.toUpperCase()}`, leftColumn, 275)
        .text(`Completion Date: ${format(new Date(client.updatedAt), 'PPP')}`, leftColumn, 290);

    // Right column - Vehicle information
    pdfDoc.fontSize(12)
        .text('Vehicle Information:', rightColumn, 210)
        .fontSize(10)
        .text(`Make: ${client.carDetails?.make || 'N/A'}`, rightColumn, 230)
        .text(`Model: ${client.carDetails?.model || 'N/A'}`, rightColumn, 245)
        .text(`Year: ${client.carDetails?.year || 'N/A'}`, rightColumn, 260)
        .text(`License Plate: ${client.carDetails?.licensePlate || 'N/A'}`, rightColumn, 275)
        .text(`VIN: ${client.carDetails?.vin || 'N/A'}`, rightColumn, 290);

    // Add a horizontal line before repair details
    pdfDoc.moveTo(40, 320)
          .lineTo(pdfDoc.page.width - 40, 320)
          .stroke();

    // Repair details - starting at y=340
    pdfDoc.fontSize(12)
        .text('Repair Details:', 40, 340)
        .fontSize(10)
        .text(`Issue Description: ${client.issueDescription || 'N/A'}`, 40, 360, {
          width: pdfDoc.page.width - 80
        })
        .moveDown(0.5);

    // Procedures performed
    if (client.procedures && client.procedures.length > 0) {
      pdfDoc.fontSize(12)
          .text('Procedures Performed:', 40, pdfDoc.y)
          .moveDown(0.5);

      client.procedures.forEach((procedure: string, index: number) => {
        pdfDoc.fontSize(10)
            .text(`${index + 1}. ${procedure}`, 50, pdfDoc.y, {
              width: pdfDoc.page.width - 100
            })
            .moveDown(0.3);
      });
    }

    // Pre-existing issues
    if (client.preExistingIssues && client.preExistingIssues.length > 0) {
      pdfDoc.moveDown(0.5)
          .fontSize(12)
          .text('Pre-existing Issues:', 40, pdfDoc.y)
          .moveDown(0.5);

      client.preExistingIssues.forEach((issue: string, index: number) => {
        pdfDoc.fontSize(10)
            .text(`${index + 1}. ${issue}`, 50, pdfDoc.y, {
              width: pdfDoc.page.width - 100
            })
            .moveDown(0.3);
      });
    }

    // Notes
    if (client.notes) {
      pdfDoc.moveDown(0.5)
          .fontSize(12)
          .text('Additional Notes:', 40, pdfDoc.y)
          .moveDown(0.5)
          .fontSize(10)
          .text(client.notes, 50, pdfDoc.y, {
            width: pdfDoc.page.width - 100
          });
    }

    // Add a horizontal line before signature
    pdfDoc.moveDown(2)
          .moveTo(40, pdfDoc.y)
          .lineTo(pdfDoc.page.width - 40, pdfDoc.y)
          .stroke()
          .moveDown(1);

    // Signature section
    pdfDoc.fontSize(12)
        .text('Authorized by:', 40, pdfDoc.y)
        .moveDown(2)
        .text('________________________', 40, pdfDoc.y)
        .moveDown(0.5)
        .fontSize(10)
        .text('MF Auto Finance Representative', 40, pdfDoc.y);

    // Finalize the PDF
    pdfDoc.end();
    
    return res.status(200);
  } catch (error) {
    console.error('Error generating completion PDF:', error);
    if (doc) {
      doc.end();
    }
    return res.status(500).json({ message: 'Error generating PDF' });
  }
};