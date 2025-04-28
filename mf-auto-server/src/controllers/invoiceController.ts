import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';

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
    
    // In a real application, you would use a PDF generation library like PDFKit or html-pdf
    // For now, we'll just return the invoice data
    
    res.status(200).json({
      message: 'PDF generation would happen here in a production environment',
      invoiceData: invoice
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Server error' });
  }
};