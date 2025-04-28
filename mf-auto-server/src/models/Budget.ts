import mongoose, { Schema, Document } from 'mongoose';

export interface BudgetDocument extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  total: number;
  categories: {
    id: number;
    name: string;
    allocated: number;
    spent: number;
  }[];
  notes?: string;
  status: 'active' | 'upcoming' | 'completed';
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId; // Changed from Schema.Types.ObjectId to Types.ObjectId and made optional
}

const BudgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  total: { type: Number, required: true },
  categories: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    allocated: { type: Number, required: true },
    spent: { type: Number, default: 0 }
  }],
  notes: { type: String },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'completed'],
    default: 'upcoming'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false } // Made explicitly not required
}, {
  timestamps: true
});

// Middleware to update status based on dates
BudgetSchema.pre('save', function(this: any, next) { // Changed type assertion approach
  // Update status based on dates
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now > this.endDate) {
    this.status = 'completed';
  } else {
    this.status = 'active';
  }
 
  next();
});

const Budget = mongoose.model<BudgetDocument>('Budget', BudgetSchema);
export default Budget;