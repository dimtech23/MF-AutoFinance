"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryAlerts = exports.getAppointments = exports.getTransactions = exports.getDashboardStats = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const getDashboardStats = async (req, res) => {
    try {
        const timeRange = req.query.timeRange || 'month';
        const currentDate = new Date();
        let startDate = new Date();
        switch (timeRange) {
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
                startDate.setMonth(currentDate.getMonth() - 1);
        }
        const clients = await Client_1.default.find({
            createdAt: { $gte: startDate, $lte: currentDate }
        });
        const invoices = await Invoice_1.default.find({
            issueDate: { $gte: startDate, $lte: currentDate }
        });
        const totalIncome = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalExpenses = 0;
        const netProfit = totalIncome - totalExpenses;
        const averageServiceValue = invoices.length > 0 ? totalIncome / invoices.length : 0;
        const monthlyFinancials = generateMonthlyFinancials(invoices, timeRange);
        const servicesByType = calculateServicesByType(invoices);
        const vehiclesByMake = calculateVehiclesByMake(clients);
        const total = 50;
        const booked = await Appointment_1.default.countDocuments({
            date: { $gte: new Date() },
            status: { $in: ['scheduled', 'in_progress'] }
        });
        const utilization = Math.round((booked / total) * 100);
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
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getDashboardStats = getDashboardStats;
const getTransactions = async (_req, res) => {
    try {
        const recentInvoices = await Invoice_1.default.find()
            .sort({ issueDate: -1 })
            .limit(10)
            .populate('customerInfo.id', 'clientName')
            .populate('relatedClientId', 'clientName carDetails');
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
    }
    catch (error) {
        console.error('Error getting transactions:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getTransactions = getTransactions;
const getAppointments = async (_req, res) => {
    try {
        const upcomingAppointments = await Appointment_1.default.find({
            date: { $gte: new Date() },
            status: { $in: ['scheduled', 'in_progress'] }
        })
            .sort({ date: 1 })
            .limit(10);
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
    }
    catch (error) {
        console.error('Error getting appointments:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getAppointments = getAppointments;
const getInventoryAlerts = async (_req, res) => {
    try {
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
    }
    catch (error) {
        console.error('Error getting inventory alerts:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getInventoryAlerts = getInventoryAlerts;
const generateMonthlyFinancials = (invoices, timeRange) => {
    const currentDate = new Date();
    const months = [];
    let numberOfMonths = 0;
    switch (timeRange) {
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
    invoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        const monthIndex = numberOfMonths - 1 - (currentDate.getMonth() - invoiceDate.getMonth() + (12 * (currentDate.getFullYear() - invoiceDate.getFullYear())));
        if (monthIndex >= 0 && monthIndex < months.length) {
            months[monthIndex].income += invoice.total;
            months[monthIndex].profit += invoice.total;
        }
    });
    months.forEach(month => {
        month.profit = month.income - month.expenses;
    });
    return months;
};
const calculateServicesByType = (invoices) => {
    const serviceTypes = {};
    invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach((item) => {
                if (item.type === 'service') {
                    const serviceName = item.description.split(' ')[0];
                    const amount = item.quantity * item.unitPrice;
                    if (serviceTypes[serviceName]) {
                        serviceTypes[serviceName] += amount;
                    }
                    else {
                        serviceTypes[serviceName] = amount;
                    }
                }
            });
        }
    });
    return Object.keys(serviceTypes).map(key => ({
        name: key,
        value: serviceTypes[key]
    }));
};
const calculateVehiclesByMake = (clients) => {
    const vehicleMakes = {};
    clients.forEach(client => {
        if (client.carDetails && client.carDetails.make) {
            const make = client.carDetails.make;
            if (vehicleMakes[make]) {
                vehicleMakes[make]++;
            }
            else {
                vehicleMakes[make] = 1;
            }
        }
    });
    return Object.keys(vehicleMakes).map(key => ({
        name: key,
        value: vehicleMakes[key]
    }));
};
//# sourceMappingURL=dashboardController.js.map