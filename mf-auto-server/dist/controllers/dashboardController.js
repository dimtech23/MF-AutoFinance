"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentHistory = exports.getInventoryAlerts = exports.getAppointments = exports.getTransactions = exports.getDashboardStats = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const PaymentHistory_1 = __importDefault(require("../models/PaymentHistory"));
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
        const paymentHistory = await PaymentHistory_1.default.find({
            paymentDate: { $gte: startDate, $lte: currentDate },
            status: 'completed'
        });
        const totalRevenue = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
        const invoiceTotals = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const clientPaymentTotals = clients.reduce((sum, client) => {
            if (client.paymentStatus === 'paid' && client.partialPaymentAmount) {
                return sum + client.partialPaymentAmount;
            }
            else if (client.paymentStatus === 'partial' && client.partialPaymentAmount) {
                return sum + client.partialPaymentAmount;
            }
            return sum;
        }, 0);
        const totalEstimatedCosts = clients.reduce((sum, client) => {
            return sum + (client.estimatedCost || 0);
        }, 0);
        const totalIncome = totalRevenue;
        const netProfit = totalIncome;
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
        const monthlyFinancials = generateMonthlyFinancials(invoices, clients, paymentHistory, timeRange);
        const servicesByType = calculateServicesByType(invoices, clients);
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
        const recentPayments = await PaymentHistory_1.default.find()
            .sort({ paymentDate: -1 })
            .limit(10)
            .populate('clientId', 'clientName carDetails')
            .populate('invoiceId', 'invoiceNumber customerInfo vehicleInfo');
        const invoiceTransactions = recentInvoices.map(invoice => {
            var _a, _b, _c;
            return ({
                id: invoice._id,
                date: invoice.issueDate || invoice.createdAt,
                type: 'income',
                category: 'Invoice',
                description: `Invoice #${invoice.invoiceNumber || 'N/A'} - ${((_a = invoice.customerInfo) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Customer'}`,
                amount: invoice.total || 0,
                customerInfo: {
                    name: ((_b = invoice.customerInfo) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                    id: (_c = invoice.customerInfo) === null || _c === void 0 ? void 0 : _c.id
                },
                vehicleInfo: invoice.vehicleInfo ?
                    (typeof invoice.vehicleInfo === 'string' ? invoice.vehicleInfo :
                        `${invoice.vehicleInfo.year || ''} ${invoice.vehicleInfo.make || ''} ${invoice.vehicleInfo.model || ''}`.trim()) :
                    null,
                status: invoice.status || 'completed',
                source: 'invoice'
            });
        });
        const paymentTransactions = recentPayments.map(payment => {
            const client = payment.clientId;
            const invoice = payment.invoiceId;
            return {
                id: payment._id,
                date: payment.paymentDate,
                type: 'income',
                category: 'Payment',
                description: payment.description || `Payment from ${(client === null || client === void 0 ? void 0 : client.clientName) || 'Unknown Customer'}`,
                amount: payment.amount,
                customerInfo: {
                    name: (client === null || client === void 0 ? void 0 : client.clientName) || 'Unknown',
                    id: client === null || client === void 0 ? void 0 : client._id
                },
                vehicleInfo: (client === null || client === void 0 ? void 0 : client.carDetails) ?
                    `${client.carDetails.make || ''} ${client.carDetails.model || ''}`.trim() :
                    ((invoice === null || invoice === void 0 ? void 0 : invoice.vehicleInfo) ?
                        (typeof invoice.vehicleInfo === 'string' ? invoice.vehicleInfo :
                            `${invoice.vehicleInfo.year || ''} ${invoice.vehicleInfo.make || ''} ${invoice.vehicleInfo.model || ''}`.trim()) :
                        null),
                status: payment.status,
                source: 'payment',
                paymentMethod: payment.paymentMethod,
                paymentReference: payment.paymentReference
            };
        });
        const allTransactions = [...invoiceTransactions, ...paymentTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
        return res.status(200).json(allTransactions);
    }
    catch (error) {
        console.error('Error getting transactions:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getTransactions = getTransactions;
const getAppointments = async (_req, res) => {
    try {
        const upcomingAppointments = await Appointment_1.default.find({
            date: { $gte: new Date() },
            status: { $in: ['scheduled', 'in_progress', 'confirmed'] }
        })
            .sort({ date: 1 })
            .limit(10)
            .populate('clientId', 'clientName phoneNumber carDetails');
        const formattedAppointments = upcomingAppointments.map(appointment => {
            const apptDate = new Date(appointment.date);
            let timeString = apptDate.toISOString();
            if (appointment.time) {
                const [hours, minutes] = appointment.time.split(':').map(Number);
                apptDate.setHours(hours, minutes);
                timeString = apptDate.toISOString();
            }
            const client = appointment.clientId;
            const clientName = (client === null || client === void 0 ? void 0 : client.clientName) || appointment.clientName || 'Unknown Customer';
            const phoneNumber = (client === null || client === void 0 ? void 0 : client.phoneNumber) || appointment.phoneNumber || 'No Phone';
            const vehicleInfo = (client === null || client === void 0 ? void 0 : client.carDetails) ?
                `${client.carDetails.make || ''} ${client.carDetails.model || ''}`.trim() :
                appointment.vehicleInfo || 'Vehicle not specified';
            return {
                id: appointment._id,
                time: timeString,
                date: appointment.date,
                status: appointment.status || 'scheduled',
                customer: clientName,
                clientName: clientName,
                service: appointment.type || appointment.service || 'Service',
                type: appointment.type || appointment.service || 'Service',
                vehicle: vehicleInfo,
                phoneNumber: phoneNumber,
                description: appointment.description || `Service appointment for ${clientName}`,
                clientId: (client === null || client === void 0 ? void 0 : client._id) || null
            };
        });
        return res.status(200).json(formattedAppointments);
    }
    catch (error) {
        console.error('Error getting appointments:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
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
const generateMonthlyFinancials = (invoices, clients, paymentHistory, timeRange) => {
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
            profit: 0
        });
    }
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
            months[monthIndex].profit += (invoice.total || 0);
        }
    });
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
            }
            else if (client.paymentStatus === 'partial' && client.partialPaymentAmount) {
                clientPayment = client.partialPaymentAmount;
            }
            months[monthIndex].income += clientPayment;
            months[monthIndex].profit += clientPayment;
        }
    });
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
            months[monthIndex].profit += payment.amount;
        }
    });
    months.forEach(month => {
        month.profit = month.income;
    });
    return months;
};
const calculateServicesByType = (invoices, clients) => {
    const serviceTypes = {};
    invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach((item) => {
                if (item.type === 'service') {
                    let serviceName = item.description || 'General Service';
                    if (serviceName.toLowerCase().includes('oil')) {
                        serviceName = 'Oil Change';
                    }
                    else if (serviceName.toLowerCase().includes('brake')) {
                        serviceName = 'Brake Service';
                    }
                    else if (serviceName.toLowerCase().includes('engine')) {
                        serviceName = 'Engine Repair';
                    }
                    else if (serviceName.toLowerCase().includes('transmission')) {
                        serviceName = 'Transmission Service';
                    }
                    else if (serviceName.toLowerCase().includes('tire')) {
                        serviceName = 'Tire Service';
                    }
                    else if (serviceName.toLowerCase().includes('diagnostic')) {
                        serviceName = 'Diagnostic Service';
                    }
                    else if (serviceName.toLowerCase().includes('maintenance')) {
                        serviceName = 'Maintenance Service';
                    }
                    else if (serviceName.toLowerCase().includes('repair')) {
                        serviceName = 'General Repair';
                    }
                    else if (serviceName.toLowerCase().includes('service')) {
                        serviceName = 'General Service';
                    }
                    const amount = (item.quantity || 1) * (item.unitPrice || 0);
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
    if (Object.keys(serviceTypes).length === 0) {
        clients.forEach(client => {
            if (client.procedures && Array.isArray(client.procedures)) {
                client.procedures.forEach((procedure) => {
                    let serviceName = 'General Service';
                    if (typeof procedure === 'string') {
                        serviceName = procedure;
                    }
                    else if (procedure.label) {
                        serviceName = procedure.label;
                    }
                    else if (procedure.name) {
                        serviceName = procedure.name;
                    }
                    if (serviceName.toLowerCase().includes('oil')) {
                        serviceName = 'Oil Change';
                    }
                    else if (serviceName.toLowerCase().includes('brake')) {
                        serviceName = 'Brake Service';
                    }
                    else if (serviceName.toLowerCase().includes('engine')) {
                        serviceName = 'Engine Repair';
                    }
                    else if (serviceName.toLowerCase().includes('transmission')) {
                        serviceName = 'Transmission Service';
                    }
                    else if (serviceName.toLowerCase().includes('tire')) {
                        serviceName = 'Tire Service';
                    }
                    else if (serviceName.toLowerCase().includes('diagnostic')) {
                        serviceName = 'Diagnostic Service';
                    }
                    else if (serviceName.toLowerCase().includes('maintenance')) {
                        serviceName = 'Maintenance Service';
                    }
                    else if (serviceName.toLowerCase().includes('repair')) {
                        serviceName = 'General Repair';
                    }
                    else if (serviceName.toLowerCase().includes('service')) {
                        serviceName = 'General Service';
                    }
                    if (serviceTypes[serviceName]) {
                        serviceTypes[serviceName]++;
                    }
                    else {
                        serviceTypes[serviceName] = 1;
                    }
                });
            }
        });
    }
    if (Object.keys(serviceTypes).length === 0) {
        return [];
    }
    return Object.keys(serviceTypes)
        .map(key => ({
        name: key,
        value: serviceTypes[key]
    }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
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
const getPaymentHistory = async (req, res) => {
    try {
        const { startDate, endDate, clientId, paymentMethod, status } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
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
        const paymentHistory = await PaymentHistory_1.default.find(query)
            .sort({ paymentDate: -1 })
            .populate('clientId', 'clientName carDetails')
            .populate('invoiceId', 'invoiceNumber customerInfo vehicleInfo total')
            .populate('recordedBy', 'firstName lastName');
        const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
        const paymentMethods = [...new Set(paymentHistory.map(p => p.paymentMethod))];
        const statusCounts = paymentHistory.reduce((acc, payment) => {
            acc[payment.status] = (acc[payment.status] || 0) + 1;
            return acc;
        }, {});
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
    }
    catch (error) {
        console.error('Error getting payment history:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getPaymentHistory = getPaymentHistory;
//# sourceMappingURL=dashboardController.js.map