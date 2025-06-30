import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import axios from 'axios';

// Define a type for the PDF document with buffered pages
type BufferedPDFDocument = typeof PDFDocument & {
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

// Helper function to create a buffered PDF document
const createBufferedPDF = (options: PDFDocumentOptions): BufferedPDFDocument => {
  const doc = new PDFDocument({
    ...options,
    bufferPages: true
  });
  return doc as unknown as BufferedPDFDocument;
};

// Helper function to get company logo
const getCompanyLogo = async (): Promise<Buffer | null> => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://i.ibb.co/PGLYCzRD/MF-Autos-Social-Media.jpg',
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading company logo:', error);
    return null;
  }
};

// Get all invoices
export const getAllInvoices = async (req: Request, res: Response): Promise<Response> => {
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
    
    return res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific invoice by ID
export const getInvoiceById = async (req: Request, res: Response): Promise<Response> => {
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
    
    return res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new invoice
export const createInvoice = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(201).json(savedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing invoice
export const updateInvoice = async (req: Request, res: Response): Promise<Response> => {
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
    
    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete an invoice
export const deleteInvoice = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Mark invoice as paid
export const markAsPaid = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Only Admin and Accountant can mark invoices as paid
    if (![(req as any).user.role === UserRole.ADMIN, (req as any).user.role === UserRole.ACCOUNTANT].includes(true)) {
      return res.status(403).json({ message: 'Not authorized to mark invoices as paid' });
    }
    
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
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Process payment for an invoice
export const processPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { amount, paymentMethod, paymentDate, paymentReference } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Validate payment amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Update invoice with payment information
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: amount >= invoice.total ? 'paid' : 'partial',
          paymentMethod,
          paymentDate: paymentDate || new Date(),
          partialPaymentAmount: amount,
          updatedBy: (req as any).user._id
        }
      },
      { new: true }
    );
    
    // Create payment history record
    try {
      const PaymentHistory = mongoose.model('PaymentHistory');
      const paymentRecord = new PaymentHistory({
        clientId: invoice.relatedClientId || invoice.customerInfo?.id,
        invoiceId: invoice._id,
        amount: amount,
        paymentMethod: paymentMethod || 'cash',
        paymentDate: paymentDate || new Date(),
        paymentReference: paymentReference || `Payment for Invoice #${invoice.invoiceNumber}`,
        status: 'completed',
        recordedBy: (req as any).user._id,
        description: `Payment for Invoice #${invoice.invoiceNumber} - ${invoice.customerInfo?.name || 'Unknown Customer'}`
      });
      await paymentRecord.save();
    } catch (error) {
      console.error('Error creating payment history:', error);
      // Don't fail the main operation if payment history fails
    }
    
    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Generate PDF for an invoice
export const generatePDF = async (req: Request, res: Response): Promise<Response> => {
  let doc: BufferedPDFDocument | null = null;
  
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Create PDF document with smaller margins for more space
    doc = createBufferedPDF({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });
    
    if (!doc) {
      throw new Error('Failed to create PDF document');
    }

    const pdfDoc = doc as BufferedPDFDocument;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    pdfDoc.pipe(res);
    
    // Add company logo with proper spacing
    try {
      const logoBuffer = await getCompanyLogo();
      if (logoBuffer) {
        pdfDoc.image(logoBuffer, 40, 40, {
          width: 120,
          height: 120,
          fit: [120, 120]
        });
      }
    } catch (error) {
      console.error('Error adding company logo:', error);
      // Continue without the logo
    }

    // Company header - positioned to the right of the logo
    pdfDoc.fontSize(24)
        .text('MF Auto Finance', 180, 60)
        .fontSize(12)
        .text('Professional Auto Repair & Maintenance', 180, 90)
        .fontSize(10)
        .text('123 Main Street, City, Country', 180, 110)
        .text('Phone: (123) 456-7890 | Email: info@mfautofinance.com', 180, 125);

    // Add a horizontal line after header
    pdfDoc.moveTo(40, 170)
          .lineTo(pdfDoc.page.width - 40, 170)
          .stroke();

    // Invoice title and details - starting at y=190
    pdfDoc.fontSize(20)
        .text('INVOICE', { align: 'center' })
        .moveDown(0.5);

    // Create two columns for invoice details
    const leftColumn = 40;
    const rightColumn = pdfDoc.page.width / 2 + 20;
    const columnWidth = (pdfDoc.page.width - 80) / 2;

    // Left column - Invoice details
    pdfDoc.fontSize(12)
        .text('Invoice Details:', leftColumn, 210)
        .fontSize(10)
        .text(`Invoice Number: ${invoice.invoiceNumber}`, leftColumn, 230)
        .text(`Date: ${format(new Date(invoice.issueDate), 'PPP')}`, leftColumn, 245)
        .text(`Due Date: ${format(new Date(invoice.dueDate), 'PPP')}`, leftColumn, 260)
        .text(`Status: ${invoice.status.toUpperCase()}`, leftColumn, 275);

    // Right column - Customer information
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

    // Add a horizontal line before vehicle info
    pdfDoc.moveTo(40, 300)
          .lineTo(pdfDoc.page.width - 40, 300)
          .stroke();

    // Vehicle information - starting at y=320
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

    // Add a horizontal line before items table
    pdfDoc.moveTo(40, 440)
          .lineTo(pdfDoc.page.width - 40, 440)
          .stroke();

    // Items table header - starting at y=460
    pdfDoc.fontSize(12)
        .text('Items & Services', 40, 460)
        .moveDown(0.5);
    
    // Table headers with background
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
    
    // Draw table headers with background
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
    
    // Draw horizontal line under headers
    pdfDoc.moveTo(tableLeft, tableTop + 25)
          .lineTo(tableLeft + tableWidth, tableTop + 25)
          .stroke();
    
    // Items
    let y = tableTop + 30;
    invoice.items.forEach((item, index) => {
      // Check if we need a new page
      if (y > pdfDoc.page.height - 200) {
        pdfDoc.addPage();
        y = 40;
      }
      
      const laborHours = item.type === 'service' ? (item.laborHours || 0) : 0;
      const laborRate = item.type === 'service' ? (item.laborRate || 85) : 0;
      const itemTotal = item.type === 'service' 
        ? (laborHours * laborRate) + (item.quantity * item.unitPrice)
        : (item.quantity * item.unitPrice);
      
      // Alternate row colors
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
      } else {
        pdfDoc.text('-', tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + 5, y, { width: columnWidths.labor, align: 'right' });
      }
      
      pdfDoc.text(`$${itemTotal.toFixed(2)}`, tableLeft + columnWidths.description + columnWidths.type + columnWidths.qty + columnWidths.unitPrice + columnWidths.labor + 5, y, { width: columnWidths.total, align: 'right' });
      
      y += 25;
    });
    
    // Draw bottom line of table
    pdfDoc.moveTo(tableLeft, y)
          .lineTo(tableLeft + tableWidth, y)
          .stroke();
    
    // Summary section - positioned at the bottom right
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
    
    // Notes and terms - positioned below the summary
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
    
    // Payment information if paid
    if (invoice.status === 'paid') {
      const paymentTop = notesTop + (invoice.notes ? 120 : 80);
      pdfDoc.fontSize(12)
          .text('Payment Information:', 40, paymentTop)
          .fontSize(10)
          .text(`Payment Method: ${invoice.paymentMethod || 'N/A'}`, 40, paymentTop + 20);
      
      if (invoice.paymentDate) {
        pdfDoc.text(`Payment Date: ${format(new Date(invoice.paymentDate), 'PPP')}`, 40, paymentTop + 35);
      }
    }
    
    // Footer
    pdfDoc.fontSize(8)
        .text(
          'Thank you for choosing MF Auto Finance for your automotive needs.',
          pdfDoc.page.width / 2,
          pdfDoc.page.height - 40,
          { align: 'center', width: pdfDoc.page.width - 80 }
        );
    
    // Finalize PDF
    pdfDoc.end();
    
    return res;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (doc) {
      try {
        doc.end();
      } catch (e) {
        console.error('Error ending PDF document:', e);
      }
    }
    return res.status(500).json({ message: 'Server error generating PDF' });
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

// Export financial report as PDF
export const exportFinancialReportPDF = async (req: Request, res: Response): Promise<Response> => {
  let doc: BufferedPDFDocument | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const { dateRange, reportType } = req.body;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    // Validate request data
    if (!dateRange || !reportType) {
      throw new Error('Missing required parameters');
    }

    // Create PDF document
    doc = createBufferedPDF({
      size: 'A4',
      margin: 50,
      bufferPages: true
    });

    // Set up timeout for PDF generation
    timeoutId = setTimeout(() => {
      if (doc) {
        doc.end();
      }
      if (!res.headersSent) {
        res.status(500).json({ message: 'PDF generation timed out' });
      }
    }, 30000); // 30 second timeout

    // Pipe the PDF to the response
    doc.pipe(res);

    // Generate PDF content based on report type
    // ... rest of the PDF generation code ...

    // End the PDF document
    if (doc) {
      doc.end();
    }

    // Clear the timeout since we completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return res;
  } catch (error) {
    // Clean up resources in case of error
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

// Export financial report to Excel
export const exportFinancialReportExcel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { dateRange, reportType } = req.body;
    
    // Validate request data
    if (!dateRange || !reportType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Build query based on date range
    const query: any = {
      issueDate: {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    };

    // Fetch invoices for the date range
    const invoices = await Invoice.find(query);
    
    // Calculate summary data
    const summary = {
      totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
      averageInvoiceAmount: invoices.length > 0 
        ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length 
        : 0
    };
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Report');
    
    // Add summary section
    worksheet.addRow(['Financial Report Summary']);
    worksheet.addRow(['Period', `${format(new Date(dateRange.start), 'PPP')} - ${format(new Date(dateRange.end), 'PPP')}`]);
    worksheet.addRow(['Total Revenue', `D ${summary.totalRevenue.toFixed(2)}`]);
    worksheet.addRow(['Average Invoice Amount', `D ${summary.averageInvoiceAmount.toFixed(2)}`]);
    worksheet.addRow(['Total Invoices', invoices.length]);
    
    // Add detailed invoice data
    worksheet.addRow([]); // Empty row for spacing
    worksheet.addRow(['Detailed Invoice Data']);
    worksheet.columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    
    // Style headers
    worksheet.getRow(7).font = { bold: true };
    worksheet.getRow(7).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add invoice data
    invoices.forEach(invoice => {
      worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        date: format(new Date(invoice.issueDate), 'yyyy-MM-dd'),
        customer: invoice.customerInfo.name,
        amount: invoice.total.toFixed(2),
        status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
      });
    });
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=financial-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    );
    
    // Write to response and return
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error exporting financial report:', error);
    return res.status(500).json({ error: 'Failed to export financial report' });
  }
};