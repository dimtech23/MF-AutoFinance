"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppointment = exports.updateAppointmentStatus = exports.updateAppointment = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Client_1 = __importDefault(require("../models/Client"));
const mongoose_1 = __importDefault(require("mongoose"));
const getAllAppointments = async (req, res) => {
    try {
        const { startDate, endDate, clientId, status, type } = req.query;
        const filter = {};
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        else if (startDate) {
            filter.date = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            filter.date = { $lte: new Date(endDate) };
        }
        if (clientId) {
            filter.clientId = clientId;
        }
        if (status) {
            filter.status = status;
        }
        if (type) {
            filter.type = type;
        }
        const appointments = await Appointment_1.default.find(filter)
            .sort({ date: 1, time: 1 })
            .populate('clientId', 'clientName carDetails')
            .populate('invoiceId', 'invoiceNumber')
            .populate('createdBy', 'firstName lastName');
        return res.status(200).json(appointments);
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getAllAppointments = getAllAppointments;
const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment_1.default.findById(req.params.id)
            .populate('clientId', 'clientName carDetails email phoneNumber')
            .populate('invoiceId', 'invoiceNumber total')
            .populate('createdBy', 'firstName lastName');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        return res.status(200).json(appointment);
    }
    catch (error) {
        console.error('Error fetching appointment:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.getAppointmentById = getAppointmentById;
const createAppointment = async (req, res) => {
    try {
        const { title, date, time, clientId, clientName, vehicleInfo, type, status, description, invoiceId } = req.body;
        const appointmentDateTime = new Date(date);
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            appointmentDateTime.setHours(hours, minutes);
        }
        if (clientId) {
            const client = await Client_1.default.findById(clientId);
            if (!client) {
                return res.status(400).json({ message: 'Client not found' });
            }
        }
        const newAppointment = new Appointment_1.default({
            title,
            date: appointmentDateTime,
            time,
            clientId: clientId || null,
            clientName: clientName || 'Unspecified',
            vehicleInfo,
            type,
            status,
            description,
            invoiceId: invoiceId || null,
            createdBy: req.user._id
        });
        const savedAppointment = await newAppointment.save();
        if (clientId && type === 'repair') {
            const statusMap = {
                'scheduled': 'waiting',
                'in_progress': 'in_progress',
                'completed': 'completed',
                'cancelled': 'cancelled'
            };
            await Client_1.default.findByIdAndUpdate(clientId, { $set: { repairStatus: statusMap[status] || 'waiting' } }, { new: true });
        }
        return res.status(201).json(savedAppointment);
    }
    catch (error) {
        console.error('Error creating appointment:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.createAppointment = createAppointment;
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const appointment = await Appointment_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        await updateRelatedClient(id, updates);
        return res.status(200).json(appointment);
    }
    catch (error) {
        console.error('Error updating appointment:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAppointment = updateAppointment;
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'waiting'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const appointment = await Appointment_1.default.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        appointment.status = status;
        await appointment.save();
        await updateRelatedClient(req.params.id, { status });
        return res.status(200).json(appointment);
    }
    catch (error) {
        console.error('Error updating appointment status:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const updateRelatedClient = async (appointmentId, updatedFields) => {
    try {
        const appointment = await Appointment_1.default.findById(appointmentId);
        if (!appointment || !appointment.clientId)
            return;
        const client = await Client_1.default.findById(appointment.clientId);
        if (!client)
            return;
        const clientUpdates = {};
        if (appointment.type === 'repair' && updatedFields.status) {
            const statusMap = {
                'scheduled': 'waiting',
                'in_progress': 'in_progress',
                'completed': 'completed',
                'cancelled': 'cancelled'
            };
            const newStatus = statusMap[updatedFields.status];
            if (newStatus && client.repairStatus !== newStatus) {
                clientUpdates.repairStatus = newStatus;
            }
        }
        if (updatedFields.date || updatedFields.time) {
            const futureAppointments = await Appointment_1.default.find({
                clientId: appointment.clientId,
                date: { $gte: new Date() },
                status: 'scheduled'
            }).sort({ date: 1 });
            if (futureAppointments.length > 0) {
                clientUpdates.nextAppointmentDate = futureAppointments[0].date;
            }
        }
        if (updatedFields.status === 'completed' && appointment.type === 'repair') {
            clientUpdates.lastServiceDate = new Date();
        }
        if (Object.keys(clientUpdates).length > 0) {
            await Client_1.default.findByIdAndUpdate(client._id, clientUpdates);
        }
    }
    catch (error) {
        console.error('Error updating related client:', error);
    }
};
const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment_1.default.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        await Appointment_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Appointment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting appointment:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.deleteAppointment = deleteAppointment;
//# sourceMappingURL=appointmentController.js.map