import mongoose, { Document } from 'mongoose';
export interface AuditLogDocument extends Document {
    entityType: 'client' | 'invoice' | 'appointment' | 'user';
    entityId: mongoose.Schema.Types.ObjectId;
    action: 'create' | 'update' | 'delete' | 'restore' | 'status_change' | 'payment_update' | 'delivery';
    userId: mongoose.Schema.Types.ObjectId;
    userName: string;
    userRole: string;
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    metadata?: {
        [key: string]: any;
    };
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
declare const AuditLog: mongoose.Model<AuditLogDocument, {}, {}, {}, mongoose.Document<unknown, {}, AuditLogDocument, {}> & AuditLogDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default AuditLog;
