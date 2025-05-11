import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';

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
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create a PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company logo and header
    doc.fontSize(20).text('Auto Garage', { align: 'left' });
    doc.fontSize(10).text('123 Repair Street', { align: 'left' });
    doc.text('Automotive City, AC 12345');
    doc.text('Phone: (555) 123-4567');
    doc.text('Email: service@autogarage.com');
    
    // Add invoice title and number
    doc.moveDown(2);
    doc.fontSize(16).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${format(new Date(invoice.issueDate), 'MMMM d, yyyy')}`, { align: 'right' });
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}`, { align: 'right' });
    
    // Add customer information
    doc.moveDown(2);
    doc.fontSize(12).text('BILL TO:', { underline: true });
    doc.fontSize(10).text(invoice.customerInfo.name);
    if (invoice.customerInfo.address) doc.text(invoice.customerInfo.address);
    if (invoice.customerInfo.phone) doc.text(`Phone: ${invoice.customerInfo.phone}`);
    if (invoice.customerInfo.email) doc.text(`Email: ${invoice.customerInfo.email}`);
    
    // Add vehicle information
    doc.moveDown(1);
    doc.fontSize(12).text('VEHICLE INFORMATION:', { underline: true });
    doc.fontSize(10).text(
      `${invoice.vehicleInfo.year} ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`
    );
    if (invoice.vehicleInfo.licensePlate) {
      doc.text(`License Plate: ${invoice.vehicleInfo.licensePlate}`);
    }
    if (invoice.vehicleInfo.vin) {
      doc.text(`VIN: ${invoice.vehicleInfo.vin}`);
    }
    
    // Add items table
    doc.moveDown(2);
    doc.fontSize(12).text('ITEMS:', { underline: true });
    
    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Description', 50, tableTop);
    doc.text('Type', 250, tableTop);
    doc.text('Qty', 350, tableTop);
    doc.text('Price', 400, tableTop);
    doc.text('Total', 500, tableTop);
    
    // Table rows
    let y = tableTop + 20;
    invoice.items.forEach((item: any) => {
      if (y > 700) { // Check if we need a new page
        doc.addPage();
        y = 50;
      }
      
      const itemTotal = item.type === 'service' 
        ? (item.laborHours * item.laborRate) + (item.quantity * item.unitPrice)
        : (item.quantity * item.unitPrice);
      
      doc.text(item.description, 50, y);
      doc.text(item.type.charAt(0).toUpperCase() + item.type.slice(1), 250, y);
      doc.text(item.quantity.toString(), 350, y);
      doc.text(item.unitPrice.toFixed(2), 400, y);
      doc.text(itemTotal.toFixed(2), 500, y);
      
      y += 20;
    });
    
    // Add totals
    doc.moveDown(2);
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (${invoice.taxRate}%): ${invoice.tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(12).text(`Total: ${invoice.total.toFixed(2)}`, { align: 'right' });
    
    // Add notes and terms
    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(12).text('Notes:', { underline: true });
      doc.fontSize(10).text(invoice.notes);
    }
    
    if (invoice.terms) {
      doc.moveDown(1);
      doc.fontSize(12).text('Terms & Conditions:', { underline: true });
      doc.fontSize(10).text(invoice.terms);
    }
    
    // Add footer
    doc.fontSize(8).text(
      'Thank you for your business!',
      50,
      700,
      { align: 'center', width: 500 }
    );
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Server error' });
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