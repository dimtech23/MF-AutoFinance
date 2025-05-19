import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from 'date-fns';
import ExcelJS from 'exceljs';
import { 
  InvoiceData, 
  InvoiceItem, 
  isInvoiceData, 
  AgingBucket, 
  TrendData, 
  ClientMetrics, 
  TaxAnalysis, 
  ProfitabilityMetrics, 
  EnhancedSummary,
  Summary 
} from '../types/invoice';

// Define a type for the PDF document with buffered pages
type BufferedPDFDocument = PDFDocument & {
  bufferedPageRange(): { start: number; count: number };
  switchToPage(page: number): BufferedPDFDocument;
};

// Define PDF document options type
interface PDFDocumentOptions {
  size?: string | [number, number];
  margin?: number;
  bufferPages?: boolean;
  [key: string]: any;
}

// Add after the safeNumber helper
const validateInvoiceData = (invoice: any): InvoiceData | null => {
  try {
    if (!invoice || typeof invoice !== 'object') return null;

    // Ensure required fields exist and have correct types
    const validated: InvoiceData = {
      _id: String(invoice._id || ''),
      invoiceNumber: String(invoice.invoiceNumber || ''),
      total: safeNumber(invoice.total),
      status: String(invoice.status || 'pending'),
      issueDate: new Date(invoice.issueDate || Date.now()),
      dueDate: new Date(invoice.dueDate || Date.now()),
      customerInfo: {
        name: String(invoice.customerInfo?.name || 'Unknown Customer'),
        id: invoice.customerInfo?.id ? String(invoice.customerInfo.id) : undefined
      },
      items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
        type: String(item.type || 'service'),
        description: String(item.description || ''),
        quantity: safeNumber(item.quantity),
        unitPrice: safeNumber(item.unitPrice),
        laborHours: safeNumber(item.laborHours),
        laborRate: safeNumber(item.laborRate)
      })) : []
    };

    if (invoice.paymentMethod) validated.paymentMethod = String(invoice.paymentMethod);
    if (invoice.paymentDate) validated.paymentDate = new Date(invoice.paymentDate);

    return validated;
  } catch (error) {
    console.error('Error validating invoice data:', error);
    return null;
  }
};

// Helper function to create a buffered PDF document
const createBufferedPDF = (options: PDFDocumentOptions): BufferedPDFDocument => {
  const doc = new PDFDocument({
    ...options,
    bufferPages: true
  });
  return doc as unknown as BufferedPDFDocument;
};

