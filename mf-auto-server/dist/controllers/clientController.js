"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientAuditLogs = exports.generateCompletionPDF = exports.getClientSummary = exports.getAllClientHistory = exports.registerAdmin = exports.markAsDelivered = exports.updatePaymentStatus = exports.updateClientStatus = exports.getClientHistory = exports.restoreClient = exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getAllClients = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const pdf_lib_1 = require("pdf-lib");
const date_fns_1 = require("date-fns");
const auditService_1 = require("../services/auditService");
const getAllClients = async (req, res) => {
    try {
        const clients = await Client_1.default.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
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
        const client = await Client_1.default.findOne({ _id: req.params.id, deleted: { $ne: true } });
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
    var _a, _b;
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to create clients' });
        }
        const newClient = new Client_1.default({
            ...req.body,
            createdBy: req.user._id
        });
        const savedClient = await newClient.save();
        const initialAppointment = new Appointment_1.default({
            title: `Initial Service - ${savedClient.clientName}`,
            date: new Date(),
            time: '10:00',
            clientId: savedClient._id,
            clientName: savedClient.clientName,
            vehicleInfo: ((_a = savedClient.carDetails) === null || _a === void 0 ? void 0 : _a.make) + ' ' + ((_b = savedClient.carDetails) === null || _b === void 0 ? void 0 : _b.model),
            type: 'repair',
            status: 'scheduled',
            description: savedClient.issueDescription || 'Initial service appointment',
            createdBy: req.user._id
        });
        await initialAppointment.save();
        await auditService_1.AuditService.logClientCreation(req, savedClient._id.toString(), {
            clientName: savedClient.clientName,
            phoneNumber: savedClient.phoneNumber,
            carDetails: savedClient.carDetails
        });
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
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const client = await Client_1.default.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const oldData = client.toObject();
        const updatedClient = await Client_1.default.findByIdAndUpdate(id, {
            $set: {
                ...req.body,
                updatedBy: req.user._id
            }
        }, { new: true, runValidators: true });
        await updateRelatedAppointments(id, req.body);
        if (updatedClient) {
            await auditService_1.AuditService.logClientUpdate(req, id, oldData, updatedClient.toObject());
        }
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
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const client = await Client_1.default.findOne({ _id: id, deleted: { $ne: true } });
        if (!client) {
            return res.status(404).json({ message: 'Client not found or already deleted' });
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(id, {
            $set: {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: req.user._id
            }
        }, { new: true });
        await auditService_1.AuditService.logClientDeletion(req, id, {
            clientName: client.clientName,
            phoneNumber: client.phoneNumber,
            carDetails: client.carDetails
        });
        return res.status(200).json({
            message: 'Client deleted successfully',
            client: updatedClient
        });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteClient = deleteClient;
const restoreClient = async (req, res) => {
    try {
        if (req.user.role !== roles_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to restore clients' });
        }
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const client = await Client_1.default.findOne({ _id: id, deleted: true });
        if (!client) {
            return res.status(404).json({ message: 'Deleted client not found' });
        }
        const restoredClient = await Client_1.default.findByIdAndUpdate(id, {
            $unset: {
                deleted: 1,
                deletedAt: 1,
                deletedBy: 1
            }
        }, { new: true });
        await auditService_1.AuditService.logClientRestoration(req, id, {
            clientName: client.clientName,
            phoneNumber: client.phoneNumber,
            carDetails: client.carDetails
        });
        return res.status(200).json({
            message: 'Client restored successfully',
            client: restoredClient
        });
    }
    catch (error) {
        console.error('Error restoring client:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.restoreClient = restoreClient;
const getClientHistory = async (req, res) => {
    try {
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const repairHistory = await Appointment_1.default.find({
            clientId: client._id,
            type: 'repair'
        }).sort({ date: -1 });
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
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const validStatuses = ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const client = await Client_1.default.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (req.user.role === roles_1.UserRole.MECHANIC) {
            if (!['in_progress', 'completed'].includes(status)) {
                return res.status(403).json({ message: 'Mechanics can only update status to in_progress or completed' });
            }
        }
        const oldStatus = client.repairStatus;
        const updatedClient = await Client_1.default.findByIdAndUpdate(id, {
            $set: {
                repairStatus: status,
                updatedBy: req.user._id
            }
        }, { new: true });
        await updateRelatedAppointments(id, { repairStatus: status });
        await auditService_1.AuditService.logStatusChange(req, id, oldStatus, status, 'repair');
        return res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error updating client status:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClientStatus = updateClientStatus;
const updatePaymentStatus = async (req, res) => {
    var _a, _b;
    try {
        const { paymentStatus, partialPaymentAmount, paymentMethod, paymentDate, paymentReference } = req.body;
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const validStatuses = ['pending', 'partial', 'paid', 'not_paid'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }
        const client = await Client_1.default.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to update payment status' });
        }
        const oldPaymentData = {
            paymentStatus: client.paymentStatus,
            partialPaymentAmount: client.partialPaymentAmount,
            paymentMethod: client.paymentMethod,
            paymentDate: client.paymentDate,
            paymentReference: client.paymentReference
        };
        const updateData = {
            paymentStatus,
            updatedBy: req.user._id
        };
        if (partialPaymentAmount !== undefined) {
            updateData.partialPaymentAmount = partialPaymentAmount;
        }
        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }
        if (paymentDate) {
            updateData.paymentDate = paymentDate;
        }
        if (paymentReference) {
            updateData.paymentReference = paymentReference;
        }
        if (partialPaymentAmount !== undefined && !req.body.paymentStatus) {
            if (partialPaymentAmount === 0) {
                updateData.paymentStatus = 'not_paid';
            }
            else if (partialPaymentAmount > 0) {
                const costThreshold = client.estimatedCost || 1000;
                updateData.paymentStatus = partialPaymentAmount >= costThreshold ? 'paid' : 'partial';
            }
        }
        const updatedClient = await Client_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        if (partialPaymentAmount && partialPaymentAmount > 0) {
            try {
                const PaymentHistory = mongoose_1.default.model('PaymentHistory');
                const paymentRecord = new PaymentHistory({
                    clientId: client._id,
                    amount: partialPaymentAmount,
                    paymentMethod: paymentMethod || 'cash',
                    paymentDate: paymentDate || new Date(),
                    paymentReference: paymentReference || `Payment for ${client.clientName}`,
                    status: updateData.paymentStatus,
                    recordedBy: req.user._id,
                    description: `Payment for ${client.clientName} - ${(_a = client.carDetails) === null || _a === void 0 ? void 0 : _a.make} ${(_b = client.carDetails) === null || _b === void 0 ? void 0 : _b.model}`
                });
                await paymentRecord.save();
            }
            catch (error) {
                console.error('Error creating payment history:', error);
            }
        }
        await auditService_1.AuditService.logPaymentUpdate(req, id, oldPaymentData, updateData);
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
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const client = await Client_1.default.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to mark client as delivered' });
        }
        if (client.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Cannot mark as delivered until payment is complete' });
        }
        const deliveryData = {
            deliveryDate: new Date(),
            deliveryNotes: req.body.deliveryNotes,
            deliveryImages: req.body.deliveryImages
        };
        const updatedClient = await Client_1.default.findByIdAndUpdate(id, {
            $set: {
                repairStatus: 'delivered',
                ...deliveryData,
                updatedBy: req.user._id
            }
        }, { new: true });
        await auditService_1.AuditService.logDelivery(req, id, deliveryData);
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
                    if (updatedFields.repairStatus === 'completed' && !appointment.deliveryDate) {
                        appointmentUpdates.deliveryDate = new Date();
                    }
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
const generateCompletionPDF = async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const client = await Client_1.default.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (!['completed', 'delivered'].includes(client.repairStatus)) {
            return res.status(400).json({ message: 'Can only generate completion PDF for completed or delivered clients' });
        }
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="completion-${client.clientName}-${client._id}.pdf"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const helveticaFont = await pdfDoc.embedFont('Helvetica');
        const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
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
        page.drawLine({
            start: { x: 40, y: 650 },
            end: { x: 555, y: 650 },
            thickness: 1,
        });
        const titleText = 'REPAIR COMPLETION CERTIFICATE';
        const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 20);
        page.drawText(titleText, {
            x: (595.28 - titleWidth) / 2,
            y: 620,
            size: 20,
            font: helveticaBold,
        });
        const leftColumn = 40;
        const rightColumn = 320;
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
        page.drawText(`Completion Date: ${(0, date_fns_1.format)(new Date(client.updatedAt), 'PPP')}`, {
            x: leftColumn,
            y: 500,
            size: 10,
            font: helveticaFont,
        });
        page.drawText('Vehicle Information:', {
            x: rightColumn,
            y: 580,
            size: 12,
            font: helveticaBold,
        });
        page.drawText(`Make: ${((_a = client.carDetails) === null || _a === void 0 ? void 0 : _a.make) || 'N/A'}`, {
            x: rightColumn,
            y: 560,
            size: 10,
            font: helveticaFont,
        });
        page.drawText(`Model: ${((_b = client.carDetails) === null || _b === void 0 ? void 0 : _b.model) || 'N/A'}`, {
            x: rightColumn,
            y: 545,
            size: 10,
            font: helveticaFont,
        });
        page.drawText(`Year: ${((_c = client.carDetails) === null || _c === void 0 ? void 0 : _c.year) || 'N/A'}`, {
            x: rightColumn,
            y: 530,
            size: 10,
            font: helveticaFont,
        });
        page.drawText(`License Plate: ${((_d = client.carDetails) === null || _d === void 0 ? void 0 : _d.licensePlate) || 'N/A'}`, {
            x: rightColumn,
            y: 515,
            size: 10,
            font: helveticaFont,
        });
        page.drawText(`VIN: ${((_e = client.carDetails) === null || _e === void 0 ? void 0 : _e.vin) || 'N/A'}`, {
            x: rightColumn,
            y: 500,
            size: 10,
            font: helveticaFont,
        });
        page.drawLine({
            start: { x: 40, y: 470 },
            end: { x: 555, y: 470 },
            thickness: 1,
        });
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
        if (client.procedures && client.procedures.length > 0) {
            page.drawText('Procedures Performed:', {
                x: 40,
                y: currentY,
                size: 12,
                font: helveticaBold,
            });
            currentY -= 20;
            client.procedures.forEach((procedure, index) => {
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
        if (client.preExistingIssues && Array.isArray(client.preExistingIssues)) {
            currentY -= 10;
            page.drawText('Pre-existing Issues:', {
                x: 40,
                y: currentY,
                size: 12,
                font: helveticaBold,
            });
            currentY -= 20;
            client.preExistingIssues.forEach((issue, index) => {
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
        page.drawLine({
            start: { x: 40, y: currentY },
            end: { x: 555, y: currentY },
            thickness: 1,
        });
        currentY -= 30;
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
        const pdfBytes = await pdfDoc.save();
        res.send(Buffer.from(pdfBytes));
        return res.status(200);
    }
    catch (error) {
        console.error('Error generating completion PDF:', error);
        return res.status(500).json({ message: 'Error generating PDF' });
    }
};
exports.generateCompletionPDF = generateCompletionPDF;
const getClientAuditLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }
        const client = await Client_1.default.findById(id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const auditLogs = await auditService_1.AuditService.getEntityAuditLogs('client', id, Number(limit));
        return res.status(200).json({
            clientId: id,
            clientName: client.clientName,
            auditLogs
        });
    }
    catch (error) {
        console.error('Error fetching client audit logs:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientAuditLogs = getClientAuditLogs;
//# sourceMappingURL=clientController.js.map