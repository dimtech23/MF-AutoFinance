// controllers/dashboardController.ts
import { Request, Response } from 'express';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import Appointment from '../models/Appointment';
import PaymentHistory from '../models/PaymentHistory';

// Define types for financial data
interface MonthlyFinancial {
  month: string;
  income: number;
  profit: number;
}

interface ServiceType {
  name: string;
  value: number;
}

interface VehicleMake {
  name: string;
  value: number;
}

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get time range from query parameters or default to 'month'
    const timeRange = req.query.timeRange as string || 'month';
    
    // Define date range based on timeRange
    const currentDate = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'week':
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(currentDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(currentDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(currentDate.getMonth() - 1); // Default to month
    }
    
    // Fetch all clients in the time range
    const clients = await Client.find({
      createdAt: { $gte: startDate, $lte: currentDate }
    });
    
    // Fetch all invoices in the time range
    const invoices = await Invoice.find({
      issueDate: { $gte: startDate, $lte: currentDate }
    });
    
    // Fetch all payment history in the time range for accurate revenue calculation
    const paymentHistory = await PaymentHistory.find({
      paymentDate: { $gte: startDate, $lte: currentDate },
      status: 'completed'
    });
    
    // Calculate total revenue from payment history (most accurate)
    const totalRevenue = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate invoice totals for comparison
    const invoiceTotals = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    
    // Calculate client payment totals for comparison
    const clientPaymentTotals = clients.reduce((sum, client) => {
      if (client.paymentStatus === 'paid' && client.partialPaymentAmount) {
        return sum + client.partialPaymentAmount;
      } else if (client.paymentStatus === 'partial' && client.partialPaymentAmount) {
        return sum + client.partialPaymentAmount;
      }
      return sum;
    }, 0);
    
    // Calculate total estimated costs for comparison
    const totalEstimatedCosts = clients.reduce((sum, client) => {
      return sum + (client.estimatedCost || 0);
    }, 0);
    
    // Use the most accurate revenue source (payment history)
    const totalIncome = totalRevenue;
    const netProfit = totalIncome; // No expenses tracking in current system
    const averageServiceValue = (invoices.length + clients.length) > 0 ? totalIncome / (invoices.length + clients.length) : 0;
    
    console.log('Financial calculations:', {
      totalRevenue,
      invoiceTotals,
      clientPaymentTotals,
      totalEstimatedCosts,
      totalIncome,
      invoiceCount: invoices.length,
      clientCount: clients.length,
      paymentCount: paymentHistory.length
    });
    
    // Generate monthly financial data using payment history
    const monthlyFinancials = generateMonthlyFinancials(invoices, clients, paymentHistory, timeRange);
    
    // Calculate services by type
    const servicesByType = calculateServicesByType(invoices, clients);
    
    // Calculate vehicles by make
    const vehiclesByMake = calculateVehiclesByMake(clients);
    
    // Calculate appointment availability
    const total = 50;
    const booked = await Appointment.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'in_progress'] }
    });
    const utilization = Math.round((booked / total) * 100);
    
    // Compile dashboard stats
    const dashboardStats = {
      financialSummary: {
        totalIncome,
        netProfit,
        averageServiceValue
      },
      monthlyFinancials,
      servicesByType,
      vehiclesByMake,
      appointmentAvailability: {
        total,
        booked,
        utilization
      }
    };
    
    return res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get recent transactions
