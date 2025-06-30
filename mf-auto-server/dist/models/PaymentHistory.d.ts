import mongoose, { Document } from 'mongoose';
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
declare const PaymentHistory: mongoose.Model<PaymentHistoryDocument, {}, {}, {}, mongoose.Document<unknown, {}, PaymentHistoryDocument, {}> & PaymentHistoryDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default PaymentHistory;
