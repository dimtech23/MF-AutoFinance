import { Request } from 'express';
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
export declare class AuditService {
    static logEvent(req: Request, auditData: AuditLogData): Promise<void>;
    static logClientCreation(req: Request, clientId: string, clientData: any): Promise<void>;
    static logClientUpdate(req: Request, clientId: string, oldData: any, newData: any): Promise<void>;
    static logClientDeletion(req: Request, clientId: string, clientData: any): Promise<void>;
    static logClientRestoration(req: Request, clientId: string, clientData: any): Promise<void>;
    static logStatusChange(req: Request, clientId: string, oldStatus: string, newStatus: string, statusType: 'repair' | 'payment'): Promise<void>;
    static logPaymentUpdate(req: Request, clientId: string, oldPaymentData: any, newPaymentData: any): Promise<void>;
    static logDelivery(req: Request, clientId: string, deliveryData: any): Promise<void>;
    private static detectChanges;
    private static detectPaymentChanges;
    static getEntityAuditLogs(entityType: string, entityId: string, limit?: number): Promise<any[]>;
    static getUserAuditLogs(userId: string, limit?: number): Promise<any[]>;
}