export const getTransactions = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Fetch recent invoices
    const recentInvoices = await Invoice.find()
      .sort({ issueDate: -1 })
      .limit(10)
      .populate('customerInfo.id', 'clientName')
      .populate('relatedClientId', 'clientName carDetails');
    
    // Fetch recent payment history (most accurate transaction data)
    const recentPayments = await PaymentHistory.find()
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate('clientId', 'clientName carDetails')
      .populate('invoiceId', 'invoiceNumber customerInfo vehicleInfo');
    
    // Format invoices as transactions
    const invoiceTransactions = recentInvoices.map(invoice => ({
      id: invoice._id,
      date: invoice.issueDate || (invoice as any).createdAt,
      type: 'income',
      category: 'Invoice',
      description: `Invoice #${invoice.invoiceNumber || 'N/A'} - ${invoice.customerInfo?.name || 'Unknown Customer'}`,
      amount: invoice.total || 0,
      customerInfo: {
        name: invoice.customerInfo?.name || 'Unknown',
        id: invoice.customerInfo?.id
      },
      vehicleInfo: invoice.vehicleInfo ? 
        (typeof invoice.vehicleInfo === 'string' ? invoice.vehicleInfo : 
         `${invoice.vehicleInfo.year || ''} ${invoice.vehicleInfo.make || ''} ${invoice.vehicleInfo.model || ''}`.trim()) : 
        null,
      status: (invoice as any).status || 'completed',
      source: 'invoice'
    }));
    
    // Format payment history as transactions
    const paymentTransactions = recentPayments.map(payment => {
      const client = payment.clientId as any;
      const invoice = payment.invoiceId as any;
      
      return {
        id: payment._id,
        date: payment.paymentDate,
        type: 'income',
        category: 'Payment',
        description: payment.description || `Payment from ${client?.clientName || 'Unknown Customer'}`,
        amount: payment.amount,
        customerInfo: {
          name: client?.clientName || 'Unknown',
          id: client?._id
        },
        vehicleInfo: client?.carDetails ? 
          `${client.carDetails.make || ''} ${client.carDetails.model || ''}`.trim() : 
          (invoice?.vehicleInfo ? 
            (typeof invoice.vehicleInfo === 'string' ? invoice.vehicleInfo : 
             `${invoice.vehicleInfo.year || ''} ${invoice.vehicleInfo.make || ''} ${invoice.vehicleInfo.model || ''}`.trim()) : 
            null),
        status: payment.status,
        source: 'payment',
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.paymentReference
      };
    });
    
    // Combine and sort all transactions by date
    const allTransactions = [...invoiceTransactions, ...paymentTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limit to 10 most recent
    
    return res.status(200).json(allTransactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Get upcoming appointments
export const getAppointments = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Fetch upcoming appointments with better filtering
    const upcomingAppointments = await Appointment.find({
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'in_progress', 'confirmed'] }
    })
      .sort({ date: 1 })
      .limit(10)
      .populate('clientId', 'clientName phoneNumber carDetails');
    
    // Format appointments for the frontend with better error handling
    const formattedAppointments = upcomingAppointments.map(appointment => {
      const apptDate = new Date(appointment.date);
      
      // Handle time formatting
      let timeString = apptDate.toISOString();
      if (appointment.time) {
        const [hours, minutes] = appointment.time.split(':').map(Number);
        apptDate.setHours(hours, minutes);
        timeString = apptDate.toISOString();
      }
      
      // Get client info
      const client = appointment.clientId as any;
      const clientName = client?.clientName || (appointment as any).clientName || 'Unknown Customer';
      const phoneNumber = client?.phoneNumber || (appointment as any).phoneNumber || 'No Phone';
      const vehicleInfo = client?.carDetails ? 
        `${client.carDetails.make || ''} ${client.carDetails.model || ''}`.trim() : 
        appointment.vehicleInfo || 'Vehicle not specified';
      
      return {
        id: appointment._id,
        time: timeString,
        date: appointment.date,
        status: appointment.status || 'scheduled',
        customer: clientName,
        clientName: clientName,
        service: appointment.type || (appointment as any).service || 'Service',
        type: appointment.type || (appointment as any).service || 'Service',
        vehicle: vehicleInfo,
        phoneNumber: phoneNumber,
        description: appointment.description || `Service appointment for ${clientName}`,
        clientId: client?._id || null
      };
    });
    
    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// Get inventory alerts (placeholder - would need a proper inventory system)
