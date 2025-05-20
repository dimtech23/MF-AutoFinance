import mongoose, { Document } from 'mongoose';
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
declare const Invoice: mongoose.Model<InvoiceDocument, {}, {}, {}, mongoose.Document<unknown, {}, InvoiceDocument, {}> & InvoiceDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Invoice;
