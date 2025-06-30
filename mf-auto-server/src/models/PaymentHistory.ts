import mongoose, { Schema, Document } from 'mongoose';

export interface PaymentHistoryDocument extends Document {
  clientId: mongoose.Schema.Types.ObjectId;
  invoiceId?: mongoose.Schema.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  paymentReference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  recordedBy: mongoose.Schema.Types.ObjectId;
  description: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentHistorySchema = new mongoose.Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, default: 'cash' },
  paymentDate: { type: Date, required: true, default: Date.now },
  paymentReference: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'completed' 
  },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  notes: { type: String }
}, {
  timestamps: true
});

// Index for efficient queries
PaymentHistorySchema.index({ clientId: 1, paymentDate: -1 });
PaymentHistorySchema.index({ paymentDate: -1 });
PaymentHistorySchema.index({ status: 1 });

const PaymentHistory = mongoose.model<PaymentHistoryDocument>('PaymentHistory', PaymentHistorySchema);
export default PaymentHistory; 