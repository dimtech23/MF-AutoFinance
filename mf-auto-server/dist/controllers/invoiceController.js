"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFinancialReportExcel = exports.exportFinancialReportPDF = exports.exportToExcel = exports.generatePDF = exports.processPayment = exports.markAsPaid = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoiceById = exports.getAllInvoices = void 0;
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Client_1 = __importDefault(require("../models/Client"));
const roles_1 = require("../constants/roles");
const mongoose_1 = __importDefault(require("mongoose"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const date_fns_1 = require("date-fns");
const exceljs_1 = __importDefault(require("exceljs"));
const invoice_1 = require("../types/invoice");
const validateInvoiceData = (invoice) => {
    var _a, _b;
    try {
        if (!invoice || typeof invoice !== 'object')
            return null;
        const validated = {
            _id: String(invoice._id || ''),
            invoiceNumber: String(invoice.invoiceNumber || ''),
            total: safeNumber(invoice.total),
            status: String(invoice.status || 'pending'),
            issueDate: new Date(invoice.issueDate || Date.now()),
            dueDate: new Date(invoice.dueDate || Date.now()),
            customerInfo: {
                name: String(((_a = invoice.customerInfo) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Customer'),
                id: ((_b = invoice.customerInfo) === null || _b === void 0 ? void 0 : _b.id) ? String(invoice.customerInfo.id) : undefined
            },
            items: Array.isArray(invoice.items) ? invoice.items.map((item) => ({
                type: String(item.type || 'service'),
                description: String(item.description || ''),
                quantity: safeNumber(item.quantity),
                unitPrice: safeNumber(item.unitPrice),
                laborHours: safeNumber(item.laborHours),
                laborRate: safeNumber(item.laborRate)
            })) : []
        };
        if (invoice.paymentMethod)
            validated.paymentMethod = String(invoice.paymentMethod);
        if (invoice.paymentDate)
            validated.paymentDate = new Date(invoice.paymentDate);
        return validated;
    }
    catch (error) {
        console.error('Error validating invoice data:', error);
        return null;
    }
};
const createBufferedPDF = (options) => {
    const doc = new pdfkit_1.default({
        ...options,
        bufferPages: true
    });
    return doc;
};
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice_1.default.find().sort({ createdAt: -1 });
        if (req.user.role === roles_1.UserRole.MECHANIC) {
            const limitedInvoices = invoices.map(invoice => ({
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                issueDate: invoice.issueDate,
                customerInfo: {
                    name: invoice.customerInfo.name
                },
                vehicleInfo: invoice.vehicleInfo,
                total: invoice.total
            }));
            return res.status(200).json(limitedInvoices);
        }
        return res.status(200).json(invoices);
    }
    catch (error) {
        console.error('Error fetching invoices:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllInvoices = getAllInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (req.user.role === roles_1.UserRole.MECHANIC) {
            const limitedInvoice = {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate,
                customerInfo: {
                    name: invoice.customerInfo.name
                },
                vehicleInfo: invoice.vehicleInfo,
                items: invoice.items.map(item => ({
                    type: item.type,
                    description: item.description,
                    quantity: item.quantity
                })),
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                notes: invoice.notes
            };
            return res.status(200).json(limitedInvoice);
        }
        return res.status(200).json(invoice);
    }
    catch (error) {
        console.error('Error fetching invoice:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoiceById = getInvoiceById;
const createInvoice = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to create invoices' });
        }
        const { invoiceNumber, status, issueDate, dueDate, customerInfo, vehicleInfo, items, taxRate, notes, terms, relatedClientId, mechanicNotes } = req.body;
        let subtotal = 0;
        let taxableAmount = 0;
        items.forEach((item) => {
            const itemTotal = item.type === 'service'
                ? (item.laborHours * item.laborRate) + (item.quantity * item.unitPrice)
                : (item.quantity * item.unitPrice);
            subtotal += itemTotal;
            if (item.taxable) {
                taxableAmount += itemTotal;
            }
        });
        const tax = taxableAmount * (taxRate / 100);
        const total = subtotal + tax;
        if (relatedClientId) {
            const client = await Client_1.default.findById(relatedClientId);
            if (!client) {
                return res.status(404).json({ message: 'Related client not found' });
            }
        }
        const newInvoice = new Invoice_1.default({
            invoiceNumber,
            status,
            issueDate: issueDate || new Date(),
            dueDate,
            customerInfo,
            vehicleInfo,
            items,
            subtotal,
            taxRate,
            tax,
            total,
            notes,
            terms,
            relatedClientId,
            mechanicNotes,
            createdBy: req.user._id
        });
        const savedInvoice = await newInvoice.save();
        return res.status(201).json(savedInvoice);
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createInvoice = createInvoice;
const updateInvoice = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to update invoices' });
        }
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const { invoiceNumber, status, issueDate, dueDate, customerInfo, vehicleInfo, items, taxRate, notes, terms, mechanicNotes } = req.body;
        let subtotal = invoice.subtotal;
        let tax = invoice.tax;
        let total = invoice.total;
        if (items || taxRate) {
            subtotal = 0;
            let taxableAmount = 0;
            const itemsToCalculate = items || invoice.items;
            const taxRateToUse = taxRate !== undefined ? taxRate : invoice.taxRate;
            itemsToCalculate.forEach((item) => {
                const itemTotal = item.type === 'service'
                    ? (item.laborHours * item.laborRate) + (item.quantity * item.unitPrice)
                    : (item.quantity * item.unitPrice);
                subtotal += itemTotal;
                if (item.taxable) {
                    taxableAmount += itemTotal;
                }
            });
            tax = taxableAmount * (taxRateToUse / 100);
            total = subtotal + tax;
        }
        const updateData = {
            subtotal,
            tax,
            total
        };
        if (invoiceNumber !== undefined)
            updateData.invoiceNumber = invoiceNumber;
        if (status !== undefined)
            updateData.status = status;
        if (issueDate !== undefined)
            updateData.issueDate = issueDate;
        if (dueDate !== undefined)
            updateData.dueDate = dueDate;
        if (customerInfo !== undefined)
            updateData.customerInfo = customerInfo;
        if (vehicleInfo !== undefined)
            updateData.vehicleInfo = vehicleInfo;
        if (items !== undefined)
            updateData.items = items;
        if (taxRate !== undefined)
            updateData.taxRate = taxRate;
        if (notes !== undefined)
            updateData.notes = notes;
        if (terms !== undefined)
            updateData.terms = terms;
        if (mechanicNotes !== undefined)
            updateData.mechanicNotes = mechanicNotes;
        const updatedInvoice = await Invoice_1.default.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
        return res.status(200).json(updatedInvoice);
    }
    catch (error) {
        console.error('Error updating invoice:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateInvoice = updateInvoice;
const deleteInvoice = async (req, res) => {
    try {
        if (req.user.role !== roles_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to delete invoices' });
        }
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await Invoice_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Invoice deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting invoice:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteInvoice = deleteInvoice;
const markAsPaid = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to mark invoices as paid' });
        }
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice is already marked as paid' });
        }
        const updatedInvoice = await Invoice_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                status: 'paid',
                paymentDate: new Date(),
                updatedBy: req.user._id
            }
        }, { new: true });
        return res.status(200).json(updatedInvoice);
    }
    catch (error) {
        console.error('Error marking invoice as paid:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.markAsPaid = markAsPaid;
const processPayment = async (req, res) => {
    try {
        if (![req.user.role === roles_1.UserRole.ADMIN, req.user.role === roles_1.UserRole.ACCOUNTANT].includes(true)) {
            return res.status(403).json({ message: 'Not authorized to process payments' });
        }
        const { amount, paymentMethod, paymentDate } = req.body;
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice is already paid' });
        }
        const updatedInvoice = await Invoice_1.default.findByIdAndUpdate(req.params.id, {
            $set: {
                status: amount >= invoice.total ? 'paid' : 'partial',
                paymentMethod,
                paymentDate: paymentDate || new Date(),
                partialPaymentAmount: amount,
                updatedBy: req.user._id
            }
        }, { new: true });
        return res.status(200).json(updatedInvoice);
    }
    catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.processPayment = processPayment;
const generatePDF = async (req, res) => {
    let doc = null;
    try {
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        doc = createBufferedPDF({
            size: 'A4',
            margin: 50
        });
        doc.pipe(res);
        await withPDFDocument(doc, (d) => {
            d.fontSize(20).text('MF Auto Finance', { align: 'center' });
            d.fontSize(12).text('Financial Report', { align: 'center' });
            d.moveDown();
        });
        await withPDFDocument(doc, (d) => {
            d.fontSize(10);
            d.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`);
            d.text(`Date Range: ${(0, date_fns_1.format)(startDate, 'MMM dd, yyyy')} to ${(0, date_fns_1.format)(endDate, 'MMM dd, yyyy')}`);
            d.text(`Generated: ${(0, date_fns_1.format)(new Date(), 'MMM dd, yyyy HH:mm:ss')}`);
            d.moveDown();
        });
        await withPDFDocument(doc, (d) => {
            d.fontSize(14).text('Financial Summary', { underline: true });
            d.moveDown();
            const summaryData = [
                ['Total Revenue', `D ${safeNumberFormat(summary.totalRevenue)}`],
                ['Collection Rate', `${safePercentageFormat(summary.collectionRate, summary.totalRevenue)}%`],
                ['Outstanding Amount', `D ${safeNumberFormat(summary.totalOutstanding)}`],
                ['Average Invoice', `D ${safeNumberFormat(summary.averageInvoiceAmount)}`],
                ['Total Invoices', summary.totalInvoices.toString()],
                ['Paid Invoices', summary.paidInvoices.toString()],
                ['Overdue Invoices', summary.overdueInvoices.toString()]
            ];
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            summaryData.forEach(([label, value]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(label, tableLeft, y);
                d.text(value, tableLeft + colWidth, y);
                y += 20;
            });
        });
        if (Object.keys(summary.paymentMethods).length > 0) {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Payment Methods Distribution', { underline: true });
                d.moveDown();
                const paymentMethodsData = Object.entries(summary.paymentMethods)
                    .map(([method, amount]) => [
                    method,
                    `D ${safeNumberFormat(amount)}`,
                    `${safePercentageFormat(amount, summary.totalRevenue)}%`
                ]);
                let y = d.y;
                const tableLeft = 50;
                const colWidth = 250;
                d.text('Method', tableLeft, y);
                d.text('Amount', tableLeft + colWidth, y);
                d.text('Percentage', tableLeft + colWidth * 2, y);
                y += 20;
                paymentMethodsData.forEach(([method, amount, percentage]) => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    d.text(method, tableLeft, y);
                    d.text(amount, tableLeft + colWidth, y);
                    d.text(percentage, tableLeft + colWidth * 2, y);
                    y += 20;
                });
            });
        }
        if (Object.keys(summary.serviceCategories).length > 0) {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Service Categories', { underline: true });
                d.moveDown();
                const serviceCategoriesData = Object.entries(summary.serviceCategories)
                    .sort(([, a], [, b]) => safeNumber(b) - safeNumber(a))
                    .map(([category, revenue]) => [
                    category,
                    `D ${safeNumberFormat(revenue)}`,
                    `${safePercentageFormat(revenue, summary.totalRevenue)}%`
                ]);
                let y = d.y;
                const tableLeft = 50;
                const colWidth = 250;
                d.text('Category', tableLeft, y);
                d.text('Revenue', tableLeft + colWidth, y);
                d.text('Percentage', tableLeft + colWidth * 2, y);
                y += 20;
                serviceCategoriesData.forEach(([category, revenue, percentage]) => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    d.text(category, tableLeft, y);
                    d.text(revenue, tableLeft + colWidth, y);
                    d.text(percentage, tableLeft + colWidth * 2, y);
                    y += 20;
                });
            });
        }
        if (reportType === 'all' || reportType === 'invoices') {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Invoice Details', { underline: true });
                d.moveDown();
                const headers = ['Invoice #', 'Date', 'Client', 'Amount', 'Status', 'Due Date'];
                const colWidths = [80, 80, 150, 80, 80, 80];
                let y = d.y;
                const tableLeft = 50;
                headers.forEach((header, i) => {
                    d.text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
                });
                y += 20;
                invoices.forEach(invoice => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    try {
                        d.text(invoice.invoiceNumber || 'N/A', tableLeft, y);
                        d.text((0, date_fns_1.format)(invoice.issueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0], y);
                        d.text(invoice.customerInfo.name || 'N/A', tableLeft + colWidths[0] + colWidths[1], y);
                        d.text(`D ${safeNumberFormat(invoice.total)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
                        d.text(invoice.status || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
                        d.text((0, date_fns_1.format)(invoice.dueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
                        y += 20;
                    }
                    catch (err) {
                        console.error('Error processing invoice row:', err);
                    }
                });
            });
        }
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Aging Analysis', { underline: true });
            d.moveDown();
            const agingData = [
                ['Current', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).current)}`],
                ['1-30 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days30)}`],
                ['31-60 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days60)}`],
                ['61-90 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days90)}`],
                ['Over 90 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).over90)}`]
            ];
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            agingData.forEach(([label, value]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(label, tableLeft, y);
                d.text(value, tableLeft + colWidth, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Revenue Trends', { underline: true });
            d.moveDown();
            const trendsData = calculateTrends(invoices, startDate, endDate);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            trendsData.forEach((trend) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(trend.period, tableLeft, y);
                d.text(`D ${safeNumberFormat(trend.revenue)}`, tableLeft + colWidth, y);
                d.text(trend.invoices.toString(), tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(trend.averageAmount)}`, tableLeft + colWidth * 3, y);
                d.text(`${safePercentageFormat(trend.collectionRate, trend.revenue)}%`, tableLeft + colWidth * 4, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Top Performing Clients', { underline: true });
            d.moveDown();
            const clientMetricsData = calculateClientMetrics(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            clientMetricsData.forEach((client) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(client.clientName, tableLeft, y);
                d.text(`D ${safeNumberFormat(client.totalSpent)}`, tableLeft + colWidth, y);
                d.text(client.invoiceCount.toString(), tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(client.averageInvoiceAmount)}`, tableLeft + colWidth * 3, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Tax Analysis', { underline: true });
            d.moveDown();
            const taxAnalysisData = calculateTaxAnalysis(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            Object.entries(taxAnalysisData.taxByCategory).forEach(([category, data]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(category, tableLeft, y);
                d.text(`D ${safeNumberFormat(data.taxableAmount)}`, tableLeft + colWidth, y);
                d.text(`D ${safeNumberFormat(data.taxAmount)}`, tableLeft + colWidth * 2, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Profitability Analysis', { underline: true });
            d.moveDown();
            const profitabilityData = calculateProfitabilityMetrics(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            Object.entries(profitabilityData.revenueByService).forEach(([service, data]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(service, tableLeft, y);
                d.text(`D ${safeNumberFormat(data.revenue)}`, tableLeft + colWidth, y);
                d.text(`D ${safeNumberFormat(data.cost)}`, tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(data.profit)}`, tableLeft + colWidth * 3, y);
                d.text(`${safePercentageFormat(data.margin, data.revenue)}%`, tableLeft + colWidth * 4, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Period Over Period Analysis', { underline: true });
            d.moveDown();
            const comparativeAnalysisData = calculateComparativeAnalysis(invoices, []);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            d.text('Previous Period', tableLeft, y);
            d.text('Current Period', tableLeft + colWidth, y);
            d.text('Period Over Period', tableLeft + colWidth * 2, y);
            y += 20;
            d.text(`Revenue: ${safeNumberFormat(comparativeAnalysisData.previousPeriod.revenue)}`, tableLeft, y);
            d.text(`Revenue: ${safeNumberFormat(comparativeAnalysisData.periodOverPeriod.revenueChange)}%`, tableLeft + colWidth, y);
            y += 20;
            d.text(`Invoice Count: ${comparativeAnalysisData.previousPeriod.invoices}`, tableLeft, y);
            d.text(`Invoice Count: ${comparativeAnalysisData.periodOverPeriod.invoiceCountChange}%`, tableLeft + colWidth, y);
            y += 20;
            d.text(`Collection Rate: ${safePercentageFormat(comparativeAnalysisData.previousPeriod.collectionRate)}%`, tableLeft, y);
            d.text(`Collection Rate: ${safePercentageFormat(comparativeAnalysisData.periodOverPeriod.collectionRateChange)}%`, tableLeft + colWidth, y);
            y += 20;
        });
        if (doc) {
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(`Page ${i + 1} of ${pages.count}`, 297.64, 811.89, { align: 'center' });
            }
        }
        if (doc) {
            doc.end();
            doc = null;
        }
        return;
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        if (doc) {
            try {
                doc.end();
                doc = null;
            }
            catch (e) {
                console.error('Error ending PDF document:', e);
            }
        }
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.generatePDF = generatePDF;
const exportToExcel = async (req, res) => {
    try {
        const { startDate, endDate, status, type } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.issueDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        const invoices = await Invoice_1.default.find(query).sort({ issueDate: -1 });
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Invoices');
        worksheet.columns = [
            { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Due Date', key: 'dueDate', width: 15 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Vehicle', key: 'vehicle', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Subtotal', key: 'subtotal', width: 15 },
            { header: 'Tax', key: 'tax', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Payment Date', key: 'paymentDate', width: 15 }
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        invoices.forEach(invoice => {
            worksheet.addRow({
                invoiceNumber: invoice.invoiceNumber,
                date: (0, date_fns_1.format)(new Date(invoice.issueDate), 'yyyy-MM-dd'),
                dueDate: (0, date_fns_1.format)(new Date(invoice.dueDate), 'yyyy-MM-dd'),
                customer: invoice.customerInfo.name,
                vehicle: `${invoice.vehicleInfo.year} ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`,
                status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
                subtotal: invoice.subtotal.toFixed(2),
                tax: invoice.tax.toFixed(2),
                total: invoice.total.toFixed(2),
                paymentMethod: invoice.paymentMethod || 'N/A',
                paymentDate: invoice.paymentDate ? (0, date_fns_1.format)(new Date(invoice.paymentDate), 'yyyy-MM-dd') : 'N/A'
            });
        });
        const lastRow = worksheet.rowCount;
        worksheet.addRow({
            invoiceNumber: 'TOTAL',
            total: invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)
        });
        worksheet.getRow(lastRow + 1).font = { bold: true };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=invoices-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.exportToExcel = exportToExcel;
const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
};
const safePercentage = (value, total) => {
    if (!total || isNaN(total) || total === 0)
        return 0;
    const percentage = (value / total) * 100;
    return isNaN(percentage) ? 0 : percentage;
};
const safeNumberFormat = (value, defaultValue = 0) => {
    const num = safeNumber(value, defaultValue);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};
const safePercentageFormat = (value, total = 100) => {
    if (value === null || value === undefined || total === null || total === undefined) {
        return '0%';
    }
    return `${((value / total) * 100).toFixed(1)}%`;
};
const withPDFDocument = async (doc, operation) => {
    if (!doc) {
        throw new Error('PDF document is not initialized');
    }
    operation(doc);
};
const calculateAgingAnalysis = (invoices) => {
    const now = new Date();
    const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        over90: 0
    };
    invoices.forEach(invoice => {
        if (invoice.status === 'paid')
            return;
        const daysOverdue = (0, date_fns_1.differenceInDays)(now, invoice.dueDate);
        const amount = invoice.total;
        if (daysOverdue <= 0) {
            aging.current += amount;
        }
        else if (daysOverdue <= 30) {
            aging.days30 += amount;
        }
        else if (daysOverdue <= 60) {
            aging.days60 += amount;
        }
        else if (daysOverdue <= 90) {
            aging.days90 += amount;
        }
        else {
            aging.over90 += amount;
        }
    });
    return aging;
};
const calculateTrends = (invoices, startDate, endDate) => {
    const months = (0, date_fns_1.eachMonthOfInterval)({ start: startDate, end: endDate });
    const trends = [];
    months.forEach(month => {
        const monthStart = (0, date_fns_1.startOfMonth)(month);
        const monthEnd = (0, date_fns_1.endOfMonth)(month);
        const monthInvoices = invoices.filter(inv => inv.issueDate >= monthStart && inv.issueDate <= monthEnd);
        const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
        const collectionRate = (paidInvoices.reduce((sum, inv) => sum + inv.total, 0) / revenue) * 100;
        trends.push({
            period: (0, date_fns_1.format)(month, 'MMM yyyy'),
            revenue,
            invoices: monthInvoices.length,
            averageAmount: revenue / (monthInvoices.length || 1),
            collectionRate
        });
    });
    return trends;
};
const calculateClientMetrics = (invoices) => {
    const clientMap = new Map();
    invoices.forEach(invoice => {
        const clientId = invoice.customerInfo.id || 'unknown';
        const clientName = invoice.customerInfo.name;
        const existing = clientMap.get(clientId);
        if (existing) {
            existing.totalSpent += invoice.total;
            existing.invoiceCount++;
            existing.averageInvoiceAmount = existing.totalSpent / existing.invoiceCount;
            existing.lastInvoiceDate = new Date(Math.max(existing.lastInvoiceDate.getTime(), invoice.issueDate.getTime()));
            if (invoice.status === 'paid') {
                const daysToPay = (0, date_fns_1.differenceInDays)(new Date(invoice.paymentDate || invoice.issueDate), invoice.issueDate);
                existing.paymentHistory.averageDaysToPay =
                    (existing.paymentHistory.averageDaysToPay * existing.paymentHistory.onTime + daysToPay) /
                        (existing.paymentHistory.onTime + 1);
                if (daysToPay <= 30) {
                    existing.paymentHistory.onTime++;
                }
                else {
                    existing.paymentHistory.late++;
                }
            }
        }
        else {
            clientMap.set(clientId, {
                clientId,
                clientName,
                totalSpent: invoice.total,
                invoiceCount: 1,
                averageInvoiceAmount: invoice.total,
                lastInvoiceDate: invoice.issueDate,
                paymentHistory: {
                    onTime: invoice.status === 'paid' &&
                        (0, date_fns_1.differenceInDays)(new Date(invoice.paymentDate || invoice.issueDate), invoice.issueDate) <= 30 ? 1 : 0,
                    late: invoice.status === 'paid' &&
                        (0, date_fns_1.differenceInDays)(new Date(invoice.paymentDate || invoice.issueDate), invoice.issueDate) > 30 ? 1 : 0,
                    averageDaysToPay: invoice.status === 'paid' ?
                        (0, date_fns_1.differenceInDays)(new Date(invoice.paymentDate || invoice.issueDate), invoice.issueDate) : 0
                }
            });
        }
    });
    return Array.from(clientMap.values());
};
const calculateTaxAnalysis = (invoices) => {
    const taxAnalysis = {
        totalTaxableAmount: 0,
        totalTaxAmount: 0,
        taxByCategory: {},
        taxByPeriod: {}
    };
    invoices.forEach(invoice => {
        const taxableAmount = invoice.items.reduce((sum, item) => sum + (item.taxable ? item.quantity * item.unitPrice : 0), 0);
        const taxAmount = taxableAmount * 0.075;
        taxAnalysis.totalTaxableAmount += taxableAmount;
        taxAnalysis.totalTaxAmount += taxAmount;
        invoice.items.forEach(item => {
            if (item.taxable) {
                const category = item.description.split(' ')[0] || 'Other';
                if (!taxAnalysis.taxByCategory[category]) {
                    taxAnalysis.taxByCategory[category] = {
                        taxableAmount: 0,
                        taxAmount: 0
                    };
                }
                taxAnalysis.taxByCategory[category].taxableAmount += item.quantity * item.unitPrice;
                taxAnalysis.taxByCategory[category].taxAmount += item.quantity * item.unitPrice * 0.075;
            }
        });
        const period = (0, date_fns_1.format)(invoice.issueDate, 'MMM yyyy');
        if (!taxAnalysis.taxByPeriod[period]) {
            taxAnalysis.taxByPeriod[period] = {
                taxableAmount: 0,
                taxAmount: 0
            };
        }
        taxAnalysis.taxByPeriod[period].taxableAmount += taxableAmount;
        taxAnalysis.taxByPeriod[period].taxAmount += taxAmount;
    });
    return taxAnalysis;
};
const calculateProfitabilityMetrics = (invoices) => {
    const metrics = {
        revenueByService: {},
        overallProfit: 0,
        overallMargin: 0,
        topProfitableServices: []
    };
    let totalRevenue = 0;
    let totalCost = 0;
    invoices.forEach(invoice => {
        invoice.items.forEach(item => {
            const service = item.description.split(' ')[0] || 'Other';
            const revenue = item.quantity * item.unitPrice;
            const cost = item.type === 'part' ?
                revenue * 0.6 :
                (item.laborHours || 0) * (item.laborRate || 0) * 0.4;
            if (!metrics.revenueByService[service]) {
                metrics.revenueByService[service] = {
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    margin: 0
                };
            }
            metrics.revenueByService[service].revenue += revenue;
            metrics.revenueByService[service].cost += cost;
            metrics.revenueByService[service].profit =
                metrics.revenueByService[service].revenue - metrics.revenueByService[service].cost;
            metrics.revenueByService[service].margin =
                (metrics.revenueByService[service].profit / metrics.revenueByService[service].revenue) * 100;
            totalRevenue += revenue;
            totalCost += cost;
        });
    });
    metrics.overallProfit = totalRevenue - totalCost;
    metrics.overallMargin = (metrics.overallProfit / totalRevenue) * 100;
    metrics.topProfitableServices = Object.entries(metrics.revenueByService)
        .map(([service, data]) => ({
        service,
        profit: data.profit,
        margin: data.margin
    }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10);
    return metrics;
};
const calculateComparativeAnalysis = (currentInvoices, previousInvoices) => {
    const currentPeriod = {
        revenue: currentInvoices.reduce((sum, inv) => sum + inv.total, 0),
        invoices: currentInvoices.length,
        collectionRate: (currentInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0) /
            currentInvoices.reduce((sum, inv) => sum + inv.total, 0)) * 100
    };
    const previousPeriod = {
        revenue: previousInvoices.reduce((sum, inv) => sum + inv.total, 0),
        invoices: previousInvoices.length,
        collectionRate: (previousInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0) /
            previousInvoices.reduce((sum, inv) => sum + inv.total, 0)) * 100
    };
    return {
        previousPeriod,
        periodOverPeriod: {
            revenueChange: ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100,
            invoiceCountChange: ((currentPeriod.invoices - previousPeriod.invoices) / previousPeriod.invoices) * 100,
            collectionRateChange: currentPeriod.collectionRate - previousPeriod.collectionRate
        }
    };
};
const exportFinancialReportPDF = async (req, res) => {
    let doc = null;
    try {
        const { dateRange, customDateRange, reportType, filters } = req.body;
        if (!dateRange || !reportType) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }
        const now = new Date();
        let startDate, endDate;
        if (dateRange === 'custom' && (customDateRange === null || customDateRange === void 0 ? void 0 : customDateRange[0]) && (customDateRange === null || customDateRange === void 0 ? void 0 : customDateRange[1])) {
            startDate = (0, date_fns_1.startOfDay)(new Date(customDateRange[0]));
            endDate = (0, date_fns_1.endOfDay)(new Date(customDateRange[1]));
        }
        else {
            endDate = (0, date_fns_1.endOfDay)(now);
            startDate = (0, date_fns_1.startOfDay)(dateRange === 'week' ? (0, date_fns_1.subDays)(now, 7) :
                dateRange === 'month' ? (0, date_fns_1.subMonths)(now, 1) :
                    dateRange === 'quarter' ? (0, date_fns_1.subMonths)(now, 3) :
                        dateRange === 'year' ? (0, date_fns_1.subYears)(now, 1) :
                            (0, date_fns_1.subMonths)(now, 1));
        }
        const query = {
            issueDate: {
                $gte: startDate,
                $lte: endDate
            }
        };
        if ((filters === null || filters === void 0 ? void 0 : filters.status) && filters.status !== 'all') {
            query.status = filters.status;
        }
        const rawInvoices = await Invoice_1.default.find(query)
            .populate('customerInfo.id', 'clientName')
            .sort({ issueDate: -1 })
            .lean();
        if (!rawInvoices || rawInvoices.length === 0) {
            if (!res.headersSent) {
                return res.status(404).json({ message: 'No invoices found for the selected period' });
            }
            return;
        }
        const invoices = rawInvoices
            .map(validateInvoiceData)
            .filter(invoice_1.isInvoiceData);
        if (invoices.length === 0) {
            if (!res.headersSent) {
                return res.status(400).json({ message: 'No valid invoice data found' });
            }
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="financial_report_${reportType}_${(0, date_fns_1.format)(startDate, 'yyyy-MM-dd')}_to_${(0, date_fns_1.format)(endDate, 'yyyy-MM-dd')}.pdf"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        doc = createBufferedPDF({
            size: 'A4',
            margin: 50
        });
        doc.pipe(res);
        const summary = {
            totalRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            totalInvoices: invoices.length,
            paidInvoices: 0,
            overdueInvoices: 0,
            averageInvoiceAmount: 0,
            collectionRate: 0,
            paymentMethods: {},
            serviceCategories: {}
        };
        invoices.forEach(invoice => {
            const total = safeNumber(invoice.total);
            summary.totalRevenue += total;
            if (invoice.status === 'paid') {
                summary.totalPaid += total;
                summary.paidInvoices++;
            }
            else {
                summary.totalOutstanding += total;
                if (invoice.dueDate < new Date()) {
                    summary.overdueInvoices++;
                }
            }
            if (invoice.paymentMethod) {
                const method = invoice.paymentMethod;
                summary.paymentMethods[method] = safeNumber(summary.paymentMethods[method] || 0) + total;
            }
            invoice.items.forEach((item) => {
                if (item.type === 'service') {
                    const category = item.description.split(' ')[0] || 'Other';
                    let itemTotal = safeNumber(item.quantity) * safeNumber(item.unitPrice);
                    if (item.laborHours && item.laborRate) {
                        itemTotal += safeNumber(item.laborHours) * safeNumber(item.laborRate);
                    }
                    summary.serviceCategories[category] = safeNumber(summary.serviceCategories[category] || 0) + itemTotal;
                }
            });
        });
        summary.averageInvoiceAmount = safeNumber(summary.totalRevenue / (summary.totalInvoices || 1));
        summary.collectionRate = safePercentage(summary.totalPaid, summary.totalRevenue);
        await withPDFDocument(doc, (d) => {
            d.fontSize(20).text('MF Auto Finance', { align: 'center' });
            d.fontSize(12).text('Financial Report', { align: 'center' });
            d.moveDown();
        });
        await withPDFDocument(doc, (d) => {
            d.fontSize(10);
            d.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`);
            d.text(`Date Range: ${(0, date_fns_1.format)(startDate, 'MMM dd, yyyy')} to ${(0, date_fns_1.format)(endDate, 'MMM dd, yyyy')}`);
            d.text(`Generated: ${(0, date_fns_1.format)(new Date(), 'MMM dd, yyyy HH:mm:ss')}`);
            d.moveDown();
        });
        await withPDFDocument(doc, (d) => {
            d.fontSize(14).text('Financial Summary', { underline: true });
            d.moveDown();
            const summaryData = [
                ['Total Revenue', `D ${safeNumberFormat(summary.totalRevenue)}`],
                ['Collection Rate', `${safePercentageFormat(summary.collectionRate, summary.totalRevenue)}%`],
                ['Outstanding Amount', `D ${safeNumberFormat(summary.totalOutstanding)}`],
                ['Average Invoice', `D ${safeNumberFormat(summary.averageInvoiceAmount)}`],
                ['Total Invoices', summary.totalInvoices.toString()],
                ['Paid Invoices', summary.paidInvoices.toString()],
                ['Overdue Invoices', summary.overdueInvoices.toString()]
            ];
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            summaryData.forEach(([label, value]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(label, tableLeft, y);
                d.text(value, tableLeft + colWidth, y);
                y += 20;
            });
        });
        if (Object.keys(summary.paymentMethods).length > 0) {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Payment Methods Distribution', { underline: true });
                d.moveDown();
                const paymentMethodsData = Object.entries(summary.paymentMethods)
                    .map(([method, amount]) => [
                    method,
                    `D ${safeNumberFormat(amount)}`,
                    `${safePercentageFormat(amount, summary.totalRevenue)}%`
                ]);
                let y = d.y;
                const tableLeft = 50;
                const colWidth = 250;
                d.text('Method', tableLeft, y);
                d.text('Amount', tableLeft + colWidth, y);
                d.text('Percentage', tableLeft + colWidth * 2, y);
                y += 20;
                paymentMethodsData.forEach(([method, amount, percentage]) => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    d.text(method, tableLeft, y);
                    d.text(amount, tableLeft + colWidth, y);
                    d.text(percentage, tableLeft + colWidth * 2, y);
                    y += 20;
                });
            });
        }
        if (Object.keys(summary.serviceCategories).length > 0) {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Service Categories', { underline: true });
                d.moveDown();
                const serviceCategoriesData = Object.entries(summary.serviceCategories)
                    .sort(([, a], [, b]) => safeNumber(b) - safeNumber(a))
                    .map(([category, revenue]) => [
                    category,
                    `D ${safeNumberFormat(revenue)}`,
                    `${safePercentageFormat(revenue, summary.totalRevenue)}%`
                ]);
                let y = d.y;
                const tableLeft = 50;
                const colWidth = 250;
                d.text('Category', tableLeft, y);
                d.text('Revenue', tableLeft + colWidth, y);
                d.text('Percentage', tableLeft + colWidth * 2, y);
                y += 20;
                serviceCategoriesData.forEach(([category, revenue, percentage]) => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    d.text(category, tableLeft, y);
                    d.text(revenue, tableLeft + colWidth, y);
                    d.text(percentage, tableLeft + colWidth * 2, y);
                    y += 20;
                });
            });
        }
        if (reportType === 'all' || reportType === 'invoices') {
            await withPDFDocument(doc, (d) => {
                d.addPage();
                d.fontSize(14).text('Invoice Details', { underline: true });
                d.moveDown();
                const headers = ['Invoice #', 'Date', 'Client', 'Amount', 'Status', 'Due Date'];
                const colWidths = [80, 80, 150, 80, 80, 80];
                let y = d.y;
                const tableLeft = 50;
                headers.forEach((header, i) => {
                    d.text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
                });
                y += 20;
                invoices.forEach(invoice => {
                    if (y > 750) {
                        d.addPage();
                        y = 50;
                    }
                    try {
                        d.text(invoice.invoiceNumber || 'N/A', tableLeft, y);
                        d.text((0, date_fns_1.format)(invoice.issueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0], y);
                        d.text(invoice.customerInfo.name || 'N/A', tableLeft + colWidths[0] + colWidths[1], y);
                        d.text(`D ${safeNumberFormat(invoice.total)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
                        d.text(invoice.status || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
                        d.text((0, date_fns_1.format)(invoice.dueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
                        y += 20;
                    }
                    catch (err) {
                        console.error('Error processing invoice row:', err);
                    }
                });
            });
        }
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Aging Analysis', { underline: true });
            d.moveDown();
            const agingData = [
                ['Current', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).current)}`],
                ['1-30 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days30)}`],
                ['31-60 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days60)}`],
                ['61-90 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).days90)}`],
                ['Over 90 Days', `D ${safeNumberFormat(calculateAgingAnalysis(invoices).over90)}`]
            ];
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            agingData.forEach(([label, value]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(label, tableLeft, y);
                d.text(value, tableLeft + colWidth, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Revenue Trends', { underline: true });
            d.moveDown();
            const trendsData = calculateTrends(invoices, startDate, endDate);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            trendsData.forEach((trend) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(trend.period, tableLeft, y);
                d.text(`D ${safeNumberFormat(trend.revenue)}`, tableLeft + colWidth, y);
                d.text(trend.invoices.toString(), tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(trend.averageAmount)}`, tableLeft + colWidth * 3, y);
                d.text(`${safePercentageFormat(trend.collectionRate, trend.revenue)}%`, tableLeft + colWidth * 4, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Top Performing Clients', { underline: true });
            d.moveDown();
            const clientMetricsData = calculateClientMetrics(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            clientMetricsData.forEach((client) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(client.clientName, tableLeft, y);
                d.text(`D ${safeNumberFormat(client.totalSpent)}`, tableLeft + colWidth, y);
                d.text(client.invoiceCount.toString(), tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(client.averageInvoiceAmount)}`, tableLeft + colWidth * 3, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Tax Analysis', { underline: true });
            d.moveDown();
            const taxAnalysisData = calculateTaxAnalysis(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            Object.entries(taxAnalysisData.taxByCategory).forEach(([category, data]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(category, tableLeft, y);
                d.text(`D ${safeNumberFormat(data.taxableAmount)}`, tableLeft + colWidth, y);
                d.text(`D ${safeNumberFormat(data.taxAmount)}`, tableLeft + colWidth * 2, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Profitability Analysis', { underline: true });
            d.moveDown();
            const profitabilityData = calculateProfitabilityMetrics(invoices);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            Object.entries(profitabilityData.revenueByService).forEach(([service, data]) => {
                if (y > 750) {
                    d.addPage();
                    y = 50;
                }
                d.text(service, tableLeft, y);
                d.text(`D ${safeNumberFormat(data.revenue)}`, tableLeft + colWidth, y);
                d.text(`D ${safeNumberFormat(data.cost)}`, tableLeft + colWidth * 2, y);
                d.text(`D ${safeNumberFormat(data.profit)}`, tableLeft + colWidth * 3, y);
                d.text(`${safePercentageFormat(data.margin, data.revenue)}%`, tableLeft + colWidth * 4, y);
                y += 20;
            });
        });
        await withPDFDocument(doc, (d) => {
            d.addPage();
            d.fontSize(14).text('Period Over Period Analysis', { underline: true });
            d.moveDown();
            const comparativeAnalysisData = calculateComparativeAnalysis(invoices, []);
            let y = d.y;
            const tableLeft = 50;
            const colWidth = 250;
            d.text('Previous Period', tableLeft, y);
            d.text('Current Period', tableLeft + colWidth, y);
            d.text('Period Over Period', tableLeft + colWidth * 2, y);
            y += 20;
            d.text(`Revenue: ${safeNumberFormat(comparativeAnalysisData.previousPeriod.revenue)}`, tableLeft, y);
            d.text(`Revenue: ${safeNumberFormat(comparativeAnalysisData.periodOverPeriod.revenueChange)}%`, tableLeft + colWidth, y);
            y += 20;
            d.text(`Invoice Count: ${comparativeAnalysisData.previousPeriod.invoices}`, tableLeft, y);
            d.text(`Invoice Count: ${comparativeAnalysisData.periodOverPeriod.invoiceCountChange}%`, tableLeft + colWidth, y);
            y += 20;
            d.text(`Collection Rate: ${safePercentageFormat(comparativeAnalysisData.previousPeriod.collectionRate)}%`, tableLeft, y);
            d.text(`Collection Rate: ${safePercentageFormat(comparativeAnalysisData.periodOverPeriod.collectionRateChange)}%`, tableLeft + colWidth, y);
            y += 20;
        });
        if (doc) {
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(`Page ${i + 1} of ${pages.count}`, 297.64, 811.89, { align: 'center' });
            }
        }
        if (doc) {
            doc.end();
            doc = null;
        }
        return;
    }
    catch (error) {
        console.error('Error generating financial report PDF:', error);
        if (doc) {
            try {
                doc.end();
                doc = null;
            }
            catch (e) {
                console.error('Error ending PDF document:', e);
            }
        }
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.exportFinancialReportPDF = exportFinancialReportPDF;
const exportFinancialReportExcel = async (req, res) => {
    try {
        const { dateRange, customDateRange, reportType, filters } = req.body;
        const now = new Date();
        let startDate, endDate;
        if (dateRange === 'custom' && customDateRange[0] && customDateRange[1]) {
            startDate = (0, date_fns_1.startOfDay)(new Date(customDateRange[0]));
            endDate = (0, date_fns_1.endOfDay)(new Date(customDateRange[1]));
        }
        else {
            endDate = (0, date_fns_1.endOfDay)(now);
            startDate = (0, date_fns_1.startOfDay)(dateRange === 'week' ? (0, date_fns_1.subDays)(now, 7) :
                dateRange === 'month' ? (0, date_fns_1.subMonths)(now, 1) :
                    dateRange === 'quarter' ? (0, date_fns_1.subMonths)(now, 3) :
                        dateRange === 'year' ? (0, date_fns_1.subYears)(now, 1) :
                            (0, date_fns_1.subMonths)(now, 1));
        }
        const query = {
            issueDate: {
                $gte: startDate,
                $lte: endDate
            }
        };
        if ((filters === null || filters === void 0 ? void 0 : filters.status) && filters.status !== 'all') {
            query.status = filters.status;
        }
        const invoices = await Invoice_1.default.find(query)
            .populate('customerInfo.id', 'clientName')
            .sort({ issueDate: -1 });
        const workbook = new exceljs_1.default.Workbook();
        const summarySheet = workbook.addWorksheet('Summary');
        const summary = {
            totalRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            totalInvoices: invoices.length,
            paidInvoices: 0,
            overdueInvoices: 0,
            averageInvoiceAmount: 0,
            collectionRate: 0,
            paymentMethods: {},
            serviceCategories: {}
        };
        invoices.forEach(invoice => {
            summary.totalRevenue += invoice.total;
            if (invoice.status === 'paid') {
                summary.totalPaid += invoice.total;
                summary.paidInvoices++;
            }
            else {
                summary.totalOutstanding += invoice.total;
                if (new Date(invoice.dueDate) < new Date()) {
                    summary.overdueInvoices++;
                }
            }
            if (invoice.paymentMethod) {
                const method = invoice.paymentMethod;
                summary.paymentMethods[method] =
                    (summary.paymentMethods[method] || 0) + invoice.total;
            }
            invoice.items.forEach(item => {
                if (item.type === 'service') {
                    const category = item.description.split(' ')[0];
                    summary.serviceCategories[category] =
                        (summary.serviceCategories[category] || 0) + (item.quantity * item.unitPrice);
                }
            });
        });
        summary.averageInvoiceAmount = summary.totalRevenue / (summary.totalInvoices || 1);
        summary.collectionRate = (summary.totalPaid / summary.totalRevenue) * 100;
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 20 }
        ];
        const summaryData = [
            { metric: 'Total Revenue', value: `D ${summary.totalRevenue.toFixed(2)}` },
            { metric: 'Collection Rate', value: `${summary.collectionRate.toFixed(1)}%` },
            { metric: 'Outstanding Amount', value: `D ${summary.totalOutstanding.toFixed(2)}` },
            { metric: 'Average Invoice', value: `D ${summary.averageInvoiceAmount.toFixed(2)}` },
            { metric: 'Total Invoices', value: summary.totalInvoices },
            { metric: 'Paid Invoices', value: summary.paidInvoices },
            { metric: 'Overdue Invoices', value: summary.overdueInvoices }
        ];
        summarySheet.addRows(summaryData);
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        const paymentMethodsSheet = workbook.addWorksheet('Payment Methods');
        paymentMethodsSheet.columns = [
            { header: 'Method', key: 'method', width: 20 },
            { header: 'Amount', key: 'amount', width: 20 },
            { header: 'Percentage', key: 'percentage', width: 20 }
        ];
        const paymentMethodsData = Object.entries(summary.paymentMethods).map(([method, amount]) => ({
            method,
            amount: `D ${amount.toFixed(2)}`,
            percentage: `${((amount / summary.totalRevenue) * 100).toFixed(1)}%`
        }));
        paymentMethodsSheet.addRows(paymentMethodsData);
        paymentMethodsSheet.getRow(1).font = { bold: true };
        paymentMethodsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        const serviceCategoriesSheet = workbook.addWorksheet('Service Categories');
        serviceCategoriesSheet.columns = [
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Revenue', key: 'revenue', width: 20 },
            { header: 'Percentage', key: 'percentage', width: 20 }
        ];
        const serviceCategoriesData = Object.entries(summary.serviceCategories)
            .sort(([, a], [, b]) => b - a)
            .map(([category, revenue]) => ({
            category,
            revenue: `D ${revenue.toFixed(2)}`,
            percentage: `${((revenue / summary.totalRevenue) * 100).toFixed(1)}%`
        }));
        serviceCategoriesSheet.addRows(serviceCategoriesData);
        serviceCategoriesSheet.getRow(1).font = { bold: true };
        serviceCategoriesSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        if (reportType === 'all' || reportType === 'invoices') {
            const invoiceSheet = workbook.addWorksheet('Invoices');
            invoiceSheet.columns = [
                { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Client', key: 'client', width: 30 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Due Date', key: 'dueDate', width: 15 },
                { header: 'Payment Method', key: 'paymentMethod', width: 15 },
                { header: 'Payment Date', key: 'paymentDate', width: 15 }
            ];
            const invoiceData = invoices.map(invoice => ({
                invoiceNumber: invoice.invoiceNumber,
                date: (0, date_fns_1.format)(new Date(invoice.issueDate), 'yyyy-MM-dd'),
                client: invoice.customerInfo.name,
                amount: invoice.total.toFixed(2),
                status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
                dueDate: (0, date_fns_1.format)(new Date(invoice.dueDate), 'yyyy-MM-dd'),
                paymentMethod: invoice.paymentMethod || 'N/A',
                paymentDate: invoice.paymentDate ? (0, date_fns_1.format)(new Date(invoice.paymentDate), 'yyyy-MM-dd') : 'N/A'
            }));
            invoiceSheet.addRows(invoiceData);
            invoiceSheet.getRow(1).font = { bold: true };
            invoiceSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            const lastRow = invoiceSheet.rowCount;
            invoiceSheet.addRow({
                invoiceNumber: 'TOTAL',
                amount: invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)
            });
            invoiceSheet.getRow(lastRow + 1).font = { bold: true };
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial_report_${reportType}_${(0, date_fns_1.format)(startDate, 'yyyy-MM-dd')}_to_${(0, date_fns_1.format)(endDate, 'yyyy-MM-dd')}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('Error generating financial report Excel:', error);
        res.status(500).json({
            message: 'Failed to generate financial report Excel',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        });
    }
};
exports.exportFinancialReportExcel = exportFinancialReportExcel;
//# sourceMappingURL=invoiceController.js.map