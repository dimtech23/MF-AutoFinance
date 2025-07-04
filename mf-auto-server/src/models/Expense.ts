import mongoose, { Schema, Document } from 'mongoose';

export interface ExpenseDocument extends Document {
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: Date;
  supplier?: string;
  invoiceNumber?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money';
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string; // URL to uploaded receipt image
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  tags?: string[]; // For categorization like 'oil_filter', 'brake_pads', etc.
}

const ExpenseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'auto_parts',
      'oil_and_lubricants', 
      'tools_and_equipment',
      'office_supplies',
      'utilities',
      'rent',
      'insurance',
      'marketing',
      'staff_salary',
      'maintenance',
      'other'
    ]
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  supplier: { 
    type: String,
    trim: true
  },
  invoiceNumber: { 
    type: String,
    trim: true
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['cash', 'card', 'bank_transfer', 'mobile_money'],
    default: 'cash'
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  receipt: { 
    type: String // URL to uploaded file
  },
  notes: { 
    type: String,
    trim: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  approvedAt: { 
    type: Date 
  },
  tags: [{ 
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ createdBy: 1 });

// Virtual for formatted amount
ExpenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GMD'
  }).format(this.amount);
});

// Ensure virtuals are included in JSON output
ExpenseSchema.set('toJSON', { virtuals: true });

const Expense = mongoose.model<ExpenseDocument>('Expense', ExpenseSchema);
export default Expense; 