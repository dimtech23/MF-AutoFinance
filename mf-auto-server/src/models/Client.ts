// models/Client.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ClientDocument extends Document {
  clientName: string;
  phoneNumber: string;
  email?: string;
  carDetails: {
    make?: string;
    model?: string;
    year?: string;
    licensePlate?: string;
    color?: string;
    vin?: string;
  };
  procedures: any[];
  issueDescription?: string;
  preExistingIssues?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  deliveryDate?: Date;
  paymentStatus: 'paid' | 'not_paid' | 'partial';
  partialPaymentAmount?: number;
  paymentMethod?: string;
  paymentDate?: Date;
  paymentReference?: string;
  repairStatus: 'waiting' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  notes?: string;
  images?: {
    name: string;
    url: string;
    uploadDate: Date;
  }[];
  deliveryNotes?: string;
  deliveryImages?: {
    name: string;
    url: string;
    uploadDate: Date;
  }[];
  createdBy: mongoose.Schema.Types.ObjectId;
  updatedBy?: mongoose.Schema.Types.ObjectId;
  documents?: {
    name: string;
    url: string;
    type: string;
    uploadDate: Date;
  }[];
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  carDetails: {
    make: { type: String },
    model: { type: String },
    year: { type: String },
    licensePlate: { type: String },
    color: { type: String },
    vin: { type: String }
  },
  procedures: [{ type: Object }],
  issueDescription: { type: String },
  preExistingIssues: { type: String },
  estimatedDuration: { type: Number, default: 1 },
  estimatedCost: { type: Number },
  deliveryDate: { type: Date },
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'not_paid', 'partial'], 
    default: 'not_paid' 
  },
  partialPaymentAmount: { type: Number, default: 0 },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  paymentReference: { type: String },
  repairStatus: { 
    type: String, 
    enum: ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'], 
    default: 'waiting' 
  },
  notes: { type: String },
  images: [{
    name: String,
    url: String,
    uploadDate: Date
  }],
  deliveryNotes: { type: String },
  deliveryImages: [{
    name: String,
    url: String,
    uploadDate: Date
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadDate: Date
  }],
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const Client = mongoose.model<ClientDocument>('Client', ClientSchema);
export default Client;