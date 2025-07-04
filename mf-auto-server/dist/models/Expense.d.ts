import mongoose, { Document } from 'mongoose';
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
    receipt?: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    tags?: string[];
}
declare const Expense: mongoose.Model<ExpenseDocument, {}, {}, {}, mongoose.Document<unknown, {}, ExpenseDocument, {}> & ExpenseDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Expense;
