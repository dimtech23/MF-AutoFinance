import mongoose, { Schema, Document } from 'mongoose';

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

const AppointmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String, required: true },
  vehicleInfo: { type: String },
  type: { 
    type: String, 
    enum: ['repair', 'maintenance', 'inspection', 'invoice', 'delivery', 'documentation'], 
    default: 'repair' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'waiting'], 
    default: 'scheduled' 
  },
  description: { type: String },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

const Appointment = mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
export default Appointment;