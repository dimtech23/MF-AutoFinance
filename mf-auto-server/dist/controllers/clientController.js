"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientSummary = exports.getAllClientHistory = exports.registerAdmin = exports.markAsDelivered = exports.updatePaymentStatus = exports.updateClientStatus = exports.getClientHistory = exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getAllClients = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const getAllClients = async (req, res) => {
    try {
        const clients = await Client_1.default.find().sort({ createdAt: -1 });
        if (req.user.role === roles_1.UserRole.MECHANIC) {
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
    }
    catch (error) {
        console.error('Error fetching clients:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllClients = getAllClients;
const getClientById = async (req, res) => {
    try {
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (req.user.role === roles_1.UserRole.MECHANIC) {
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
    }
    catch (error) {
        console.error('Error fetching client:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientById = getClientById;
const createClient = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to create clients' });
        }
        const newClient = new Client_1.default({
            ...req.body,
            createdBy: req.user._id
        });
        const savedClient = await newClient.save();
        return res.status(201).json(savedClient);
    }
    catch (error) {
        console.error('Error creating client:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createClient = createClient;
const updateClient = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to update clients' });
        }
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                ...req.body,
                updatedBy: req.user._id
            }
        }, { new: true, runValidators: true });
        await updateRelatedAppointments(req.params.id, req.body);
        return res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error updating client:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        if (req.user.role !== roles_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to delete clients' });
        }
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        await Client_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Client deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteClient = deleteClient;
const getClientHistory = async (req, res) => {
    try {
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const repairHistory = [];
        return res.status(200).json(repairHistory);
    }
    catch (error) {
        console.error('Error fetching client history:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientHistory = getClientHistory;
const updateClientStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (req.user.role === roles_1.UserRole.MECHANIC) {
            if (!['in_progress', 'completed'].includes(status)) {
                return res.status(403).json({ message: 'Mechanics can only update status to in_progress or completed' });
            }
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                repairStatus: status,
                updatedBy: req.user._id
            }
        }, { new: true });
        return res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error updating client status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClientStatus = updateClientStatus;
const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const validStatuses = ['pending', 'partial', 'paid'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to update payment status' });
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                paymentStatus,
                updatedBy: req.user._id
            }
        }, { new: true });
        return res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const markAsDelivered = async (req, res) => {
    try {
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to mark client as delivered' });
        }
        if (client.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Cannot mark as delivered until payment is complete' });
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                repairStatus: 'delivered',
                deliveryDate: new Date(),
                updatedBy: req.user._id
            }
        }, { new: true });
        return res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error marking client as delivered:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.markAsDelivered = markAsDelivered;
const updateRelatedAppointments = async (clientId, updatedFields) => {
    try {
        const client = await Client_1.default.findById(clientId);
        if (!client)
            return;
        if (!updatedFields.clientName && !updatedFields.carDetails)
            return;
        const clientAppointments = await Appointment_1.default.find({ clientId });
        for (const appointment of clientAppointments) {
            const appointmentUpdates = {};
            if (updatedFields.clientName && appointment.clientName !== updatedFields.clientName) {
                appointmentUpdates.clientName = updatedFields.clientName;
                if (appointment.title && appointment.title.includes(appointment.clientName)) {
                    appointmentUpdates.title = appointment.title.replace(appointment.clientName, updatedFields.clientName);
                }
            }
            if (updatedFields.carDetails) {
                const vehicleInfo = `${updatedFields.carDetails.year || ""} ${updatedFields.carDetails.make || ""} ${updatedFields.carDetails.model || ""}`.trim();
                if (vehicleInfo && appointment.vehicleInfo !== vehicleInfo) {
                    appointmentUpdates.vehicleInfo = vehicleInfo;
                }
            }
            if (updatedFields.repairStatus && appointment.type === 'repair') {
                const statusMap = {
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
            if (Object.keys(appointmentUpdates).length > 0) {
                await Appointment_1.default.findByIdAndUpdate(appointment._id, appointmentUpdates);
            }
        }
    }
    catch (error) {
        console.error('Error updating related appointments:', error);
    }
};
const registerAdmin = async (req, res) => {
    try {
        const adminExists = await User_1.default.findOne({ role: roles_1.UserRole.ADMIN });
        if (adminExists) {
            return res.status(403).json({ message: 'Admin user already exists' });
        }
        const { firstName, lastName, email, phone, password } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const adminUser = new User_1.default({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: roles_1.UserRole.ADMIN,
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
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.registerAdmin = registerAdmin;
const getAllClientHistory = async (req, res) => {
    try {
        const { startDate, endDate, type, status, category } = req.query;
        const query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = new Date(startDate);
            if (endDate)
                query.date.$lte = new Date(endDate);
        }
        if (type)
            query.type = type;
        if (status)
            query.status = status;
        if (category)
            query.category = category;
        const clients = await Client_1.default.find().sort({ createdAt: -1 });
        const history = clients.flatMap(client => {
            const activities = [];
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
        const filteredHistory = history.filter(activity => {
            if (query.date && activity.date) {
                if (query.date.$gte && new Date(activity.date) < query.date.$gte)
                    return false;
                if (query.date.$lte && new Date(activity.date) > query.date.$lte)
                    return false;
            }
            if (query.type && activity.type !== query.type)
                return false;
            if (query.status && activity.status !== query.status)
                return false;
            if (query.category && activity.category !== query.category)
                return false;
            return true;
        });
        filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.status(200).json(filteredHistory);
    }
    catch (error) {
        console.error('Error fetching all client history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllClientHistory = getAllClientHistory;
const getClientSummary = async (_req, res) => {
    try {
        const totalClients = await Client_1.default.countDocuments();
        const activeClients = await Client_1.default.countDocuments({ repairStatus: { $in: ['waiting', 'in_progress'] } });
        const completedClients = await Client_1.default.countDocuments({ repairStatus: 'completed' });
        const deliveredClients = await Client_1.default.countDocuments({ repairStatus: 'delivered' });
        return res.status(200).json({
            totalClients,
            activeClients,
            completedClients,
            deliveredClients
        });
    }
    catch (error) {
        console.error('Error fetching client summary:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientSummary = getClientSummary;
//# sourceMappingURL=clientController.js.map