import mongoose, { Schema, Document } from 'mongoose';

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

const AuditLogSchema = new mongoose.Schema({
  entityType: { 
    type: String, 
    required: true,
    enum: ['client', 'invoice', 'appointment', 'user']
  },
  entityId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'entityType'
  },
  action: { 
    type: String, 
    required: true,
    enum: ['create', 'update', 'delete', 'restore', 'status_change', 'payment_update', 'delivery']
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'User'
  },
  userName: { 
    type: String, 
    required: true 
  },
  userRole: { 
    type: String, 
    required: true 
  },
  changes: [{
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }],
  metadata: { 
    type: Schema.Types.Mixed 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for efficient querying
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
export default AuditLog; 