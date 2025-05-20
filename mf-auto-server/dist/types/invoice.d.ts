export interface InvoiceItem {
    id: number;
    type: 'service' | 'part';
    description: string;
    quantity: number;
    unitPrice: number;
    laborHours?: number;
    laborRate?: number;
    taxable: boolean;
}
export interface InvoiceData {
    _id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    issueDate: Date;
    dueDate: Date;
    customerInfo: {
        name: string;
        id?: string;
    };
    items: InvoiceItem[];
    paymentMethod?: string;
    paymentDate?: Date;
}
export declare const isInvoiceData: (data: any) => data is InvoiceData;
export interface AgingBucket {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
}
export interface TrendData {
    period: string;
    revenue: number;
    invoices: number;
    averageAmount: number;
    collectionRate: number;
}
export interface ClientMetrics {
    clientId: string;
    clientName: string;
    totalSpent: number;
    invoiceCount: number;
    averageInvoiceAmount: number;
    lastInvoiceDate: Date;
    paymentHistory: {
        onTime: number;
        late: number;
        averageDaysToPay: number;
    };
}
export interface TaxAnalysis {
    totalTaxableAmount: number;
    totalTaxAmount: number;
    taxByCategory: Record<string, {
        taxableAmount: number;
        taxAmount: number;
    }>;
    taxByPeriod: Record<string, {
        taxableAmount: number;
        taxAmount: number;
    }>;
}
export interface ProfitabilityMetrics {
    revenueByService: Record<string, {
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
    }>;
    overallProfit: number;
    overallMargin: number;
    topProfitableServices: Array<{
        service: string;
        profit: number;
        margin: number;
    }>;
}
export interface Summary {
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    averageInvoiceAmount: number;
    collectionRate: number;
    paymentMethods: Record<string, number>;
    serviceCategories: Record<string, number>;
}
export interface EnhancedSummary extends Summary {
    agingAnalysis: AgingBucket;
    trends: TrendData[];
    clientMetrics: ClientMetrics[];
    taxAnalysis: TaxAnalysis;
    profitabilityMetrics: ProfitabilityMetrics;
    comparativeAnalysis: {
        previousPeriod: {
            revenue: number;
            invoices: number;
            collectionRate: number;
        };
        periodOverPeriod: {
            revenueChange: number;
            invoiceCountChange: number;
            collectionRateChange: number;
        };
    };
    topPerformingClients: Array<{
        clientId: string;
        clientName: string;
        revenue: number;
        invoiceCount: number;
        averageInvoiceAmount: number;
    }>;
    paymentEfficiency: {
        averageDaysToPay: number;
        onTimePaymentRate: number;
        latePaymentRate: number;
    };
}
