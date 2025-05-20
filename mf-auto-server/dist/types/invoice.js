"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInvoiceData = void 0;
const isInvoiceData = (data) => {
    return (data &&
        typeof data === 'object' &&
        typeof data._id === 'string' &&
        typeof data.invoiceNumber === 'string' &&
        typeof data.total === 'number' &&
        typeof data.status === 'string' &&
        data.issueDate instanceof Date &&
        data.dueDate instanceof Date &&
        typeof data.customerInfo === 'object' &&
        typeof data.customerInfo.name === 'string' &&
        Array.isArray(data.items) &&
        data.items.every((item) => typeof item === 'object' &&
            typeof item.type === 'string' &&
            typeof item.description === 'string' &&
            typeof item.quantity === 'number' &&
            typeof item.unitPrice === 'number'));
};
exports.isInvoiceData = isInvoiceData;
//# sourceMappingURL=invoice.js.map