export const getInventoryAlerts = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // This is a placeholder for inventory alerts
    // In a real system, this would query an inventory collection
    const mockInventoryAlerts = [
      {
        id: 1,
        part: 'Oil Filter',
        currentStock: 2,
        minRequired: 5
      },
      {
        id: 2,
        part: 'Brake Pads',
        currentStock: 1,
        minRequired: 4
      },
      {
        id: 3,
        part: 'Air Filter',
        currentStock: 3,
        minRequired: 5
      }
    ];
    
    return res.status(200).json(mockInventoryAlerts);
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Helper function to generate monthly financial data
const generateMonthlyFinancials = (invoices: any[], clients: any[], paymentHistory: any[], timeRange: string): MonthlyFinancial[] => {
  const currentDate = new Date();
  const months: MonthlyFinancial[] = [];
  let numberOfMonths = 0;
  
  // Determine number of months based on timeRange
  switch(timeRange) {
    case 'week':
      numberOfMonths = 1;
      break;
    case 'month':
      numberOfMonths = 1;
      break;
    case 'quarter':
      numberOfMonths = 3;
      break;
    case 'year':
      numberOfMonths = 12;
      break;
    default:
      numberOfMonths = 1;
  }
  
  // Generate month labels
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      income: 0,
      profit: 0
    });
  }
  
  // Calculate income for each month from invoices
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.issueDate);
    const monthIndex = months.findIndex(month => {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - (numberOfMonths - 1 - months.indexOf(month)));
      return invoiceDate.getMonth() === monthDate.getMonth() && 
             invoiceDate.getFullYear() === monthDate.getFullYear();
    });
    
    if (monthIndex !== -1) {
      months[monthIndex].income += (invoice.total || 0);
      months[monthIndex].profit += (invoice.total || 0); // No expenses in current system
    }
  });
  
  // Calculate income for each month from client payments
  clients.forEach(client => {
    const clientDate = new Date(client.createdAt);
    const monthIndex = months.findIndex(month => {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - (numberOfMonths - 1 - months.indexOf(month)));
      return clientDate.getMonth() === monthDate.getMonth() && 
             clientDate.getFullYear() === monthDate.getFullYear();
    });
    
    if (monthIndex !== -1) {
      let clientPayment = 0;
      if (client.paymentStatus === 'paid' && client.partialPaymentAmount) {
        clientPayment = client.partialPaymentAmount;
      } else if (client.paymentStatus === 'partial' && client.partialPaymentAmount) {
        clientPayment = client.partialPaymentAmount;
      }
      
      months[monthIndex].income += clientPayment;
      months[monthIndex].profit += clientPayment; // No expenses in current system
    }
  });
  
  // Calculate income for each month from payment history
  paymentHistory.forEach(payment => {
    const paymentDate = new Date(payment.paymentDate);
    const monthIndex = months.findIndex(month => {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - (numberOfMonths - 1 - months.indexOf(month)));
      return paymentDate.getMonth() === monthDate.getMonth() && 
             paymentDate.getFullYear() === monthDate.getFullYear();
    });
    
    if (monthIndex !== -1) {
      months[monthIndex].income += payment.amount;
      months[monthIndex].profit += payment.amount; // No expenses in current system
    }
  });
  
  // Calculate profit (income since no expenses)
  months.forEach(month => {
    month.profit = month.income;
  });
  
  return months;
};

