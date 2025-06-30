import mongoose, { Document } from 'mongoose';
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
declare const Client: mongoose.Model<ClientDocument, {}, {}, {}, mongoose.Document<unknown, {}, ClientDocument, {}> & ClientDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Client;
