import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import { invoicesAPI, clientsAPI, budgetAPI } from "../../api";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
// import {
//   getStatusColor,
//   getStatusIcon,
//   mapStatus,
//   shouldCreateInvoice,
// } from "../../utility/statusMapper.js";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  DollarSign,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Search,
  Calendar,
  Eye,
  Printer,
  FileText,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  Link,
  CornerDownRight,
  Copy,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Card,
  // CardHeader,
  // CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  // FormLabel,
  // RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Divider,
  Tooltip,
  Avatar,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  // Autocomplete,
  Popover,
  // Badge,
  List,
  // ListItem,
  // ListItemText,
  ListItemIcon,
  Menu,
  Snackbar,
  FormLabel,
  RadioGroup,
} from "@mui/material";
// import axios from "axios";
import { debounce } from "lodash";

// const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const invoiceStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "mobile_payment", label: "Mobile Payment" },
];

const serviceItems = [
  {
    id: 1,
    description: "Oil Change - Synthetic",
    price: 79.95,
    laborHours: 1,
    type: "service",
  },
  {
    id: 2,
    description: "Brake Pad Replacement (Front)",
    price: 220,
    laborHours: 2,
    type: "service",
  },
  {
    id: 3,
    description: "Tire Rotation",
    price: 25,
    laborHours: 0.5,
    type: "service",
  },
  {
    id: 4,
    description: "Engine Diagnostic",
    price: 120,
    laborHours: 1,
    type: "service",
  },
  {
    id: 5,
    description: "Air Filter Replacement",
    price: 35,
    laborHours: 0.3,
    type: "service",
  },
  {
    id: 6,
    description: "A/C System Service",
    price: 150,
    laborHours: 1.5,
    type: "service",
  },
  {
    id: 7,
    description: "Coolant Flush",
    price: 110,
    laborHours: 1,
    type: "service",
  },
  {
    id: 8,
    description: "Transmission Service",
    price: 189.95,
    laborHours: 2,
    type: "service",
  },
  {
    id: 9,
    description: "Wheel Alignment",
    price: 99.95,
    laborHours: 1,
    type: "service",
  },
  {
    id: 10,
    description: "Battery Replacement",
    price: 175,
    laborHours: 0.5,
    type: "service",
  },
];

const partItems = [
  { id: 101, description: "Synthetic Oil (5 Quarts)", price: 45, type: "part" },
  { id: 102, description: "Oil Filter", price: 12.95, type: "part" },
  { id: 103, description: "Air Filter", price: 24.99, type: "part" },
  { id: 104, description: "Cabin Air Filter", price: 29.99, type: "part" },
  { id: 105, description: "Brake Pads (Front)", price: 89.95, type: "part" },
  { id: 106, description: "Wiper Blades (Pair)", price: 39.95, type: "part" },
  { id: 107, description: "Battery", price: 129.95, type: "part" },
  {
    id: 108,
    description: "Spark Plugs (Set of 4)",
    price: 32.95,
    type: "part",
  },
  {
    id: 109,
    description: "Headlight Bulbs (Pair)",
    price: 25.99,
    type: "part",
  },
  { id: 110, description: "Serpentine Belt", price: 45.95, type: "part" },
  { id: 111, description: "Coolant (1 Gallon)", price: 19.95, type: "part" },
  { id: 112, description: "Transmission Fluid", price: 18.95, type: "part" },
];