// Helper function to calculate services by type
const calculateServicesByType = (invoices: any[], clients: any[]): ServiceType[] => {
  // Group invoice items by type
  const serviceTypes: Record<string, number> = {};
  
  // First, process invoices
  invoices.forEach(invoice => {
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        if (item.type === 'service') {
          // Use the full description or categorize by common service types
          let serviceName = item.description || 'General Service';
          
          // Make service names more descriptive
          if (serviceName.toLowerCase().includes('oil')) {
            serviceName = 'Oil Change';
          } else if (serviceName.toLowerCase().includes('brake')) {
            serviceName = 'Brake Service';
          } else if (serviceName.toLowerCase().includes('engine')) {
            serviceName = 'Engine Repair';
          } else if (serviceName.toLowerCase().includes('transmission')) {
            serviceName = 'Transmission Service';
          } else if (serviceName.toLowerCase().includes('tire')) {
            serviceName = 'Tire Service';
          } else if (serviceName.toLowerCase().includes('diagnostic')) {
            serviceName = 'Diagnostic Service';
          } else if (serviceName.toLowerCase().includes('maintenance')) {
            serviceName = 'Maintenance Service';
          } else if (serviceName.toLowerCase().includes('repair')) {
            serviceName = 'General Repair';
          } else if (serviceName.toLowerCase().includes('service')) {
            serviceName = 'General Service';
          }
          
          const amount = (item.quantity || 1) * (item.unitPrice || 0);
          
          if (serviceTypes[serviceName]) {
            serviceTypes[serviceName] += amount;
          } else {
            serviceTypes[serviceName] = amount;
          }
        }
      });
    }
  });
  
  // If no invoice data, fall back to client procedures
  if (Object.keys(serviceTypes).length === 0) {
    clients.forEach(client => {
      if (client.procedures && Array.isArray(client.procedures)) {
        client.procedures.forEach((procedure: any) => {
          let serviceName = 'General Service';
          
          if (typeof procedure === 'string') {
            serviceName = procedure;
          } else if (procedure.label) {
            serviceName = procedure.label;
          } else if (procedure.name) {
            serviceName = procedure.name;
          }
          
          // Make service names more descriptive
          if (serviceName.toLowerCase().includes('oil')) {
            serviceName = 'Oil Change';
          } else if (serviceName.toLowerCase().includes('brake')) {
            serviceName = 'Brake Service';
          } else if (serviceName.toLowerCase().includes('engine')) {
            serviceName = 'Engine Repair';
          } else if (serviceName.toLowerCase().includes('transmission')) {
            serviceName = 'Transmission Service';
          } else if (serviceName.toLowerCase().includes('tire')) {
            serviceName = 'Tire Service';
          } else if (serviceName.toLowerCase().includes('diagnostic')) {
            serviceName = 'Diagnostic Service';
          } else if (serviceName.toLowerCase().includes('maintenance')) {
            serviceName = 'Maintenance Service';
          } else if (serviceName.toLowerCase().includes('repair')) {
            serviceName = 'General Repair';
          } else if (serviceName.toLowerCase().includes('service')) {
            serviceName = 'General Service';
          }
          
          if (serviceTypes[serviceName]) {
            serviceTypes[serviceName]++;
          } else {
            serviceTypes[serviceName] = 1;
          }
        });
      }
    });
  }
  
  // If still no data, create some sample data for demonstration
  if (Object.keys(serviceTypes).length === 0) {
    // Return empty array instead of fake data
    // This ensures the dashboard shows proper empty state when no real data exists
    return [];
  }
  
  // Convert to array format for chart and sort by value
  return Object.keys(serviceTypes)
    .map(key => ({
      name: key,
      value: serviceTypes[key]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Limit to top 8 services
};

// Helper function to calculate vehicles by make
const calculateVehiclesByMake = (clients: any[]): VehicleMake[] => {
  // Group vehicles by make
  const vehicleMakes: Record<string, number> = {};
  
  clients.forEach(client => {
    if (client.carDetails && client.carDetails.make) {
      const make = client.carDetails.make;
      
      if (vehicleMakes[make]) {
        vehicleMakes[make]++;
      } else {
        vehicleMakes[make] = 1;
      }
    }
  });
  
  // Convert to array format for pie chart
  return Object.keys(vehicleMakes).map(key => ({
    name: key,
    value: vehicleMakes[key]
  }));
};

// Get payment history for financial reporting
export const getPaymentHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate, clientId, paymentMethod, status } = req.query;
    
    // Build query
    const query: any = {};
    
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Fetch payment history with populated client and invoice data
    const paymentHistory = await PaymentHistory.find(query)
      .sort({ paymentDate: -1 })
      .populate('clientId', 'clientName carDetails')
      .populate('invoiceId', 'invoiceNumber customerInfo vehicleInfo total')
      .populate('recordedBy', 'firstName lastName');
    
    // Calculate summary statistics
    const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentMethods = [...new Set(paymentHistory.map(p => p.paymentMethod))];
    const statusCounts = paymentHistory.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summary = {
      totalPayments: paymentHistory.length,
      totalAmount,
      paymentMethods,
      statusCounts,
      averagePayment: paymentHistory.length > 0 ? totalAmount / paymentHistory.length : 0
    };
    
    return res.status(200).json({
      payments: paymentHistory,
      summary
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};