import { Request } from 'express';
import AuditLog from '../models/AuditLog';

export interface AuditLogData {
  entityType: 'client' | 'invoice' | 'appointment' | 'user';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'status_change' | 'payment_update' | 'delivery';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    [key: string]: any;
  };
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(req: Request, auditData: AuditLogData): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        console.warn('No user found in request for audit logging');
        return;
      }

      const auditLog = new AuditLog({
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        action: auditData.action,
        userId: user._id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        userRole: user.role,
        changes: auditData.changes || [],
        metadata: auditData.metadata || {},
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      await auditLog.save();
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log client creation
   */
  static async logClientCreation(req: Request, clientId: string, clientData: any): Promise<void> {
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'create',
      metadata: {
        clientName: clientData.clientName,
        phoneNumber: clientData.phoneNumber,
        carDetails: clientData.carDetails
      }
    });
  }

  /**
   * Log client update
   */
  static async logClientUpdate(req: Request, clientId: string, oldData: any, newData: any): Promise<void> {
    const changes = this.detectChanges(oldData, newData);
    
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'update',
      changes,
      metadata: {
        clientName: newData.clientName,
        updatedFields: changes.map(c => c.field)
      }
    });
  }

  /**
   * Log client deletion
   */
  static async logClientDeletion(req: Request, clientId: string, clientData: any): Promise<void> {
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'delete',
      metadata: {
        clientName: clientData.clientName,
        phoneNumber: clientData.phoneNumber,
        carDetails: clientData.carDetails,
        deletedAt: new Date()
      }
    });
  }

  /**
   * Log client restoration
   */
  static async logClientRestoration(req: Request, clientId: string, clientData: any): Promise<void> {
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'restore',
      metadata: {
        clientName: clientData.clientName,
        restoredAt: new Date()
      }
    });
  }

  /**
   * Log status change
   */
  static async logStatusChange(req: Request, clientId: string, oldStatus: string, newStatus: string, statusType: 'repair' | 'payment'): Promise<void> {
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'status_change',
      changes: [{
        field: `${statusType}Status`,
        oldValue: oldStatus,
        newValue: newStatus
      }],
      metadata: {
        statusType,
        changedAt: new Date()
      }
    });
  }

  /**
   * Log payment update
   */
  static async logPaymentUpdate(req: Request, clientId: string, oldPaymentData: any, newPaymentData: any): Promise<void> {
    const changes = this.detectPaymentChanges(oldPaymentData, newPaymentData);
    
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'payment_update',
      changes,
      metadata: {
        paymentMethod: newPaymentData.paymentMethod,
        paymentDate: newPaymentData.paymentDate,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Log delivery
   */
  static async logDelivery(req: Request, clientId: string, deliveryData: any): Promise<void> {
    await this.logEvent(req, {
      entityType: 'client',
      entityId: clientId,
      action: 'delivery',
      metadata: {
        deliveryDate: deliveryData.deliveryDate,
        deliveryNotes: deliveryData.deliveryNotes,
        deliveredAt: new Date()
      }
    });
  }

  /**
   * Detect changes between old and new data
   */
  private static detectChanges(oldData: any, newData: any): { field: string; oldValue: any; newValue: any }[] {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    if (!oldData || !newData) return changes;

    const fieldsToTrack = [
      'clientName', 'phoneNumber', 'email', 'carDetails', 'issueDescription',
      'preExistingIssues', 'estimatedDuration', 'estimatedCost', 'deliveryDate',
      'notes', 'repairStatus', 'paymentStatus', 'partialPaymentAmount'
    ];

    fieldsToTrack.forEach(field => {
      if (oldData[field] !== newData[field]) {
        changes.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field]
        });
      }
    });

    return changes;
  }

  /**
   * Detect payment-specific changes
   */
  private static detectPaymentChanges(oldData: any, newData: any): { field: string; oldValue: any; newValue: any }[] {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    if (!oldData || !newData) return changes;

    const paymentFields = [
      'paymentStatus', 'partialPaymentAmount', 'paymentMethod', 
      'paymentDate', 'paymentReference'
    ];

    paymentFields.forEach(field => {
      if (oldData[field] !== newData[field]) {
        changes.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field]
        });
      }
    });

    return changes;
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(entityType: string, entityId: string, limit: number = 50): Promise<any[]> {
    try {
      const logs = await AuditLog.find({
        entityType,
        entityId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .lean();

      return logs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const logs = await AuditLog.find({
        userId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('entityId')
      .lean();

      return logs;
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      return [];
    }
  }
} 