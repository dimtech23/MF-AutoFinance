import mongoose, { Schema, Document } from 'mongoose';

export interface InvoiceDocument extends Document {
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  customerInfo: {
    id?: mongoose.Schema.Types.ObjectId;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  vehicleInfo: {
    id?: string;
    make?: string;
    model?: string;
    year?: string;
    licensePlate?: string;
    vin?: string;
    odometer?: string;
  };
  items: {
    id: number;
    type: 'service' | 'part';
    description: string;
    quantity: number;
    unitPrice: number;
    laborHours?: number;
    laborRate?: number;
    taxable: boolean;
  }[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  paymentReference?: string;
  paidAmount?: number;
  partialPayment?: boolean;
  mechanicNotes?: string;
  relatedClientId?: mongoose.Schema.Types.ObjectId;
  relatedRepairId?: string;
  createdBy: mongoose.Schema.Types.ObjectId;
}

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'], 
    default: 'draft' 
  },
  issueDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },
  customerInfo: {
    id: { type: Schema.Types.ObjectId, ref: 'Client' },
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  vehicleInfo: {
    id: String,
    make: String,
    model: String,
    year: String,
    licensePlate: String,
    vin: String,
    odometer: String
  },
  items: [{
    id: Number,
    type: { type: String, enum: ['service', 'part'], required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    laborHours: { type: Number, default: 0 },
    laborRate: { type: Number, default: 85 },
    taxable: { type: Boolean, default: true }
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 7.5 },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: String,
  terms: String,
  paymentMethod: String,
  paymentDate: Date,
  paymentReference: String,
  paidAmount: { type: Number, default: 0 },
  partialPayment: { type: Boolean, default: false },
  mechanicNotes: String,
  relatedClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  relatedRepairId: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const Invoice = mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
export default Invoice;