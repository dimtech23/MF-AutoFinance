"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
class AuditService {
    static async logEvent(req, auditData) {
        try {
            const user = req.user;
            if (!user) {
                console.warn('No user found in request for audit logging');
                return;
            }
            const auditLog = new AuditLog_1.default({
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
        }
        catch (error) {
            console.error('Error logging audit event:', error);
        }
    }
    static async logClientCreation(req, clientId, clientData) {
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
    static async logClientUpdate(req, clientId, oldData, newData) {
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
    static async logClientDeletion(req, clientId, clientData) {
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
    static async logClientRestoration(req, clientId, clientData) {
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
    static async logStatusChange(req, clientId, oldStatus, newStatus, statusType) {
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
    static async logPaymentUpdate(req, clientId, oldPaymentData, newPaymentData) {
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
    static async logDelivery(req, clientId, deliveryData) {
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
    static detectChanges(oldData, newData) {
        const changes = [];
        if (!oldData || !newData)
            return changes;
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
    static detectPaymentChanges(oldData, newData) {
        const changes = [];
        if (!oldData || !newData)
            return changes;
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
    static async getEntityAuditLogs(entityType, entityId, limit = 50) {
        try {
            const logs = await AuditLog_1.default.find({
                entityType,
                entityId
            })
                .sort({ timestamp: -1 })
                .limit(limit)
                .populate('userId', 'firstName lastName email')
                .lean();
            return logs;
        }
        catch (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }
    }
    static async getUserAuditLogs(userId, limit = 50) {
        try {
            const logs = await AuditLog_1.default.find({
                userId
            })
                .sort({ timestamp: -1 })
                .limit(limit)
                .populate('entityId')
                .lean();
            return logs;
        }
        catch (error) {
            console.error('Error fetching user audit logs:', error);
            return [];
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map