// Get all invoices
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    
    // If user is a mechanic, limit the data returned
    if ((req as any).user.role === UserRole.MECHANIC) {
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
    
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // If user is a mechanic, limit the data returned
    if ((req as any).user.role === UserRole.MECHANIC) {
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
    
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can create invoices
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to create invoices' });
    }
    
    const { 
      invoiceNumber, 
      status, 
      issueDate, 
      dueDate, 
      customerInfo, 
      vehicleInfo, 
      items, 
      taxRate, 
      notes, 
      terms,
      relatedClientId,
      mechanicNotes
    } = req.body;
    
    // Calculate subtotal, tax, and total
    let subtotal = 0;
    let taxableAmount = 0;
    
    items.forEach((item: any) => {
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
    
    // If related to a client, verify the client exists
    if (relatedClientId) {
      const client = await Client.findById(relatedClientId);
      if (!client) {
        return res.status(404).json({ message: 'Related client not found' });
      }
    }
    
    const newInvoice = new Invoice({
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
      createdBy: (req as any).user._id
    });
    
    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing invoice
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can update invoices
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to update invoices' });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const { 
      invoiceNumber, 
      status, 
      issueDate, 
      dueDate, 
      customerInfo, 
      vehicleInfo, 
      items, 
      taxRate, 
      notes, 
      terms,
      mechanicNotes
    } = req.body;
    
    // If items or taxRate changed, recalculate subtotal, tax, and total
    let subtotal = invoice.subtotal;
    let tax = invoice.tax;
    let total = invoice.total;
    
    if (items || taxRate) {
      subtotal = 0;
      let taxableAmount = 0;
      
      const itemsToCalculate = items || invoice.items;
      const taxRateToUse = taxRate !== undefined ? taxRate : invoice.taxRate;
      
      itemsToCalculate.forEach((item: any) => {
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
    
    const updateData: any = {
      subtotal,
      tax,
      total
    };
    
    // Add the updated fields
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (status !== undefined) updateData.status = status;
    if (issueDate !== undefined) updateData.issueDate = issueDate;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (customerInfo !== undefined) updateData.customerInfo = customerInfo;
    if (vehicleInfo !== undefined) updateData.vehicleInfo = vehicleInfo;
    if (items !== undefined) updateData.items = items;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;
    if (mechanicNotes !== undefined) updateData.mechanicNotes = mechanicNotes;
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    // Only Admin can delete invoices
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to delete invoices' });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    await Invoice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark invoice as paid
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can mark invoices as paid
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to mark invoices as paid' });
    }
    
    const { paymentMethod } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already marked as paid' });
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'paid',
          paymentDate: new Date(),
          paymentMethod: paymentMethod || 'cash',
          paidAmount: invoice.total
        }
      },
      { new: true }
    );
    
    // If this invoice is related to a client, update the client's payment status
    if (invoice.relatedClientId) {
      await Client.findByIdAndUpdate(
        invoice.relatedClientId,
        { $set: { paymentStatus: 'paid' } }
      );
    }
    
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process a payment for an invoice
export const processPayment = async (req: Request, res: Response) => {
  try {
    // Only Admin and Accountant can process payments
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to process payments' });
    }
    
    const { amount, method, reference } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount is required and must be greater than 0' });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }
    
    const paymentAmount = parseFloat(amount.toString());
    const isFullPayment = paymentAmount >= invoice.total;
    
    const updateData: any = {
      paymentDate: new Date(),
      paymentMethod: method || 'cash',
      paymentReference: reference || '',
      paidAmount: paymentAmount
    };
    
    // Update status based on payment amount
    if (isFullPayment) {
      updateData.status = 'paid';
      updateData.partialPayment = false;
    } else {
      updateData.status = 'pending';
      updateData.partialPayment = true;
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    // If this invoice is related to a client, update the client's payment status
    if (invoice.relatedClientId) {
      await Client.findByIdAndUpdate(
        invoice.relatedClientId,
        { 
          $set: { 
            paymentStatus: isFullPayment ? 'paid' : 'partial',
            partialPaymentAmount: isFullPayment ? 0 : paymentAmount
          } 
        }
      );
    }
    
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate PDF of invoice
export const generatePDF = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerInfo.id', 'clientName email phoneNumber address')
      .populate('vehicleInfo.id', 'make model year licensePlate vin odometer')
      .lean();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create PDF document with proper margins and font
    const doc = createBufferedPDF({
      size: 'A4',
      margin: 50
    });

    // Set proper response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Pipe PDF to response
    doc.pipe(res);

    // Add company header
    doc.fontSize(20).text('MF Auto Finance', { align: 'center' });
    doc.fontSize(12).text('123 Main Street, City, State 12345', { align: 'center' });
    doc.fontSize(12).text('Phone: (555) 123-4567 | Email: info@mfauto.com', { align: 'center' });
    doc.moveDown();

    // Add invoice header
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Add invoice details
    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown();

    // Add customer information
    const customer = invoice.customerInfo;
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(customer.name);
    if (customer.address) doc.text(customer.address);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    doc.moveDown();

    // Add vehicle information if available
    if (invoice.vehicleInfo) {
      const vehicle = invoice.vehicleInfo;
      doc.fontSize(12).text('Vehicle Information:', { underline: true });
      doc.fontSize(10);
      doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      if (vehicle.licensePlate) doc.text(`License Plate: ${vehicle.licensePlate}`);
      if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`);
      if (vehicle.odometer) doc.text(`Odometer: ${vehicle.odometer}`);
      doc.moveDown();
    }

    // Add items table
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const tableLeft = 50;
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const colWidth = (pageWidth - 100) / 6;

    doc.fontSize(10);
    doc.text('Description', tableLeft, tableTop);
    doc.text('Qty', tableLeft + colWidth, tableTop);
    doc.text('Unit Price', tableLeft + colWidth * 2, tableTop);
    doc.text('Labor Hours', tableLeft + colWidth * 3, tableTop);
    doc.text('Labor Rate', tableLeft + colWidth * 4, tableTop);
    doc.text('Amount', tableLeft + colWidth * 5, tableTop);
    doc.moveDown();

    // Table rows
    let y = doc.y;
    let currentPage = 1;

    invoice.items.forEach((item) => {
      // Check if we need a new page
      if (y > pageHeight - 100) {
        // Add page number before adding new page
        doc.fontSize(8).text(
          `Page ${currentPage}`,
          pageWidth / 2,
          pageHeight - 30,
          { align: 'center' }
        );
        
        doc.addPage();
        currentPage++;
        y = 50;
      }

      // Calculate amount with null checks
      const laborHours = item.laborHours || 0;
      const laborRate = item.laborRate || 0;
      const amount = item.quantity * (item.unitPrice + (laborHours * laborRate));
      
      doc.text(item.description, tableLeft, y);
      doc.text(item.quantity.toString(), tableLeft + colWidth, y);
      doc.text(`$${item.unitPrice.toFixed(2)}`, tableLeft + colWidth * 2, y);
      doc.text(laborHours.toString(), tableLeft + colWidth * 3, y);
      doc.text(`$${laborRate.toFixed(2)}`, tableLeft + colWidth * 4, y);
      doc.text(`$${amount.toFixed(2)}`, tableLeft + colWidth * 5, y);
      
      y += 20;
    });

    // Add totals
    doc.moveDown(2);
    const subtotal = invoice.items.reduce((sum, item) => {
      const laborHours = item.laborHours || 0;
      const laborRate = item.laborRate || 0;
      const itemTotal = item.quantity * (item.unitPrice + (laborHours * laborRate));
      return sum + itemTotal;
    }, 0);
    
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;

    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (${invoice.taxRate}%): $${tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(12).text(`Total: $${total.toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    // Add notes if any
    if (invoice.notes) {
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(invoice.notes);
      doc.moveDown();
    }

    // Add terms if any
    if (invoice.terms) {
      doc.fontSize(10).text('Terms:', { underline: true });
      doc.text(invoice.terms);
      doc.moveDown();
    }

    // Add payment information if paid
    if (invoice.status === 'paid' && invoice.paymentMethod) {
      doc.fontSize(10).text('Payment Information:', { underline: true });
      doc.text(`Payment Method: ${invoice.paymentMethod}`);
      if (invoice.paymentDate) {
        doc.text(`Payment Date: ${new Date(invoice.paymentDate).toLocaleDateString()}`);
      }
    }

    // Add final page number
    doc.fontSize(8).text(
      `Page ${currentPage}`,
      pageWidth / 2,
      pageHeight - 30,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};

// Export invoices to Excel
export const exportToExcel = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    
    // Build query
    const query: any = {};
    if (startDate && endDate) {
      query.issueDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Fetch invoices
    const invoices = await Invoice.find(query).sort({ issueDate: -1 });
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');
    
    // Add headers
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
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add data rows
    invoices.forEach(invoice => {
      worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        date: format(new Date(invoice.issueDate), 'yyyy-MM-dd'),
        dueDate: format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
        customer: invoice.customerInfo.name,
        vehicle: `${invoice.vehicleInfo.year} ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`,
        status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
        subtotal: invoice.subtotal.toFixed(2),
        tax: invoice.tax.toFixed(2),
        total: invoice.total.toFixed(2),
        paymentMethod: invoice.paymentMethod || 'N/A',
        paymentDate: invoice.paymentDate ? format(new Date(invoice.paymentDate), 'yyyy-MM-dd') : 'N/A'
      });
    });
    
    // Add totals row
    const lastRow = worksheet.rowCount;
    worksheet.addRow({
      invoiceNumber: 'TOTAL',
      total: invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)
    });
    worksheet.getRow(lastRow + 1).font = { bold: true };
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoices-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add helper function for safe number calculations
const safeNumber = (value: any, defaultValue = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Add helper function for safe percentage calculation
const safePercentage = (value: number, total: number): number => {
  if (!total || isNaN(total) || total === 0) return 0;
  const percentage = (value / total) * 100;
  return isNaN(percentage) ? 0 : percentage;
};

// Add helper function for safe number formatting
const safeNumberFormat = (value: number | null | undefined, defaultValue = 0): string => {
  const num = safeNumber(value, defaultValue);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Add helper function for safe percentage formatting
const safePercentageFormat = (value: number | null | undefined, total: number | null | undefined = 100): string => {
  if (value === null || value === undefined || total === null || total === undefined) {
    return '0%';
  }
  return `${((value / total) * 100).toFixed(1)}%`;
};

// Add helper function for PDF operations
const withPDFDocument = async (
  doc: BufferedPDFDocument | null,
  operation: (doc: BufferedPDFDocument) => void
): Promise<void> => {
  if (!doc) {
    throw new Error('PDF document is not initialized');
  }
  operation(doc);
};

// Helper function to calculate aging buckets
const calculateAgingAnalysis = (invoices: InvoiceData[]): AgingBucket => {
  const now = new Date();
  const aging: AgingBucket = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0
  };

  invoices.forEach(invoice => {
    if (invoice.status === 'paid') return;

    const daysOverdue = differenceInDays(now, invoice.dueDate);
    const amount = invoice.total;

    if (daysOverdue <= 0) {
      aging.current += amount;
    } else if (daysOverdue <= 30) {
      aging.days30 += amount;
    } else if (daysOverdue <= 60) {
      aging.days60 += amount;
    } else if (daysOverdue <= 90) {
      aging.days90 += amount;
    } else {
      aging.over90 += amount;
    }
  });

  return aging;
};

// Helper function to calculate trends
const calculateTrends = (invoices: InvoiceData[], startDate: Date, endDate: Date): TrendData[] => {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const trends: TrendData[] = [];

  months.forEach(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthInvoices = invoices.filter(inv => 
      inv.issueDate >= monthStart && inv.issueDate <= monthEnd
    );

    const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
    const collectionRate = (paidInvoices.reduce((sum, inv) => sum + inv.total, 0) / revenue) * 100;

    trends.push({
      period: format(month, 'MMM yyyy'),
      revenue,
      invoices: monthInvoices.length,
      averageAmount: revenue / (monthInvoices.length || 1),
      collectionRate
    });
  });

  return trends;
};

// Helper function to calculate client metrics
const calculateClientMetrics = (invoices: InvoiceData[]): ClientMetrics[] => {
  const clientMap = new Map<string, ClientMetrics>();

  invoices.forEach(invoice => {
    const clientId = invoice.customerInfo.id || 'unknown';
    const clientName = invoice.customerInfo.name;
    const existing = clientMap.get(clientId);

    if (existing) {
      existing.totalSpent += invoice.total;
      existing.invoiceCount++;
      existing.averageInvoiceAmount = existing.totalSpent / existing.invoiceCount;
      existing.lastInvoiceDate = new Date(Math.max(
        existing.lastInvoiceDate.getTime(),
        invoice.issueDate.getTime()
      ));

      if (invoice.status === 'paid') {
        const daysToPay = differenceInDays(
          new Date(invoice.paymentDate || invoice.issueDate),
          invoice.issueDate
        );
        existing.paymentHistory.averageDaysToPay = 
          (existing.paymentHistory.averageDaysToPay * existing.paymentHistory.onTime + daysToPay) /
          (existing.paymentHistory.onTime + 1);
        
        if (daysToPay <= 30) {
          existing.paymentHistory.onTime++;
        } else {
          existing.paymentHistory.late++;
        }
      }
    } else {
      clientMap.set(clientId, {
        clientId,
        clientName,
        totalSpent: invoice.total,
        invoiceCount: 1,
        averageInvoiceAmount: invoice.total,
        lastInvoiceDate: invoice.issueDate,
        paymentHistory: {
          onTime: invoice.status === 'paid' && 
            differenceInDays(
              new Date(invoice.paymentDate || invoice.issueDate),
              invoice.issueDate
            ) <= 30 ? 1 : 0,
          late: invoice.status === 'paid' && 
            differenceInDays(
              new Date(invoice.paymentDate || invoice.issueDate),
              invoice.issueDate
            ) > 30 ? 1 : 0,
          averageDaysToPay: invoice.status === 'paid' ? 
            differenceInDays(
              new Date(invoice.paymentDate || invoice.issueDate),
              invoice.issueDate
            ) : 0
        }
      });
    }
  });

  return Array.from(clientMap.values());
};

// Helper function to calculate tax analysis
const calculateTaxAnalysis = (invoices: InvoiceData[]): TaxAnalysis => {
  const taxAnalysis: TaxAnalysis = {
    totalTaxableAmount: 0,
    totalTaxAmount: 0,
    taxByCategory: {},
    taxByPeriod: {}
  };

  invoices.forEach(invoice => {
    const taxableAmount = invoice.items.reduce((sum, item) => 
      sum + (item.taxable ? item.quantity * item.unitPrice : 0), 0
    );
    const taxAmount = taxableAmount * 0.075; // Assuming 7.5% tax rate

    taxAnalysis.totalTaxableAmount += taxableAmount;
    taxAnalysis.totalTaxAmount += taxAmount;

    // Group by service category
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

    // Group by period
    const period = format(invoice.issueDate, 'MMM yyyy');
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

// Helper function to calculate profitability metrics
const calculateProfitabilityMetrics = (invoices: InvoiceData[]): ProfitabilityMetrics => {
  const metrics: ProfitabilityMetrics = {
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
      // Assuming 60% cost for parts and 40% for labor
      const cost = item.type === 'part' ? 
        revenue * 0.6 : // 60% cost for parts
        (item.laborHours || 0) * (item.laborRate || 0) * 0.4; // 40% cost for labor

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

  // Calculate top profitable services
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

// Helper function to calculate comparative analysis
const calculateComparativeAnalysis = (
  currentInvoices: InvoiceData[],
  previousInvoices: InvoiceData[]
): EnhancedSummary['comparativeAnalysis'] => {
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

// Update the exportFinancialReportPDF function to include enhanced metrics
export const exportFinancialReportPDF = async (req: Request, res: Response) => {
  let doc: BufferedPDFDocument | null = null;
  
  try {
    const { dateRange, customDateRange, reportType, filters } = req.body;
    
    // Validate request data
    if (!dateRange || !reportType) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    if (dateRange === 'custom' && customDateRange?.[0] && customDateRange?.[1]) {
      startDate = startOfDay(new Date(customDateRange[0]));
      endDate = endOfDay(new Date(customDateRange[1]));
    } else {
      endDate = endOfDay(now);
      startDate = startOfDay(
        dateRange === 'week' ? subDays(now, 7) :
        dateRange === 'month' ? subMonths(now, 1) :
        dateRange === 'quarter' ? subMonths(now, 3) :
        dateRange === 'year' ? subYears(now, 1) :
        subMonths(now, 1)
      );
    }
    
    // Build query
    const query: any = {
      issueDate: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    // Fetch and validate invoices
    const rawInvoices = await Invoice.find(query)
      .populate('customerInfo.id', 'clientName')
      .sort({ issueDate: -1 })
      .lean();
    
    if (!rawInvoices || rawInvoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found for the selected period' });
    }

    // Validate and transform invoice data
    const invoices = rawInvoices
      .map(validateInvoiceData)
      .filter(isInvoiceData);
    
    if (invoices.length === 0) {
      return res.status(400).json({ message: 'No valid invoice data found' });
    }
    
    // Create PDF document
    doc = createBufferedPDF({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="financial_report_${reportType}_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.pdf"`
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Pipe PDF to response
    doc.pipe(res);

    // Calculate summary with validated data
    const summary: Summary = {
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

    // Calculate summary with validated data
    invoices.forEach(invoice => {
      const total = safeNumber(invoice.total);
      summary.totalRevenue += total;
      
      if (invoice.status === 'paid') {
        summary.totalPaid += total;
        summary.paidInvoices++;
      } else {
        summary.totalOutstanding += total;
        if (invoice.dueDate < new Date()) {
          summary.overdueInvoices++;
        }
      }
      
      // Track payment methods with validated data
      if (invoice.paymentMethod) {
        const method = invoice.paymentMethod;
        summary.paymentMethods[method] = safeNumber(
          summary.paymentMethods[method] || 0
        ) + total;
      }
      
      // Track service categories with validated data
      invoice.items.forEach((item: InvoiceItem) => {
        if (item.type === 'service') {
          const category = item.description.split(' ')[0] || 'Other';
          let itemTotal = safeNumber(item.quantity) * safeNumber(item.unitPrice);
          if (item.laborHours && item.laborRate) {
            itemTotal += safeNumber(item.laborHours) * safeNumber(item.laborRate);
          }
          summary.serviceCategories[category] = safeNumber(
            summary.serviceCategories[category] || 0
          ) + itemTotal;
        }
      });
    });

    // Calculate derived metrics
    summary.averageInvoiceAmount = safeNumber(
      summary.totalRevenue / (summary.totalInvoices || 1)
    );
    summary.collectionRate = safePercentage(summary.totalPaid, summary.totalRevenue);

    // Add company header
    await withPDFDocument(doc, (d) => {
      d.fontSize(20).text('MF Auto Finance', { align: 'center' });
      d.fontSize(12).text('Financial Report', { align: 'center' });
      d.moveDown();
    });

    // Add report details
    await withPDFDocument(doc, (d) => {
      d.fontSize(10);
      d.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`);
      d.text(`Date Range: ${format(startDate, 'MMM dd, yyyy')} to ${format(endDate, 'MMM dd, yyyy')}`);
      d.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}`);
      d.moveDown();
    });

    // Add summary section
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
        if (y > 750) { // A4 height - margin
          d.addPage();
          y = 50;
        }
        d.text(label, tableLeft, y);
        d.text(value, tableLeft + colWidth, y);
        y += 20;
      });
    });

    // Add payment methods section
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

    // Add service categories section
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

    // Add invoice list if requested
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
            d.text(format(invoice.issueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0], y);
            d.text(invoice.customerInfo.name || 'N/A', tableLeft + colWidths[0] + colWidths[1], y);
            d.text(`D ${safeNumberFormat(invoice.total)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
            d.text(invoice.status || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
            d.text(format(invoice.dueDate, 'MMM dd, yyyy'), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
            
            y += 20;
          } catch (err) {
            console.error('Error processing invoice row:', err);
          }
        });
      });
    }

    // Add new sections for enhanced metrics
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

    // Add trend analysis
    await withPDFDocument(doc, (d) => {
      d.addPage();
      d.fontSize(14).text('Revenue Trends', { underline: true });
      d.moveDown();
      
      const trendsData = calculateTrends(invoices, startDate, endDate);
      let y = d.y;
      const tableLeft = 50;
      const colWidth = 250;
      
      trendsData.forEach((trend, index) => {
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

    // Add client performance
    await withPDFDocument(doc, (d) => {
      d.addPage();
      d.fontSize(14).text('Top Performing Clients', { underline: true });
      d.moveDown();
      
      const clientMetricsData = calculateClientMetrics(invoices);
      let y = d.y;
      const tableLeft = 50;
      const colWidth = 250;
      
      clientMetricsData.forEach((client, index) => {
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

    // Add tax analysis
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

    // Add profitability analysis
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

    // Add comparative analysis
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

    // Add page numbers
    if (doc) {
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Page ${i + 1} of ${pages.count}`,
          297.64, // A4 width / 2
          811.89, // A4 height - 30
          { align: 'center' }
        );
      }
    }

    // Finalize PDF
    if (doc) {
      doc.end();
      doc = null;
    }
    
  } catch (error) {
    console.error('Error generating financial report PDF:', error);
    if (doc) {
      try {
        doc.end();
      } catch (e) {
        console.error('Error ending PDF document:', e);
      }
    }
    res.status(500).json({ 
      message: 'Failed to generate financial report PDF',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};

// Export financial report to Excel
export const exportFinancialReportExcel = async (req: Request, res: Response) => {
  try {
    const { dateRange, customDateRange, reportType, filters } = req.body;
    
    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    if (dateRange === 'custom' && customDateRange[0] && customDateRange[1]) {
      startDate = startOfDay(new Date(customDateRange[0]));
      endDate = endOfDay(new Date(customDateRange[1]));
    } else {
      endDate = endOfDay(now);
      startDate = startOfDay(
        dateRange === 'week' ? subDays(now, 7) :
        dateRange === 'month' ? subMonths(now, 1) :
        dateRange === 'quarter' ? subMonths(now, 3) :
        dateRange === 'year' ? subYears(now, 1) :
        subMonths(now, 1)
      );
    }
    
    // Build query
    const query: any = {
      issueDate: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    // Fetch invoices
    const invoices = await Invoice.find(query)
      .populate('customerInfo.id', 'clientName')
      .sort({ issueDate: -1 });
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Calculate summary with proper typing
    const summary: Summary = {
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
      } else {
        summary.totalOutstanding += invoice.total;
        if (new Date(invoice.dueDate) < new Date()) {
          summary.overdueInvoices++;
        }
      }
      
      // Track payment methods with type assertion
      if (invoice.paymentMethod) {
        const method = invoice.paymentMethod as string;
        summary.paymentMethods[method] = 
          (summary.paymentMethods[method] || 0) + invoice.total;
      }
      
      // Track service categories with type assertion
      invoice.items.forEach(item => {
        if (item.type === 'service') {
          const category = item.description.split(' ')[0] as string;
          summary.serviceCategories[category] = 
            (summary.serviceCategories[category] || 0) + (item.quantity * item.unitPrice);
        }
      });
    });
    
    summary.averageInvoiceAmount = summary.totalRevenue / (summary.totalInvoices || 1);
    summary.collectionRate = (summary.totalPaid / summary.totalRevenue) * 100;
    
    // Add summary data
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
    
    // Style summary sheet
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add payment methods sheet
    const paymentMethodsSheet = workbook.addWorksheet('Payment Methods');
    paymentMethodsSheet.columns = [
      { header: 'Method', key: 'method', width: 20 },
      { header: 'Amount', key: 'amount', width: 20 },
      { header: 'Percentage', key: 'percentage', width: 20 }
    ];
    
    // Type assertions for payment methods data
    const paymentMethodsData = Object.entries(summary.paymentMethods).map(([method, amount]) => ({
      method,
      amount: `D ${(amount as number).toFixed(2)}`,
      percentage: `${(((amount as number) / summary.totalRevenue) * 100).toFixed(1)}%`
    }));
    
    paymentMethodsSheet.addRows(paymentMethodsData);
    
    // Style payment methods sheet
    paymentMethodsSheet.getRow(1).font = { bold: true };
    paymentMethodsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add service categories sheet
    const serviceCategoriesSheet = workbook.addWorksheet('Service Categories');
    serviceCategoriesSheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Revenue', key: 'revenue', width: 20 },
      { header: 'Percentage', key: 'percentage', width: 20 }
    ];
    
    // Type assertions for service categories data
    const serviceCategoriesData = Object.entries(summary.serviceCategories)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([category, revenue]) => ({
        category,
        revenue: `D ${(revenue as number).toFixed(2)}`,
        percentage: `${(((revenue as number) / summary.totalRevenue) * 100).toFixed(1)}%`
      }));
    
    serviceCategoriesSheet.addRows(serviceCategoriesData);
    
    // Style service categories sheet
    serviceCategoriesSheet.getRow(1).font = { bold: true };
    serviceCategoriesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add invoice details sheet if requested
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
        date: format(new Date(invoice.issueDate), 'yyyy-MM-dd'),
        client: invoice.customerInfo.name,
        amount: invoice.total.toFixed(2),
        status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
        dueDate: format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
        paymentMethod: invoice.paymentMethod || 'N/A',
        paymentDate: invoice.paymentDate ? format(new Date(invoice.paymentDate), 'yyyy-MM-dd') : 'N/A'
      }));
      
      invoiceSheet.addRows(invoiceData);
      
      // Style invoice sheet
      invoiceSheet.getRow(1).font = { bold: true };
      invoiceSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add totals row
      const lastRow = invoiceSheet.rowCount;
      invoiceSheet.addRow({
        invoiceNumber: 'TOTAL',
        amount: invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)
      });
      invoiceSheet.getRow(lastRow + 1).font = { bold: true };
    }
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=financial_report_${reportType}_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`
    );
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generating financial report Excel:', error);
    res.status(500).json({ 
      message: 'Failed to generate financial report Excel',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
};