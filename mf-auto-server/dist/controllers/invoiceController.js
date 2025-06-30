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
const axios_1 = __importDefault(require("axios"));
const createBufferedPDF = (options) => {
    const doc = new pdfkit_1.default({
        ...options,
        bufferPages: true
    });
    return doc;
};
const getCompanyLogo = async () => {
    try {
        const response = await (0, axios_1.default)({
            method: 'GET',
            url: 'https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg',
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    }
    catch (error) {
        console.error('Error downloading company logo:', error);
        return null;
    }
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
    var _a, _b;
    try {
        const { amount, paymentMethod, paymentDate, paymentReference } = req.body;
        const invoice = await Invoice_1.default.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid payment amount' });
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
        try {
            const PaymentHistory = mongoose_1.default.model('PaymentHistory');
            const paymentRecord = new PaymentHistory({
                clientId: invoice.relatedClientId || ((_a = invoice.customerInfo) === null || _a === void 0 ? void 0 : _a.id),
                invoiceId: invoice._id,
                amount: amount,
                paymentMethod: paymentMethod || 'cash',
                paymentDate: paymentDate || new Date(),
                paymentReference: paymentReference || `Payment for Invoice #${invoice.invoiceNumber}`,
                status: 'completed',
                recordedBy: req.user._id,
                description: `Payment for Invoice #${invoice.invoiceNumber} - ${((_b = invoice.customerInfo) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown Customer'}`
            });
            await paymentRecord.save();
        }
        catch (error) {
            console.error('Error creating payment history:', error);
        }
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
        doc = createBufferedPDF({
            size: 'A4',
            margin: 40,
            bufferPages: true
        });
        if (!doc) {
            throw new Error('Failed to create PDF document');
        }
        const pdfDoc = doc;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        pdfDoc.pipe(res);
        try {
            const logoBuffer = await getCompanyLogo();
            if (logoBuffer) {
                pdfDoc.image(logoBuffer, 40, 40, {
                    width: 120,
                    height: 120,
                    fit: [120, 120]
                });
            }
        }
        catch (error) {
            console.error('Error adding company logo:', error);
        }
        pdfDoc.fontSize(24)
            .text('MF Auto Finance', 180, 60)
            .fontSize(12)
            .text('Professional Auto Repair & Maintenance', 180, 90)
            .fontSize(10)
            .text('123 Main Street, City, Country', 180, 110)
            .text('Phone: (123) 456-7890 | Email: info@mfautofinance.com', 180, 125);
        pdfDoc.moveTo(40, 170)
            .lineTo(pdfDoc.page.width - 40, 170)
            .stroke();
        pdfDoc.fontSize(20)
            .text('INVOICE', { align: 'center' })
            .moveDown(0.5);
        const leftColumn = 40;
        const rightColumn = pdfDoc.page.width / 2 + 20;
        const columnWidth = (pdfDoc.page.width - 80) / 2;
        pdfDoc.fontSize(12)
            .text('Invoice Details:', leftColumn, 210)
            .fontSize(10)
            .text(`Invoice Number: ${invoice.invoiceNumber}`, leftColumn, 230)
            .text(`Date: ${(0, date_fns_1.format)(new Date(invoice.issueDate), 'PPP')}`, leftColumn, 245)
            .text(`Due Date: ${(0, date_fns_1.format)(new Date(invoice.dueDate), 'PPP')}`, leftColumn, 260)
            .text(`Status: ${invoice.status.toUpperCase()}`, leftColumn, 275);
        pdfDoc.fontSize(12)
            .text('Bill To:', rightColumn, 210)
            .fontSize(10)
            .text(invoice.customerInfo.name, rightColumn, 230);
        if (invoice.customerInfo.email) {
            pdfDoc.text(invoice.customerInfo.email, rightColumn, 245);
        }
        if (invoice.customerInfo.phone) {
            pdfDoc.text(invoice.customerInfo.phone, rightColumn, 260);
        }
        if (invoice.customerInfo.address) {
            pdfDoc.text(invoice.customerInfo.address, rightColumn, 275, {
                width: columnWidth - 20
            });
        }
        pdfDoc.moveTo(40, 300)
            .lineTo(pdfDoc.page.width - 40, 300)
            .stroke();
        pdfDoc.fontSize(12)
            .text('Vehicle Information:', 40, 320)
            .fontSize(10)
            .text(`Make: ${invoice.vehicleInfo.make}`, 40, 340)
            .text(`Model: ${invoice.vehicleInfo.model}`, 40, 355)
            .text(`Year: ${invoice.vehicleInfo.year}`, 40, 370);
        if (invoice.vehicleInfo.licensePlate) {
            pdfDoc.text(`License Plate: ${invoice.vehicleInfo.licensePlate}`, 40, 385);
        }
        if (invoice.vehicleInfo.vin) {
            pdfDoc.text(`VIN: ${invoice.vehicleInfo.vin}`, 40, 400);
        }
        if (invoice.vehicleInfo.odometer) {
            pdfDoc.text(`Odometer: ${invoice.vehicleInfo.odometer}`, 40, 415);
        }
        pdfDoc.moveTo(40, 440)
            .lineTo(pdfDoc.page.width - 40, 440)
            .stroke();
        pdfDoc.fontSize(12)
            .text('Items & Services', 40, 460)
            .moveDown(0.5);
        const tableTop = pdfDoc.y;
        const tableLeft = 40;
        const tableWidth = pdfDoc.page.width - 80;
        const columnWidths = {
            description: tableWidth * 0.35,
            type: tableWidth * 0.15,
            qty: tableWidth * 0.1,
            unitPrice: tableWidth * 0.15,
            labor: tableWidth * 0.15,
            total: tableWidth * 0.1
        };
        pdfDoc.fillColor('#f8f9fa')
            .rect(tableLeft, tableTop, tableWidth, 25)
            .fill()
            .fillColor('#000000')
            .fontSize(10)
            .text('Description', tableLeft + 5, tableTop + 5, { width: columnWidths.description - 10 })
            .text('Type', tableLeft + columnWidths.description + 5, tableTop + 5, { width: columnWidths.type - 10 })
            .text('Qty', tableLeft + columnWidths.description + columnWidths.type + 5, tableTop + 5, { width: columnWidths.qty, align: 'right' })
            .text('Unit Price', tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + 5, tableTop + 5, { width: columnWidths.unitPrice, align: 'right' })
            .text('Labor', tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + 5, tableTop + 5, { width: columnWidths.labor, align: 'right' })
            .text('Total', tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + columnWidths.labor + 5, tableTop + 5, { width: columnWidths.total, align: 'right' });
        pdfDoc.moveTo(tableLeft, tableTop + 25)
            .lineTo(tableLeft + tableWidth, tableTop + 25)
            .stroke();
        let y = tableTop + 30;
        invoice.items.forEach((item, index) => {
            if (y > pdfDoc.page.height - 200) {
                pdfDoc.addPage();
                y = 40;
            }
            const laborHours = item.type === 'service' ? (item.laborHours || 0) : 0;
            const laborRate = item.type === 'service' ? (item.laborRate || 85) : 0;
            const itemTotal = item.type === 'service'
                ? (laborHours * laborRate) + (item.quantity * item.unitPrice)
                : (item.quantity * item.unitPrice);
            if (index % 2 === 0) {
                pdfDoc.fillColor('#f8f9fa')
                    .rect(tableLeft, y - 5, tableWidth, 25)
                    .fill()
                    .fillColor('#000000');
            }
            pdfDoc.text(item.description, tableLeft + 5, y, { width: columnWidths.description - 10 })
                .text(item.type, tableLeft + columnWidths.description + 5, y, { width: columnWidths.type - 10 })
                .text(item.quantity.toString(), tableLeft + columnWidths.description + columnWidths.type + 5, y, { width: columnWidths.qty, align: 'right' })
                .text(`$${item.unitPrice.toFixed(2)}`, tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + 5, y, { width: columnWidths.unitPrice, align: 'right' });
            if (item.type === 'service') {
                pdfDoc.text(`$${(laborHours * laborRate).toFixed(2)}`, tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + 5, y, { width: columnWidths.labor, align: 'right' });
            }
            else {
                pdfDoc.text('-', tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + 5, y, { width: columnWidths.labor, align: 'right' });
            }
            pdfDoc.text(`$${itemTotal.toFixed(2)}`, tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + columnWidths.labor + 5, y, { width: columnWidths.total, align: 'right' });
            y += 25;
        });
        pdfDoc.moveTo(tableLeft, y)
            .lineTo(tableLeft + tableWidth, y)
            .stroke();
        const summaryTop = y + 20;
        const summaryWidth = 250;
        const summaryLeft = pdfDoc.page.width - summaryWidth - 40;
        pdfDoc.fillColor('#f8f9fa')
            .rect(summaryLeft, summaryTop, summaryWidth, 100)
            .fill()
            .fillColor('#000000')
            .fontSize(12)
            .text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, summaryLeft + 10, summaryTop + 20, { align: 'right', width: summaryWidth - 20 })
            .text(`Tax (${invoice.taxRate}%): $${invoice.tax.toFixed(2)}`, summaryLeft + 10, summaryTop + 45, { align: 'right', width: summaryWidth - 20 })
            .fontSize(14)
            .text(`Total: $${invoice.total.toFixed(2)}`, summaryLeft + 10, summaryTop + 70, { align: 'right', width: summaryWidth - 20 });
        const notesTop = summaryTop + 120;
        if (invoice.notes) {
            pdfDoc.fontSize(12)
                .text('Notes:', 40, notesTop)
                .fontSize(10)
                .text(invoice.notes, 40, notesTop + 20, { width: pdfDoc.page.width - 80 });
        }
        if (invoice.terms) {
            pdfDoc.fontSize(12)
                .text('Terms & Conditions:', 40, notesTop + (invoice.notes ? 60 : 20))
                .fontSize(10)
                .text(invoice.terms, 40, notesTop + (invoice.notes ? 80 : 40), { width: pdfDoc.page.width - 80 });
        }
        if (invoice.status === 'paid') {
            const paymentTop = notesTop + (invoice.notes ? 120 : 80);
            pdfDoc.fontSize(12)
                .text('Payment Information:', 40, paymentTop)
                .fontSize(10)
                .text(`Payment Method: ${invoice.paymentMethod || 'N/A'}`, 40, paymentTop + 20);
            if (invoice.paymentDate) {
                pdfDoc.text(`Payment Date: ${(0, date_fns_1.format)(new Date(invoice.paymentDate), 'PPP')}`, 40, paymentTop + 35);
            }
        }
        pdfDoc.fontSize(8)
            .text('Thank you for choosing MF Auto Finance for your automotive needs.', pdfDoc.page.width / 2, pdfDoc.page.height - 40, { align: 'center', width: pdfDoc.page.width - 80 });
        pdfDoc.end();
        return res;
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        if (doc) {
            try {
                doc.end();
            }
            catch (e) {
                console.error('Error ending PDF document:', e);
            }
        }
        return res.status(500).json({ message: 'Server error generating PDF' });
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
const exportFinancialReportPDF = async (req, res) => {
    let doc = null;
    let timeoutId = null;
    try {
        const { dateRange, reportType } = req.body;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.pdf`);
        if (!dateRange || !reportType) {
            throw new Error('Missing required parameters');
        }
        doc = createBufferedPDF({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });
        timeoutId = setTimeout(() => {
            if (doc) {
                doc.end();
            }
            if (!res.headersSent) {
                res.status(500).json({ message: 'PDF generation timed out' });
            }
        }, 30000);
        doc.pipe(res);
        if (doc) {
            doc.end();
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        return res;
    }
    catch (error) {
        if (doc) {
            doc.end();
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (!res.headersSent) {
            console.error('Error generating financial report PDF:', error);
            return res.status(500).json({ message: 'Error generating PDF report' });
        }
        return res;
    }
};
exports.exportFinancialReportPDF = exportFinancialReportPDF;
const exportFinancialReportExcel = async (req, res) => {
    try {
        const { dateRange, reportType } = req.body;
        if (!dateRange || !reportType) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const query = {
            issueDate: {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            }
        };
        const invoices = await Invoice_1.default.find(query);
        const summary = {
            totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
            averageInvoiceAmount: invoices.length > 0
                ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length
                : 0
        };
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');
        worksheet.addRow(['Financial Report Summary']);
        worksheet.addRow(['Period', `${(0, date_fns_1.format)(new Date(dateRange.start), 'PPP')} - ${(0, date_fns_1.format)(new Date(dateRange.end), 'PPP')}`]);
        worksheet.addRow(['Total Revenue', `D ${summary.totalRevenue.toFixed(2)}`]);
        worksheet.addRow(['Average Invoice Amount', `D ${summary.averageInvoiceAmount.toFixed(2)}`]);
        worksheet.addRow(['Total Invoices', invoices.length]);
        worksheet.addRow([]);
        worksheet.addRow(['Detailed Invoice Data']);
        worksheet.columns = [
            { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 12 }
        ];
        worksheet.getRow(7).font = { bold: true };
        worksheet.getRow(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        invoices.forEach(invoice => {
            worksheet.addRow({
                invoiceNumber: invoice.invoiceNumber,
                date: (0, date_fns_1.format)(new Date(invoice.issueDate), 'yyyy-MM-dd'),
                customer: invoice.customerInfo.name,
                amount: invoice.total.toFixed(2),
                status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${(0, date_fns_1.format)(new Date(), 'yyyy-MM-dd')}.xlsx`);
        await workbook.xlsx.write(res);
        return res.end();
    }
    catch (error) {
        console.error('Error exporting financial report:', error);
        return res.status(500).json({ error: 'Failed to export financial report' });
    }
};
exports.exportFinancialReportExcel = exportFinancialReportExcel;
//# sourceMappingURL=invoiceController.js.map