// Add this function at the top level, before the Invoices component
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${random}`;
};

const Invoices = () => {
  const location = useLocation();
  const history = useHistory();
  const { token } = useContext(UserContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [clientRepairHistory, setClientRepairHistory] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([
    ...serviceItems,
    ...partItems,
  ]);
  const [setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    status: "draft",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    customerInfo: {
      id: null,
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    vehicleInfo: {
      id: null,
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      vin: "",
      odometer: "",
    },
    items: [
      {
        id: 1,
        type: "service",
        description: "",
        quantity: 1,
        unitPrice: 0,
        laborHours: 0,
        laborRate: 85,
        taxable: true,
      },
    ],
    notes: "",
    terms:
      "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
    taxRate: 7.5,
    paymentMethod: "",
    paymentDate: null,
    mechanicNotes: "",
    relatedClientId: null,
    relatedRepairId: null,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [clientLookupOpen, setClientLookupOpen] = useState(false);
  const [anchorElItem, setAnchorElItem] = useState(null);

  const [activeTab, setActiveTab] = useState("all");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: "cash",
    amount: 0,
    reference: "",
    date: new Date(),
  });

  useEffect(() => {
    // Check if there's a request to create from client
    if (location.state && location.state.createFromClient) {
      const clientId = location.state.createFromClient;
      createInvoiceFromClient(clientId);

      // Clear the location state so it doesn't trigger again on refresh
      history.replace(location.pathname, { replace: true, state: {} });
    }
  }, [location, history]);

  // Update the handleClientSelect function
  const handleClientSelect = async (selected) => {
    try {
      if (!selected) {
        setSelectedClient(null);
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            id: null,
            name: "",
            email: "",
            phone: "",
            address: "",
          },
          vehicleInfo: {
            id: null,
            make: "",
            model: "",
            year: "",
            licensePlate: "",
            vin: "",
            odometer: "",
          },
          relatedClientId: null
        }));
        return;
      }

      const clientId = selected.value;
      const clientResponse = await clientsAPI.getById(clientId);
      const client = clientResponse.data;

      if (!client) {
        toast.error("Client not found");
        return;
      }

      // Update form data with client information
      setFormData(prev => ({
        ...prev,
        customerInfo: {
          id: client._id || client.id,
          name: client.clientName || client.name,
          email: client.email || "",
          phone: client.phoneNumber || client.phone || "",
          address: client.address || ""
        },
        vehicleInfo: {
          id: client.carDetails?._id || client.carDetails?.id,
          make: client.carDetails?.make || "",
          model: client.carDetails?.model || "",
          year: client.carDetails?.year || "",
          licensePlate: client.carDetails?.licensePlate || "",
          vin: client.carDetails?.vin || "",
          odometer: client.carDetails?.odometer || ""
        },
        relatedClientId: client._id || client.id
      }));

      setSelectedClient(selected);

      // Only try to fetch repair history if the client has an ID
      if (client._id || client.id) {
        try {
          await fetchClientRepairHistory(client._id || client.id);
        } catch (error) {
          console.error("Error fetching repair history:", error);
          // Don't show error to user as it's not critical for invoice creation
          setClientRepairHistory([]);
        }
      }

    } catch (error) {
      console.error("Error selecting client:", error);
      toast.error("Failed to load client details");
    }
  };

  // Update the createInvoiceFromClient function
  const createInvoiceFromClient = async (clientId) => {
    try {
      setIsLoading(true);
      
      // Fetch client data directly from API
      const clientResponse = await clientsAPI.getById(clientId);
      const client = clientResponse.data;

      if (!client) {
        toast.error("Client not found");
        return;
      }

      // Generate new invoice number
      const newInvoiceNumber = generateInvoiceNumber();

      // Create invoice data with proper validation
      const invoiceData = {
        invoiceNumber: newInvoiceNumber,
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        customerInfo: {
          id: client._id || client.id,
          name: client.clientName || client.name,
          email: client.email || "",
          phone: client.phoneNumber || client.phone || "",
          address: client.address || ""
        },
        vehicleInfo: {
          id: client.carDetails?._id || client.carDetails?.id,
          make: client.carDetails?.make || "",
          model: client.carDetails?.model || "",
          year: client.carDetails?.year || "",
          licensePlate: client.carDetails?.licensePlate || "",
          vin: client.carDetails?.vin || "",
          odometer: client.carDetails?.odometer || ""
        },
        items: [
          {
            id: Date.now(),
            type: "service",
            description: "Auto repair service",
            quantity: 1,
            unitPrice: 0,
            laborHours: 0,
            laborRate: 85,
            taxable: true
          }
        ],
        notes: `Invoice for repair service for ${client.clientName || client.name}`,
        terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
        taxRate: 7.5,
        paymentMethod: "",
        paymentDate: null,
        mechanicNotes: "",
        relatedClientId: client._id || client.id
      };

      // Set form data and open form
      setFormData(invoiceData);
      setSelectedClient({
        value: client._id || client.id,
        label: `${client.clientName || client.name} - ${client.phoneNumber || client.phone || 'No Phone'}`
      });
      setFormOpen(true);
      setEditMode(false);

      toast.success("Invoice form created successfully");
    } catch (error) {
      console.error("Error creating invoice from client:", error);
      toast.error(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  // Performance optimizations
  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  const debouncedItemSearch = useCallback(
    debounce((term) => {
      setItemSearchTerm(term);
      const filtered = [...serviceItems, ...partItems].filter(item =>
        item.description.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredItems(filtered);
    }, 300),
    []
  );

  // Memoize expensive computations
  const calculateTotals = useMemo(() => {
    return formData.items.reduce(
      (acc, item) => {
        const amount = (item.quantity * item.unitPrice) + 
          ((item.laborHours || 0) * (item.laborRate || 0));
        const subtotal = acc.subtotal + amount;
        return {
          subtotal,
          tax: subtotal * (formData.taxRate / 100),
          total: subtotal * (1 + formData.taxRate / 100)
        };
      },
      { subtotal: 0, tax: 0, total: 0 }
    );
  }, [formData.items, formData.taxRate]);

  // Optimize data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesRes, clientsRes] = await Promise.all([
          invoicesAPI.getAll(),
          clientsAPI.getAll()
        ]);
        setInvoices(invoicesRes.data);
        setFilteredInvoices(invoicesRes.data);
        setClients(clientsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Optimize filtering
  useEffect(() => {
    const filtered = invoices.filter(invoice => {
      const matchesSearch = searchTerm === "" || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || invoice.status === statusFilter.value;
      
      const matchesDate = (!startDate || !endDate) || 
        (new Date(invoice.issueDate) >= startDate && 
         new Date(invoice.issueDate) <= endDate);

      return matchesSearch && matchesStatus && matchesDate;
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, startDate, endDate]);

  // Add missing function definitions
  const fetchClientRepairHistory = async (clientId) => {
    try {
      const response = await clientsAPI.getRepairHistory(clientId);
      const history = response.data.map(repair => ({
        ...repair,
        date: repair.date || repair.createdAt || repair.updatedAt,
        formattedDate: format(new Date(repair.date || repair.createdAt || repair.updatedAt), 'MMM dd, yyyy'),
        status: repair.status || 'completed',
        total: repair.total || 0
      }));
      setClientRepairHistory(history);
    } catch (error) {
      console.error('Error fetching repair history:', error);
      // Don't show error to user as it's not critical for invoice creation
      setClientRepairHistory([]);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.customerInfo.name) {
        toast.error('Customer name is required');
        return;
      }
      if (!formData.items.length) {
        toast.error('At least one item is required');
        return;
      }

      // Validate items
      const invalidItems = formData.items.filter(item => 
        !item.description || item.quantity <= 0 || item.unitPrice < 0 ||
        (item.type === 'service' && (item.laborHours < 0 || item.laborRate < 0))
      );

      if (invalidItems.length > 0) {
        toast.error('Please check all items have valid quantities and prices');
        return;
      }

      // Calculate totals
      const totals = calculateTotals;
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        // Ensure dates are in ISO format
        issueDate: formData.issueDate.toISOString(),
        dueDate: formData.dueDate.toISOString(),
        // Ensure all items have required fields
        items: formData.items.map(item => ({
          ...item,
          type: item.type || 'service',
          taxable: item.taxable !== false,
          laborHours: item.type === 'service' ? (item.laborHours || 0) : 0,
          laborRate: item.type === 'service' ? (item.laborRate || 85) : 0
        }))
      };

      let response;
      if (editMode) {
        // Update existing invoice
        response = await invoicesAPI.update(formData._id, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice
        response = await invoicesAPI.create(invoiceData);
        toast.success('Invoice created successfully');
      }

      // Refresh invoice list
      const invoicesResponse = await invoicesAPI.getAll();
      setInvoices(invoicesResponse.data);
      setFilteredInvoices(invoicesResponse.data);
      
      // Notify other components
      const updateEvent = new CustomEvent('invoice-updated', {
        detail: {
          invoiceId: response.data._id,
          action: editMode ? 'invoice-updated' : 'invoice-created',
          timestamp: new Date().getTime()
        }
      });
      window.dispatchEvent(updateEvent);
      
      // Close form and reset state
      setFormOpen(false);
      setEditMode(false);
      setFormData({
        invoiceNumber: "",
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        customerInfo: {
          id: null,
          name: "",
          email: "",
          phone: "",
          address: "",
        },
        vehicleInfo: {
          id: null,
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          vin: "",
          odometer: "",
        },
        items: [
          {
            id: Date.now(),
            type: "service",
            description: "",
            quantity: 1,
            unitPrice: 0,
            laborHours: 0,
            laborRate: 85,
            taxable: true,
          },
        ],
        notes: "",
        terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
        taxRate: 7.5,
        paymentMethod: "",
        paymentDate: null,
        mechanicNotes: "",
        relatedClientId: null,
        relatedRepairId: null,
      });

      // If created from client, update client's status
      if (invoiceData.relatedClientId) {
        try {
          await clientsAPI.updateStatus(invoiceData.relatedClientId, 'invoiced');
          // Notify other components
          const updateEvent = new CustomEvent('client-updated', {
            detail: {
              clientId: invoiceData.relatedClientId,
              action: 'invoice-created',
              invoiceId: response.data._id,
              timestamp: new Date().getTime()
            }
          });
          window.dispatchEvent(updateEvent);
        } catch (error) {
          console.error('Error updating client status:', error);
          // Don't show error to user as invoice was created successfully
        }
      }

    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!invoiceToDelete?._id) {
        toast.error('Invalid invoice');
        return;
      }
  
      await invoicesAPI.delete(invoiceToDelete._id);
      toast.success('Invoice deleted successfully');

      // Refresh invoice list
      const response = await invoicesAPI.getAll();
      setInvoices(response.data);
      setFilteredInvoices(response.data);

      // Notify other components
      const updateEvent = new CustomEvent('invoice-updated', {
        detail: {
          invoiceId: invoiceToDelete._id,
          action: 'invoice-deleted',
          timestamp: new Date().getTime()
        }
      });
      window.dispatchEvent(updateEvent);

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      console.log('Starting PDF download for invoice:', invoiceId);
      
      // Show loading state
      toast.info('Generating PDF...', { autoClose: false, toastId: 'pdf-loading' });
      
      const response = await invoicesAPI.getPDF(invoiceId);
      
      // Log response details
      console.log('PDF Response:', {
        status: response.status,
        headers: response.headers,
        dataSize: response.data?.size,
        contentType: response.headers['content-type']
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF data');
      }

      // Updated content type validation to handle PDF with charset
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.toLowerCase().includes('application/pdf')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      if (blob.size === 0) {
        throw new Error('Generated PDF blob is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Dismiss loading toast and show success
      toast.dismiss('pdf-loading');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Dismiss loading toast
      toast.dismiss('pdf-loading');
      
      // Show specific error message
      if (error.response?.status === 404) {
        toast.error('Invoice PDF not found');
      } else if (error.response?.status === 500) {
        toast.error('Server error while generating PDF');
      } else if (error.message.includes('content type')) {
        toast.error('Invalid PDF format received');
      } else if (error.message.includes('empty')) {
        toast.error('Generated PDF is empty');
      } else {
        toast.error(error.response?.data?.message || 'Failed to download PDF');
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setIsProcessingPayment(true);
      const response = await invoicesAPI.processPayment(selectedInvoice._id, {
        amount: selectedInvoice.total,
        method: paymentDetails.method,
        reference: paymentDetails.reference,
        date: new Date().toISOString()
      });

      if (!response.data) {
        throw new Error('Failed to process payment');
      }

      const updatedInvoice = response.data;
      
      // Update local state
      setInvoices(invoices.map(inv => 
        inv._id === updatedInvoice._id ? updatedInvoice : inv
      ));
      setFilteredInvoices(filteredInvoices.map(inv => 
        inv._id === updatedInvoice._id ? updatedInvoice : inv
      ));

      // Notify other components
      const updateEvent = new CustomEvent('invoice-updated', {
        detail: {
          invoiceId: updatedInvoice._id,
          action: 'payment-processed',
          amount: selectedInvoice.total,
          method: paymentDetails.method,
          timestamp: new Date().getTime()
        }
      });
      window.dispatchEvent(updateEvent);

      // Close dialog and reset state
      setPaymentDialogOpen(false);
      setPaymentDetails({
        method: "cash",
        amount: 0,
        reference: "",
        date: new Date(),
      });
      setSelectedInvoice(null);
      toast.success('Payment processed successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Add preview content
  const renderPreviewContent = (invoice) => {
    if (!invoice) return null;

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Invoice #{invoice.invoiceNumber}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Status: <Chip 
                label={invoice.status} 
                color={
                  invoice.status === 'paid' ? 'success' :
                  invoice.status === 'overdue' ? 'error' :
                  invoice.status === 'pending' ? 'warning' :
                  'default'
                }
                size="small"
              />
            </Typography>
          </Grid>

          {/* Customer Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <Typography>Name: {invoice.customerInfo.name}</Typography>
            {invoice.customerInfo.email && <Typography>Email: {invoice.customerInfo.email}</Typography>}
            {invoice.customerInfo.phone && <Typography>Phone: {invoice.customerInfo.phone}</Typography>}
            {invoice.customerInfo.address && <Typography>Address: {invoice.customerInfo.address}</Typography>}
          </Grid>

          {/* Vehicle Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
            {invoice.vehicleInfo.make && <Typography>Make: {invoice.vehicleInfo.make}</Typography>}
            {invoice.vehicleInfo.model && <Typography>Model: {invoice.vehicleInfo.model}</Typography>}
            {invoice.vehicleInfo.year && <Typography>Year: {invoice.vehicleInfo.year}</Typography>}
            {invoice.vehicleInfo.licensePlate && <Typography>License Plate: {invoice.vehicleInfo.licensePlate}</Typography>}
            {invoice.vehicleInfo.vin && <Typography>VIN: {invoice.vehicleInfo.vin}</Typography>}
            {invoice.vehicleInfo.odometer && <Typography>Odometer: {invoice.vehicleInfo.odometer}</Typography>}
          </Grid>

          {/* Items */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Items & Services</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    {invoice.items.some(item => item.type === 'service') && (
                      <>
                        <TableCell align="right">Labor Hours</TableCell>
                        <TableCell align="right">Labor Rate</TableCell>
                      </>
                    )}
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                      {invoice.items.some(i => i.type === 'service') && (
                        <>
                          <TableCell align="right">{item.type === 'service' ? item.laborHours : '-'}</TableCell>
                          <TableCell align="right">{item.type === 'service' ? `$${item.laborRate.toFixed(2)}` : '-'}</TableCell>
                        </>
                      )}
                      <TableCell align="right">
                        ${((item.quantity * item.unitPrice) + 
                          (item.type === 'service' ? (item.laborHours * item.laborRate) : 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Box>
                <Typography variant="subtitle1">
                  Subtotal: ${invoice.subtotal.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1">
                  Tax ({invoice.taxRate}%): ${invoice.tax.toFixed(2)}
                </Typography>
                <Typography variant="h6">
                  Total: ${invoice.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Notes */}
          {invoice.notes && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <Typography>{invoice.notes}</Typography>
            </Grid>
          )}

          {/* Terms */}
          {invoice.terms && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
              <Typography>{invoice.terms}</Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

    return (
      <>
        <Box 
          sx={{ 
            p: 3,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 }
          }}
        >
          {/* Header Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              flexShrink: 0,
              mb: { xs: 2, md: 3 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main', 
                  mr: 2,
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 }
                }}
              >
                <DollarSign size={24} />
              </Avatar>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                }}
              >
                Invoices
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={() => {
                setFormOpen(true);
                setEditMode(false);
                setFormData({
                  invoiceNumber: generateInvoiceNumber(),
                  status: "draft",
                  issueDate: new Date(),
                  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                  customerInfo: {
                    id: null,
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                  },
                  vehicleInfo: {
                    id: null,
                    make: "",
                    model: "",
                    year: "",
                    licensePlate: "",
                    vin: "",
                    odometer: "",
                  },
                  items: [
                    {
                      id: Date.now(),
                      type: "service",
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      laborHours: 0,
                      laborRate: 85,
                      taxable: true,
                    },
                  ],
                  notes: "",
                  terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
                  taxRate: 7.5,
                  paymentMethod: "",
                  paymentDate: null,
                  mechanicNotes: "",
                  relatedClientId: null,
                  relatedRepairId: null,
                });
                setSelectedClient(null);
              }}
              sx={{
                whiteSpace: 'nowrap',
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              New Invoice
            </Button>
          </Box>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            {/* Filters and Search */}
            <Card 
              sx={{ 
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: 2,
                boxShadow: 2,
                borderLeft: '4px solid',
                borderColor: 'primary.main'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={invoiceStatusOptions}
                    placeholder="Filter by status"
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '40px'
                      })
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <DatePicker
                    selected={startDate}
                    onChange={(dates) => setDateRange(dates)}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    placeholderText="Filter by date range"
                    className="form-control"
                    customInput={
                      <TextField 
                        fullWidth 
                        size="small"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Calendar size={20} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    }
                  />
                </Grid>
              </Grid>
            </Card>

            {/* Table Section */}
            <Card 
              sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: 2,
                borderLeft: '4px solid',
                borderColor: 'info.main',
                overflow: 'hidden'
              }}
            >
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice._id}
                        hover
                        sx={{ 
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerInfo.name}</TableCell>
                        <TableCell>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${invoice.total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={
                              invoice.status === 'paid' ? 'success' :
                              invoice.status === 'overdue' ? 'error' :
                              invoice.status === 'pending' ? 'warning' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setFormData(invoice);
                                  setEditMode(true);
                                  setFormOpen(true);
                                }}
                              >
                                <Edit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setInvoiceToDelete(invoice);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadPDF(invoice._id)}
                              >
                                <Download size={16} />
                              </IconButton>
                            </Tooltip>
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <Tooltip title="Process Payment">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentDetails({
                                      method: "cash",
                                      amount: invoice.total || 0,
                                      reference: "",
                                      date: new Date(),
                                    });
                                    setPaymentDialogOpen(true);
                                  }}
                                >
                                  <DollarSign size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Box>

        {/* Invoice Form Dialog */}
        <Dialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editMode ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Invoice Header */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Invoice Number"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData({
                            ...formData,
                            invoiceNumber: e.target.value
                          })}
                          disabled={editMode}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          selected={formData.issueDate}
                          onChange={(date) => setFormData({
                            ...formData,
                            issueDate: date
                          })}
                          className="form-control"
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Issue Date"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          selected={formData.dueDate}
                          onChange={(date) => setFormData({
                            ...formData,
                            dueDate: date
                          })}
                          className="form-control"
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Due Date"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Customer & Vehicle Information */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Customer & Vehicle Information
                    </Typography>
                    <Grid container spacing={2}>
                      {/* Client Selection */}
                      <Grid item xs={12}>
                        <Select
                          value={selectedClient}
                          onChange={handleClientSelect}
                          options={clients.map(client => ({
                            value: client._id || client.id,
                            label: `${client.clientName || client.name} - ${client.phoneNumber || client.phone || 'No Phone'}`
                          }))}
                          placeholder="Select Existing Client"
                          isClearable
                          isSearchable
                          styles={{
                            menu: (provided) => ({
                              ...provided,
                              zIndex: 9999
                            })
                          }}
                        />
                      </Grid>
                      
                      {/* Customer Info */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Name"
                          value={formData.customerInfo.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerInfo: {
                              ...formData.customerInfo,
                              name: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={formData.customerInfo.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerInfo: {
                              ...formData.customerInfo,
                              email: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={formData.customerInfo.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerInfo: {
                              ...formData.customerInfo,
                              phone: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Address"
                          value={formData.customerInfo.address}
                          onChange={(e) => setFormData({
                            ...formData,
                            customerInfo: {
                              ...formData.customerInfo,
                              address: e.target.value
                            }
                          })}
                        />
                      </Grid>

                      {/* Vehicle Info */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Make"
                          value={formData.vehicleInfo.make}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              make: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Model"
                          value={formData.vehicleInfo.model}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              model: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Year"
                          value={formData.vehicleInfo.year}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              year: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="License Plate"
                          value={formData.vehicleInfo.licensePlate}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              licensePlate: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="VIN"
                          value={formData.vehicleInfo.vin}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              vin: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Odometer"
                          value={formData.vehicleInfo.odometer}
                          onChange={(e) => setFormData({
                            ...formData,
                            vehicleInfo: {
                              ...formData.vehicleInfo,
                              odometer: e.target.value
                            }
                          })}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Items & Services */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Items & Services
                    </Typography>
                    <Grid container spacing={2}>
                      {/* Item Search */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          placeholder="Search items..."
                          value={itemSearchTerm}
                          onChange={(e) => debouncedItemSearch(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Items List */}
                      {formData.items.map((item, index) => (
                        <Grid item xs={12} key={item.id}>
                          <Card variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={4}>
                                <Select
                                  value={item}
                                  onChange={(selected) => {
                                    const newItems = [...formData.items];
                                    newItems[index] = {
                                      ...selected,
                                      quantity: item.quantity,
                                      laborHours: selected.laborHours || 0,
                                      laborRate: selected.laborRate || 85,
                                      taxable: true
                                    };
                                    setFormData({
                                      ...formData,
                                      items: newItems
                                    });
                                  }}
                                  options={filteredItems}
                                  getOptionLabel={(option) => option.description}
                                  getOptionValue={(option) => option.id}
                                  placeholder="Select Item"
                                  isSearchable
                                />
                              </Grid>
                              <Grid item xs={12} md={2}>
                                <TextField
                                  fullWidth
                                  label="Quantity"
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...formData.items];
                                    newItems[index] = {
                                      ...item,
                                      quantity: parseInt(e.target.value) || 0
                                    };
                                    setFormData({
                                      ...formData,
                                      items: newItems
                                    });
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} md={2}>
                                <TextField
                                  fullWidth
                                  label="Unit Price"
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const newItems = [...formData.items];
                                    newItems[index] = {
                                      ...item,
                                      unitPrice: parseFloat(e.target.value) || 0
                                    };
                                    setFormData({
                                      ...formData,
                                      items: newItems
                                    });
                                  }}
                                />
                              </Grid>
                              {item.type === 'service' && (
                                <>
                                  <Grid item xs={12} md={2}>
                                    <TextField
                                      fullWidth
                                      label="Labor Hours"
                                      type="number"
                                      value={item.laborHours}
                                      onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index] = {
                                          ...item,
                                          laborHours: parseFloat(e.target.value) || 0
                                        };
                                        setFormData({
                                          ...formData,
                                          items: newItems
                                        });
                                      }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} md={2}>
                                    <TextField
                                      fullWidth
                                      label="Labor Rate"
                                      type="number"
                                      value={item.laborRate}
                                      onChange={(e) => {
                                        const newItems = [...formData.items];
                                        newItems[index] = {
                                          ...item,
                                          laborRate: parseFloat(e.target.value) || 0
                                        };
                                        setFormData({
                                          ...formData,
                                          items: newItems
                                        });
                                      }}
                                    />
                                  </Grid>
                                </>
                              )}
                              <Grid item xs={12} md={12}>
                                <Box display="flex" justifyContent="flex-end">
                                  <Button
                                    color="error"
                                    startIcon={<Trash2 />}
                                    onClick={() => {
                                      const newItems = formData.items.filter((_, i) => i !== index);
                                      setFormData({
                                        ...formData,
                                        items: newItems
                                      });
                                    }}
                                  >
                                    Remove Item
                                  </Button>
                                </Box>
                              </Grid>
                            </Grid>
                          </Card>
                        </Grid>
                      ))}

                      {/* Add Item Button */}
                      <Grid item xs={12}>
                        <Button
                          startIcon={<Plus />}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              items: [
                                ...formData.items,
                                {
                                  id: Date.now(),
                                  type: "service",
                                  description: "",
                                  quantity: 1,
                                  unitPrice: 0,
                                  laborHours: 0,
                                  laborRate: 85,
                                  taxable: true
                                }
                              ]
                            });
                          }}
                        >
                          Add Item
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Payment & Notes */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Payment & Notes
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Notes"
                          multiline
                          rows={4}
                          value={formData.notes}
                          onChange={(e) => setFormData({
                            ...formData,
                            notes: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Mechanic Notes"
                          multiline
                          rows={4}
                          value={formData.mechanicNotes}
                          onChange={(e) => setFormData({
                            ...formData,
                            mechanicNotes: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Terms & Conditions"
                          multiline
                          rows={4}
                          value={formData.terms}
                          onChange={(e) => setFormData({
                            ...formData,
                            terms: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Tax Rate (%)"
                          type="number"
                          value={formData.taxRate}
                          onChange={(e) => setFormData({
                            ...formData,
                            taxRate: parseFloat(e.target.value) || 0
                          })}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Summary */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1">
                          Subtotal: ${calculateTotals.subtotal.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1">
                          Tax: ${calculateTotals.tax.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6">
                          Total: ${calculateTotals.total.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Invoice Status */}
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Invoice Status
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <FormLabel>Status</FormLabel>
                          <RadioGroup
                            row
                            value={formData.status}
                            onChange={(e) => setFormData({
                              ...formData,
                              status: e.target.value
                            })}
                          >
                            <FormControlLabel 
                              value="draft" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Clock size={16} style={{ marginRight: 8 }} />
                                  Draft
                                </Box>
                              } 
                            />
                            <FormControlLabel 
                              value="pending" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AlertTriangle size={16} style={{ marginRight: 8 }} />
                                  Pending
                                </Box>
                              } 
                            />
                            <FormControlLabel 
                              value="paid" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CheckCircle size={16} style={{ marginRight: 8 }} />
                                  Paid
                                </Box>
                              } 
                            />
                            <FormControlLabel 
                              value="overdue" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <XCircle size={16} style={{ marginRight: 8 }} />
                                  Overdue
                                </Box>
                              } 
                            />
                            <FormControlLabel 
                              value="cancelled" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <X size={16} style={{ marginRight: 8 }} />
                                  Cancelled
                                </Box>
                              } 
                            />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                      {formData.status === 'paid' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Payment Method"
                            select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({
                              ...formData,
                              paymentMethod: e.target.value
                            })}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      )}
                      {formData.status === 'paid' && (
                        <Grid item xs={12}>
                          <DatePicker
                            selected={formData.paymentDate}
                            onChange={(date) => setFormData({
                              ...formData,
                              paymentDate: date
                            })}
                            dateFormat="MMM dd, yyyy"
                            placeholderText="Payment Date"
                            customInput={
                              <TextField
                                fullWidth
                                label="Payment Date"
                              />
                            }
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
                  Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}?
                  This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
                  onClick={handleDelete}
              color="error"
                  variant="contained"
            >
                  Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogContent>
            {selectedInvoice && renderPreviewContent(selectedInvoice)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleDownloadPDF(selectedInvoice?._id)}
              startIcon={<Download size={16} />}
            >
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Mark Invoice as Paid</DialogTitle>
          <DialogContent>
            <Box p={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Invoice #{selectedInvoice?.invoiceNumber}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Amount: ${selectedInvoice?.total?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <FormLabel>Payment Method</FormLabel>
                    <RadioGroup
                      value={paymentDetails.method}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        method: e.target.value
                      })}
                    >
                      <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                      <FormControlLabel value="credit_card" control={<Radio />} label="Credit Card" />
                      <FormControlLabel value="bank_transfer" control={<Radio />} label="Bank Transfer" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reference Number (Optional)"
                    value={paymentDetails.reference}
                    onChange={(e) => setPaymentDetails({
                      ...paymentDetails,
                      reference: e.target.value
                    })}
                    placeholder="Enter check number, transaction ID, etc."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handlePaymentSubmit}
              disabled={isProcessingPayment}
              startIcon={<CheckCircle />}
            >
              {isProcessingPayment ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

export default Invoices;
