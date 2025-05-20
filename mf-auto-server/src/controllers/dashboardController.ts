// controllers/dashboardController.ts
import { Request, Response } from 'express';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import Appointment from '../models/Appointment';

// Define types for financial data
interface MonthlyFinancial {
  month: string;
  income: number;
  expenses: number;
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
    
    // Calculate financial summary
    const totalIncome = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalExpenses = 0; // This would need a proper expenses collection
    const netProfit = totalIncome - totalExpenses;
    const averageServiceValue = invoices.length > 0 ? totalIncome / invoices.length : 0;
    
    // Generate monthly financial data
    const monthlyFinancials = generateMonthlyFinancials(invoices, timeRange);
    
    // Calculate services by type
    const servicesByType = calculateServicesByType(invoices);
    
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
        totalExpenses,
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
    
    // Format as transactions
    const transactions = recentInvoices.map(invoice => ({
      id: invoice._id,
      date: invoice.issueDate,
      type: 'income',
      category: 'Service',
      description: `Invoice #${invoice.invoiceNumber}`,
      amount: invoice.total,
      customerInfo: {
        name: invoice.customerInfo.name || 'Unknown',
        id: invoice.customerInfo.id
      },
      vehicleInfo: invoice.vehicleInfo || null
    }));
    
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get upcoming appointments
export const getAppointments = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Fetch upcoming appointments
    const upcomingAppointments = await Appointment.find({
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'in_progress'] }
    })
      .sort({ date: 1 })
      .limit(10);
    
    // Format appointments for the frontend
    const formattedAppointments = upcomingAppointments.map(appointment => {
      const apptDate = new Date(appointment.date);
      const [hours, minutes] = appointment.time.split(':').map(Number);
      apptDate.setHours(hours, minutes);
      
      return {
        id: appointment._id,
        time: apptDate,
        status: appointment.status,
        customer: appointment.clientName,
        service: appointment.type,
        vehicle: appointment.vehicleInfo || 'Not specified'
      };
    });
    
    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    return res.status(500).json({ message: 'Server error', error });
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
const generateMonthlyFinancials = (invoices: any[], timeRange: string): MonthlyFinancial[] => {
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
      expenses: 0,
      profit: 0
    });
  }
  
  // Calculate income for each month
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.issueDate);
    const monthIndex = numberOfMonths - 1 - (currentDate.getMonth() - invoiceDate.getMonth() + (12 * (currentDate.getFullYear() - invoiceDate.getFullYear())));
    
    if (monthIndex >= 0 && monthIndex < months.length) {
      months[monthIndex].income += invoice.total;
      months[monthIndex].profit += invoice.total; // Assuming no expenses for simplicity
    }
  });
  
  // Calculate profit (income - expenses)
  months.forEach(month => {
    month.profit = month.income - month.expenses;
  });
  
  return months;
};

// Helper function to calculate services by type
const calculateServicesByType = (invoices: any[]): ServiceType[] => {
  // Group invoice items by type
  const serviceTypes: Record<string, number> = {};
  
  invoices.forEach(invoice => {
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        if (item.type === 'service') {
          // Categorize service by first word of description
          const serviceName = item.description.split(' ')[0];
          const amount = item.quantity * item.unitPrice;
          
          if (serviceTypes[serviceName]) {
            serviceTypes[serviceName] += amount;
          } else {
            serviceTypes[serviceName] = amount;
          }
        }
      });
    }
  });
  
  // Convert to array format for pie chart
  return Object.keys(serviceTypes).map(key => ({
    name: key,
    value: serviceTypes[key]
  }));
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