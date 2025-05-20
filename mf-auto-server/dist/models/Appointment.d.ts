import mongoose, { Document } from 'mongoose';
export interface AppointmentDocument extends Document {
    title: string;
    date: Date;
    time: string;
    clientId?: mongoose.Schema.Types.ObjectId;
    clientName: string;
    vehicleInfo?: string;
    type: 'repair' | 'maintenance' | 'inspection' | 'invoice' | 'delivery' | 'documentation';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'waiting';
    description?: string;
    invoiceId?: mongoose.Schema.Types.ObjectId;
    createdBy: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const Appointment: mongoose.Model<AppointmentDocument, {}, {}, {}, mongoose.Document<unknown, {}, AppointmentDocument, {}> & AppointmentDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Appointment;
