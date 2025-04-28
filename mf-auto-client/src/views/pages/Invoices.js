import React, { useState, useEffect, useContext } from "react";
import { invoicesAPI, clientsAPI } from "../../api";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
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
  Truck,
  Tool,
  Link,
  ExternalLink,
  CornerDownRight,
  Copy,
  Save,
  MessageSquare,
  AlertCircle,
  User,
  X
} from "react-feather";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardHeader,
  CardContent,
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
  FormLabel,
  RadioGroup,
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
  Autocomplete,
  Popover,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  Snackbar
} from "@mui/material";
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const invoiceStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" }
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "mobile_payment", label: "Mobile Payment" }
];

const serviceItems = [
  { id: 1, description: "Oil Change - Synthetic", price: 79.95, laborHours: 1, type: "service" },
  { id: 2, description: "Brake Pad Replacement (Front)", price: 220, laborHours: 2, type: "service" },
  { id: 3, description: "Tire Rotation", price: 25, laborHours: 0.5, type: "service" },
  { id: 4, description: "Engine Diagnostic", price: 120, laborHours: 1, type: "service" },
  { id: 5, description: "Air Filter Replacement", price: 35, laborHours: 0.3, type: "service" },
  { id: 6, description: "A/C System Service", price: 150, laborHours: 1.5, type: "service" },
  { id: 7, description: "Coolant Flush", price: 110, laborHours: 1, type: "service" },
  { id: 8, description: "Transmission Service", price: 189.95, laborHours: 2, type: "service" },
  { id: 9, description: "Wheel Alignment", price: 99.95, laborHours: 1, type: "service" },
  { id: 10, description: "Battery Replacement", price: 175, laborHours: 0.5, type: "service" }
];

const partItems = [
  { id: 101, description: "Synthetic Oil (5 Quarts)", price: 45, type: "part" },
  { id: 102, description: "Oil Filter", price: 12.95, type: "part" },
  { id: 103, description: "Air Filter", price: 24.99, type: "part" },
  { id: 104, description: "Cabin Air Filter", price: 29.99, type: "part" },
  { id: 105, description: "Brake Pads (Front)", price: 89.95, type: "part" },
  { id: 106, description: "Wiper Blades (Pair)", price: 39.95, type: "part" },
  { id: 107, description: "Battery", price: 129.95, type: "part" },
  { id: 108, description: "Spark Plugs (Set of 4)", price: 32.95, type: "part" },
  { id: 109, description: "Headlight Bulbs (Pair)", price: 25.99, type: "part" },
  { id: 110, description: "Serpentine Belt", price: 45.95, type: "part" },
  { id: 111, description: "Coolant (1 Gallon)", price: 19.95, type: "part" },
  { id: 112, description: "Transmission Fluid", price: 18.95, type: "part" }
];

const Invoices = () => {
  const { token, userRole } = useContext(UserContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [filteredItems, setFilteredItems] = useState([...serviceItems, ...partItems]);

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
      address: ""
    },
    vehicleInfo: {
      id: null,
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      vin: "",
      odometer: ""
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
        taxable: true
      }
    ],
    notes: "",
    terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
    taxRate: 7.5,
    paymentMethod: "",
    paymentDate: null,
    mechanicNotes: "",
    relatedClientId: null,
    relatedRepairId: null
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [clientLookupOpen, setClientLookupOpen] = useState(false);
  const [anchorElItem, setAnchorElItem] = useState(null);

  const [activeTab, setActiveTab] = useState('all');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'cash',
    amount: 0,
    reference: '',
    date: new Date()
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch invoices and clients in parallel
        const [invoicesResponse, clientsResponse] = await Promise.all([
          invoicesAPI.getAll(),
          clientsAPI.getAll()
        ]);
        
        setInvoices(invoicesResponse.data);
        setFilteredInvoices(invoicesResponse.data);
        setClients(clientsResponse.data);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (token) {
      loadData();
    }
  }, [token]);

  const fetchInvoices = async () => {
    const generateSampleData = () => {
      const carMakes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Audi", "Mercedes"];
      const carModels = {
        "Toyota": ["Camry", "Corolla", "RAV4", "Highlander"],
        "Honda": ["Accord", "Civic", "CR-V", "Pilot"],
        "Ford": ["F-150", "Escape", "Explorer", "Mustang"],
        "Chevrolet": ["Silverado", "Equinox", "Malibu", "Tahoe"],
        "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"],
        "BMW": ["3 Series", "5 Series", "X3", "X5"],
        "Audi": ["A4", "A6", "Q5", "Q7"],
        "Mercedes": ["C-Class", "E-Class", "GLC", "GLE"]
      };

      const customerNames = [
        "John Smith", "Mary Johnson", "David Williams", "Sarah Brown", 
        "Michael Davis", "Jennifer Miller", "Robert Wilson", "Jessica Moore"
      ];

      const statuses = ["draft", "pending", "paid", "overdue", "cancelled"];
      const statusProbability = [0.1, 0.3, 0.4, 0.15, 0.05];

      const getRandomStatus = () => {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < statusProbability.length; i++) {
          cumulative += statusProbability[i];
          if (rand < cumulative) return statuses[i];
        }
        return statuses[0];
      };

      const getRandomItems = (count) => {
        const items = [];
        const availableItems = [...serviceItems, ...partItems];
        const itemCount = Math.min(count, availableItems.length);
        const selectedIndices = new Set();
        
        while (selectedIndices.size < itemCount) {
          selectedIndices.add(Math.floor(Math.random() * availableItems.length));
        }

        [...selectedIndices].forEach(index => {
          const sourceItem = availableItems[index];
          items.push({
            ...sourceItem,
            quantity: sourceItem.type === "service" ? 1 : Math.floor(Math.random() * 3) + 1,
            taxable: Math.random() > 0.2
          });
        });

        return items;
      };

      const calculateInvoiceTotal = (items, taxRate) => {
        let subtotal = 0;
        let taxableAmount = 0;

        items.forEach(item => {
          const itemTotal = item.type === "service" 
            ? (item.laborHours * 85) + (item.quantity * item.price)
            : (item.quantity * item.price);

          subtotal += itemTotal;
          if (item.taxable) taxableAmount += itemTotal;
        });

        const tax = taxableAmount * (taxRate / 100);
        const total = subtotal + tax;

        return { subtotal, tax, total };
      };

      const mockInvoices = Array(30).fill().map((_, index) => {
        const issueDate = new Date(2025, Math.floor(Math.random() * 4), Math.floor(Math.random() * 28) + 1);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 15);

        const status = getRandomStatus();

        let paymentDate = null;
        if (status === "paid") {
          paymentDate = new Date(issueDate);
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 15) + 1);
        }

        const items = getRandomItems(Math.floor(Math.random() * 4) + 1);
        const taxRate = 7.5;
        const { subtotal, tax, total } = calculateInvoiceTotal(items, taxRate);

        const make = carMakes[Math.floor(Math.random() * carMakes.length)];
        const model = carModels[make][Math.floor(Math.random() * carModels[make].length)];
        const year = 2010 + Math.floor(Math.random() * 14);

        const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
        const customerEmail = customerName.replace(' ', '.').toLowerCase() + '@example.com';

        const clientId = Math.floor(Math.random() * 20) + 1;
        const relatedRepairId = Math.random() > 0.6 ? Math.floor(Math.random() * 30) + 1 : null;

        return {
          id: index + 1,
          invoiceNumber: `INV-${2025}-${1000 + index}`,
          status,
          issueDate,
          dueDate,
          customerInfo: {
            id: clientId,
            name: customerName,
            email: customerEmail,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            address: `${Math.floor(Math.random() * 1000) + 100} Main St, Anytown, ST ${Math.floor(Math.random() * 90000) + 10000}`
          },
          vehicleInfo: {
            id: clientId * 2,
            make,
            model,
            year,
            licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
            vin: `${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            odometer: Math.floor(Math.random() * 100000) + 10000
          },
          items,
          subtotal,
          tax,
          total,
          notes: Math.random() > 0.7 ? "Customer requested service by end of week." : "",
          terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
          taxRate,
          paymentMethod: status === "paid" ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)].value : "",
          paymentDate,
          createdBy: "admin",
          createdAt: issueDate,
          relatedClientId: clientId,
          relatedRepairId
        };
      });

      return mockInvoices;
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        const data = generateSampleData();
        setInvoices(data);
        setFilteredInvoices(data);
        resolve(data);
      }, 500);
    });
  };

  const fetchClients = async () => {
    const generateSampleClientData = () => {
      const carMakes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Audi", "Mercedes"];
      const carModels = {
        "Toyota": ["Camry", "Corolla", "RAV4", "Highlander"],
        "Honda": ["Accord", "Civic", "CR-V", "Pilot"],
        "Ford": ["F-150", "Escape", "Explorer", "Mustang"],
        "Chevrolet": ["Silverado", "Equinox", "Malibu", "Tahoe"],
        "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"],
        "BMW": ["3 Series", "5 Series", "X3", "X5"],
        "Audi": ["A4", "A6", "Q5", "Q7"],
        "Mercedes": ["C-Class", "E-Class", "GLC", "GLE"]
      };

      const clientNames = [
        "John Smith", "Mary Johnson", "David Williams", "Sarah Brown", 
        "Michael Davis", "Jennifer Miller", "Robert Wilson", "Jessica Moore",
        "James Anderson", "Patricia Thomas", "Richard Jackson", "Linda White",
        "Thomas Harris", "Elizabeth Martin", "Charles Thompson", "Susan Garcia",
        "Mark Rodriguez", "Donna Lewis", "Joseph Lee", "Helen Walker"
      ];

      return clientNames.map((name, index) => {
        const make = carMakes[Math.floor(Math.random() * carMakes.length)];
        const model = carModels[make][Math.floor(Math.random() * carModels[make].length)];
        const year = 2010 + Math.floor(Math.random() * 14);

        return {
          id: index + 1,
          clientName: name,
          phoneNumber: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: name.replace(' ', '.').toLowerCase() + '@example.com',
          carDetails: {
            id: (index + 1) * 2,
            make,
            model,
            year,
            licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
            color: ["Black", "White", "Silver", "Red", "Blue", "Gray"][Math.floor(Math.random() * 6)],
            vin: `${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          },
          repairCount: Math.floor(Math.random() * 5) + 1,
          lastVisit: new Date(2025, Math.floor(Math.random() * 4), Math.floor(Math.random() * 28) + 1)
        };
      });
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        const data = generateSampleClientData();
        setClients(data);
        resolve(data);
      }, 300);
    });
  };

  const fetchClientRepairHistory = async (clientId) => {
    try {
      const response = await clientsAPI.getHistory(clientId);
      setClientRepairHistory(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching client repair history:", error);
      toast.error("Failed to load client repair history");
      return [];
    }
  };

  useEffect(() => {
    let result = [...invoices];

    if (statusFilter) {
      result = result.filter(inv => inv.status === statusFilter.value);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(term) || 
        inv.customerInfo.name.toLowerCase().includes(term) ||
        (inv.vehicleInfo && inv.vehicleInfo.make && inv.vehicleInfo.make.toLowerCase().includes(term)) ||
        (inv.vehicleInfo && inv.vehicleInfo.model && inv.vehicleInfo.model.toLowerCase().includes(term)) ||
        (inv.vehicleInfo && inv.vehicleInfo.licensePlate && inv.vehicleInfo.licensePlate.toLowerCase().includes(term))
      );
    }

    if (startDate && endDate) {
      result = result.filter(inv => {
        const invDate = new Date(inv.issueDate);
        return invDate >= startDate && invDate <= endDate;
      });
    }

    setFilteredInvoices(result);
  }, [invoices, searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (!itemSearchTerm) {
      setFilteredItems([...serviceItems, ...partItems]);
      return;
    }

    const term = itemSearchTerm.toLowerCase();
    const filtered = [...serviceItems, ...partItems].filter(
      item => item.description.toLowerCase().includes(term)
    );

    setFilteredItems(filtered);
  }, [itemSearchTerm]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    if (newValue === 'all') {
      setStatusFilter(null);
    } else if (newValue === 'drafts') {
      setStatusFilter({ value: 'draft', label: 'Draft' });
    } else if (newValue === 'pending') {
      setStatusFilter({ value: 'pending', label: 'Pending' });
    } else if (newValue === 'paid') {
      setStatusFilter({ value: 'paid', label: 'Paid' });
    } else if (newValue === 'overdue') {
      setStatusFilter({ value: 'overdue', label: 'Overdue' });
    }
  };

  const openInvoiceForm = (invoice = null, clientId = null) => {
    if (invoice) {
      setEditMode(true);
      setSelectedInvoice(invoice);
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        customerInfo: { ...invoice.customerInfo },
        vehicleInfo: { ...invoice.vehicleInfo },
        items: [...invoice.items],
        notes: invoice.notes || "",
        terms: invoice.terms || "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
        taxRate: invoice.taxRate || 7.5,
        paymentMethod: invoice.paymentMethod || "",
        paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : null,
        mechanicNotes: invoice.mechanicNotes || "",
        relatedClientId: invoice.relatedClientId,
        relatedRepairId: invoice.relatedRepairId
      });
    } else {
      setEditMode(false);
      setSelectedInvoice(null);

      const lastInvoiceNumber = invoices.length > 0 
        ? invoices[0].invoiceNumber 
        : "INV-2025-1000";
      const lastNumber = parseInt(lastInvoiceNumber.split('-')[2]);
      const newInvoiceNumber = `INV-2025-${lastNumber + 1}`;

      let initialCustomerInfo = {
        id: null,
        name: "",
        email: "",
        phone: "",
        address: ""
      };

      let initialVehicleInfo = {
        id: null,
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        vin: "",
        odometer: ""
      };

      if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          initialCustomerInfo = {
            id: client.id,
            name: client.clientName,
            email: client.email || "",
            phone: client.phoneNumber || "",
            address: client.address || ""
          };

          initialVehicleInfo = {
            id: client.carDetails?.id,
            make: client.carDetails?.make || "",
            model: client.carDetails?.model || "",
            year: client.carDetails?.year || "",
            licensePlate: client.carDetails?.licensePlate || "",
            vin: client.carDetails?.vin || "",
            odometer: client.carDetails?.odometer || ""
          };
        }
      }

      setFormData({
        invoiceNumber: newInvoiceNumber,
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        customerInfo: initialCustomerInfo,
        vehicleInfo: initialVehicleInfo,
        items: [
          {
            id: 1,
            type: "service",
            description: "",
            quantity: 1,
            unitPrice: 0,
            laborHours: 0,
            laborRate: 85,
            taxable: true
          }
        ],
        notes: "",
        terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
        taxRate: 7.5,
        paymentMethod: "",
        paymentDate: null,
        mechanicNotes: "",
        relatedClientId: clientId || null,
        relatedRepairId: null
      });
    }
    setCurrentStep(0);
    setFormOpen(true);
  };

  const openInvoiceFromRepair = async (clientId, repairId) => {
    try {
      await fetchClientRepairHistory(clientId);
      const repairRecord = clientRepairHistory.find(r => r.id === repairId);
      if (!repairRecord) {
        toast.error("Repair record not found");
        return;
      }

      const client = clients.find(c => c.id === clientId);
      if (!client) {
        toast.error("Client record not found");
        return;
      }

      const lastInvoiceNumber = invoices.length > 0 
        ? invoices[0].invoiceNumber 
        : "INV-2025-1000";
      const lastNumber = parseInt(lastInvoiceNumber.split('-')[2]);
      const newInvoiceNumber = `INV-2025-${lastNumber + 1}`;

      const items = repairRecord.procedures.map((procedure, index) => {
        const matchingService = serviceItems.find(s => s.description.includes(procedure));

        return {
          id: index + 1,
          type: "service",
          description: procedure,
          quantity: 1,
          unitPrice: matchingService ? matchingService.price : repairRecord.total / repairRecord.procedures.length,
          laborHours: matchingService ? matchingService.laborHours : 1,
          laborRate: 85,
          taxable: true
        };
      });

      setFormData({
        invoiceNumber: newInvoiceNumber,
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        customerInfo: {
          id: client.id,
          name: client.clientName,
          email: client.email || "",
          phone: client.phoneNumber || "",
          address: client.address || ""
        },
        vehicleInfo: {
          id: repairRecord.vehicleInfo?.id,
          make: repairRecord.vehicleInfo?.make || "",
          model: repairRecord.vehicleInfo?.model || "",
          year: repairRecord.vehicleInfo?.year || "",
          licensePlate: repairRecord.vehicleInfo?.licensePlate || "",
          vin: repairRecord.vehicleInfo?.vin || "",
          odometer: repairRecord.vehicleInfo?.odometer || ""
        },
        items,
        notes: `Invoice for repair service completed on ${format(new Date(repairRecord.date), "MMMM d, yyyy")}`,
        terms: "Payment due within 15 days. Late payments subject to 1.5% monthly interest.",
        taxRate: 7.5,
        paymentMethod: "",
        paymentDate: null,
        mechanicNotes: repairRecord.notes || "",
        relatedClientId: clientId,
        relatedRepairId: repairId
      });

      setEditMode(false);
      setSelectedInvoice(null);
      setCurrentStep(0);
      setFormOpen(true);

      if (clientDetailsOpen) {
        setClientDetailsOpen(false);
      }

      setSnackbarMessage("Invoice created from repair record");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error creating invoice from repair:", error);
      toast.error("Failed to create invoice from repair record");
    }
  };

  const closeInvoiceForm = () => {
    setFormOpen(false);
  };

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  const addNewItem = () => {
    setFormData(prev => {
      const lastId = prev.items.length > 0 
        ? Math.max(...prev.items.map(item => item.id)) 
        : 0;

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: lastId + 1,
            type: "service",
            description: "",
            quantity: 1,
            unitPrice: 0,
            laborHours: 0,
            laborRate: 85,
            taxable: true
          }
        ]
      };
    });
  };

  const addPredefinedItem = (item) => {
    setFormData(prev => {
      const lastId = prev.items.length > 0 
        ? Math.max(...prev.items.map(item => item.id)) 
        : 0;

      const newItem = {
        id: lastId + 1,
        type: item.type,
        description: item.description,
        quantity: 1,
        unitPrice: item.price,
        laborHours: item.type === "service" ? item.laborHours : 0,
        laborRate: 85,
        taxable: true
      };

      return {
        ...prev,
        items: [...prev.items, newItem]
      };
    });

    setAnchorElItem(null);
    setItemSearchTerm("");
  };

  const removeItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let taxableAmount = 0;

    formData.items.forEach(item => {
      const itemTotal = item.type === "service" 
        ? (item.laborHours * item.laborRate) + (item.quantity * item.unitPrice)
        : (item.quantity * item.unitPrice);

      subtotal += itemTotal;
      if (item.taxable) taxableAmount += itemTotal;
    });

    const tax = taxableAmount * (formData.taxRate / 100);
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const handleSubmitInvoice = async () => {
    if (!formData.invoiceNumber || 
      !formData.issueDate || 
      !formData.dueDate || 
      !formData.customerInfo.name || 
      formData.items.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }
  
    const { subtotal, tax, total } = calculateInvoiceTotals();
  
    const invoiceData = {
      ...formData,
      subtotal,
      tax,
      total
    };
  
    try {
      if (editMode && selectedInvoice) {
        const response = await invoicesAPI.update(selectedInvoice.id, invoiceData);
        const updatedInvoices = invoices.map(inv => 
          inv.id === selectedInvoice.id ? response.data : inv
        );
        setInvoices(updatedInvoices);
        toast.success("Invoice updated successfully");
      } else {
        const response = await invoicesAPI.create(invoiceData);
        setInvoices([response.data, ...invoices]);
        toast.success("Invoice created successfully");
      }
  
      setSnackbarMessage(editMode ? "Invoice updated successfully" : "Invoice created successfully");
      setSnackbarOpen(true);
      closeInvoiceForm();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error(error.response?.data?.message || "Failed to save invoice");
    }
  };

  const openDeleteConfirmation = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await invoicesAPI.delete(invoiceToDelete.id);
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceToDelete.id);
      setInvoices(updatedInvoices);
      toast.success("Invoice deleted successfully");
      setDeleteDialogOpen(false);
  
      setSnackbarMessage("Invoice deleted successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
      setDeleteDialogOpen(false);
    }
  };

  const openInvoicePreview = (invoice) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  const closeInvoicePreview = () => {
    setPreviewOpen(false);
  };

  const handleClientSelect = (client) => {
    if (!client) return;

    setFormData(prev => ({
      ...prev,
      customerInfo: {
        id: client.id,
        name: client.clientName,
        email: client.email || "",
        phone: client.phoneNumber || "",
        address: client.address || ""
      },
      vehicleInfo: {
        id: client.carDetails?.id,
        make: client.carDetails?.make || "",
        model: client.carDetails?.model || "",
        year: client.carDetails?.year || "",
        licensePlate: client.carDetails?.licensePlate || "",
        vin: client.carDetails?.vin || "",
        odometer: client.carDetails?.odometer || ""
      },
      relatedClientId: client.id
    }));

    setClientLookupOpen(false);
    setSelectedClient(client);
    fetchClientRepairHistory(client.id);
    setClientDetailsOpen(true);
  };

  const openClientLookup = () => {
    setClientLookupOpen(true);
  };

  const closeClientLookup = () => {
    setClientLookupOpen(false);
  };

  const handlePayInvoice = async (invoice) => {
    try {
      const response = await invoicesAPI.markAsPaid(invoice.id, invoice.paymentMethod || 'cash');
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === invoice.id) {
          return response.data;
        }
        return inv;
      });
  
      setInvoices(updatedInvoices);
      toast.success("Invoice marked as paid");
      setSnackbarMessage("Invoice marked as paid");
      setSnackbarOpen(true);
  
      if (previewOpen) {
        setPreviewOpen(false);
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to mark invoice as paid");
    }
  };
  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDetails({
      method: invoice.paymentMethod || 'cash',
      amount: invoice.total,
      reference: '',
      date: new Date()
    });
    setPaymentDialogOpen(true);
  };

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      const paymentData = {
        amount: parseFloat(paymentDetails.amount) || 0,
        method: paymentDetails.method,
        reference: paymentDetails.reference || ''
      };
      
      const response = await invoicesAPI.processPayment(selectedInvoice.id, paymentData);
      
      const isFullPayment = parseFloat(paymentDetails.amount) >= selectedInvoice.total;
      
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === selectedInvoice.id) {
          return response.data;
        }
        return inv;
      });
      
      setInvoices(updatedInvoices);
      
      const message = isFullPayment 
        ? "Payment processed successfully" 
        : "Partial payment recorded successfully";
      
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      toast.success(message);
      
      closePaymentDialog();
      closeInvoicePreview();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  const exportToCSV = () => {
    const headers = ["Invoice #", "Date", "Customer", "Vehicle", "Status", "Amount"];
    const csvData = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      format(new Date(inv.issueDate), "yyyy-MM-dd"),
      inv.customerInfo.name,
      `${inv.vehicleInfo.year} ${inv.vehicleInfo.make} ${inv.vehicleInfo.model}`,
      inv.status,
      inv.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInvoice = async (invoice) => {
    try {
      const response = await invoicesAPI.getPDF(invoice.id);
      
      // If the API returns a PDF file, you can open it in a new window or download it
      // This depends on how your backend is set up to return PDFs
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in a new window
      window.open(url);
      
      toast.info("Invoice printed successfully");
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };

  const handleEmailInvoice = async (invoice) => {
    try {
      // This is a placeholder - you need to implement the email API endpoint
      // await invoicesAPI.sendEmail(invoice.id);
      
      // For now, just show a success message
      toast.info(`Invoice sent to ${invoice.customerInfo.email}`);
    } catch (error) {
      console.error("Error emailing invoice:", error);
      toast.error("Failed to email invoice");
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "draft": return "default";
      case "pending": return "warning";
      case "paid": return "success";
      case "overdue": return "error";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft": return <Edit size={16} />;
      case "pending": return <Clock size={16} />;
      case "paid": return <CheckCircle size={16} />;
      case "overdue": return <XCircle size={16} />;
      case "cancelled": return <XCircle size={16} />;
      default: return null;
    }
  };

  const checkOverdueInvoices = () => {
    const today = new Date();
    
    // Find invoices that are overdue
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'overdue') return false;
      
      const dueDate = new Date(inv.dueDate);
      return dueDate < today;
    });
    
    // Only proceed if there are new overdue invoices to update
    if (overdueInvoices.length > 0) {
      // Update status of overdue invoices
      const updatedInvoices = invoices.map(inv => {
        if (overdueInvoices.find(overdue => overdue.id === inv.id)) {
          return {
            ...inv,
            status: 'overdue'
          };
        }
        return inv;
      });
      
      setInvoices(updatedInvoices);
      
      // Show just one notification about all overdue invoices
      if (overdueInvoices.length === 1) {
        toast.warning(`1 invoice is now overdue: ${overdueInvoices[0].invoiceNumber}`);
      } else {
        toast.warning(`${overdueInvoices.length} invoices are now overdue`, {
          autoClose: 5000  // Keep this message visible a bit longer
        });
      }
    }
  };

  useEffect(() => {
    checkOverdueInvoices();
    const intervalId = setInterval(checkOverdueInvoices, 24 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [invoices]);

  const PaymentDialog = () => (
    <Dialog
      open={paymentDialogOpen}
      onClose={closePaymentDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Process Payment</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Invoice: {selectedInvoice?.invoiceNumber}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Customer: {selectedInvoice?.customerInfo.name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Total Due: {formatCurrency(selectedInvoice?.total || 0)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Payment Amount"
              fullWidth
              type="number"
              value={paymentDetails.amount}
              onChange={(e) => handlePaymentDetailsChange('amount', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: '0.01' }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <TextField
                select
                label="Payment Method"
                value={paymentDetails.method}
                onChange={(e) => handlePaymentDetailsChange('method', e.target.value)}
              >
                {paymentMethods.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Reference Number"
              fullWidth
              value={paymentDetails.reference}
              onChange={(e) => handlePaymentDetailsChange('reference', e.target.value)}
              placeholder="Check #, Transaction ID, etc."
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DatePicker
              selected={paymentDetails.date}
              onChange={(date) => handlePaymentDetailsChange('date', date)}
              dateFormat="MMMM d, yyyy"
              customInput={
                <TextField 
                  label="Payment Date" 
                  fullWidth
                />
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={closePaymentDialog}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleProcessPayment}
          startIcon={<DollarSign />}
        >
          Process Payment
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <FileText size={24} />
            </Avatar>
            <Typography variant="h4" component="h1">
              Invoices & Receipts
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<Link />}
              onClick={openClientLookup}
            >
              Create From Client
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Plus />}
              onClick={() => openInvoiceForm()}
            >
              Create New Invoice
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
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
            <Grid item xs={12} md={3}>
              <Select
                placeholder="Filter by status"
                isClearable
                value={statusFilter}
                onChange={(option) => setStatusFilter(option)}
                options={invoiceStatusOptions}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Filter />}
                  onClick={() => {
                    setSearchTerm('');
                    setDateRange([null, null]);
                    setStatusFilter(null);
                    setActiveTab('all');
                  }}
                >
                  Reset
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Download />}
                  onClick={exportToCSV}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="invoice tabs"
            >
              <Tab label="All Invoices" value="all" />
              <Tab label="Drafts" value="drafts" />
              <Tab label="Pending" value="pending" />
              <Tab label="Paid" value="paid" />
              <Tab label="Overdue" value="overdue" />
            </Tabs>
          </Box>

          <Box sx={{ pt: 2 }}>
            <InvoicesTable 
              invoices={filteredInvoices}
              onPreview={openInvoicePreview}
              onEdit={openInvoiceForm}
              onDelete={openDeleteConfirmation}
              onPrint={handlePrintInvoice}
              onEmail={handleEmailInvoice}
              onPay={openPaymentDialog}
              formatCurrency={formatCurrency}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          </Box>
        </Box>

        {/* Invoice Form Dialog */}
        <Dialog 
          open={formOpen} 
          onClose={closeInvoiceForm}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {editMode ? 'Edit Invoice' : 'Create New Invoice'}
              </Typography>
              {formData.relatedClientId && (
                <Chip 
                  icon={<Link size={16} />}
                  label={`Client #${formData.relatedClientId}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={currentStep} sx={{ pt: 3, pb: 4 }}>
              <Step>
                <StepLabel>Customer & Vehicle</StepLabel>
              </Step>
              <Step>
                <StepLabel>Services & Parts</StepLabel>
              </Step>
              <Step>
                <StepLabel>Payment & Notes</StepLabel>
              </Step>
            </Stepper>

            {currentStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Invoice Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Invoice Number"
                    fullWidth
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    selected={formData.issueDate}
                    onChange={(date) => handleFormChange('issueDate', date)}
                    dateFormat="MMMM d, yyyy"
                    customInput={
                      <TextField 
                        label="Issue Date" 
                        fullWidth
                        required
                      />
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    selected={formData.dueDate}
                    onChange={(date) => handleFormChange('dueDate', date)}
                    dateFormat="MMMM d, yyyy"
                    customInput={
                      <TextField 
                        label="Due Date" 
                        fullWidth
                        required
                      />
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <TextField
                      select
                      label="Status"
                      value={formData.status}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                    >
                      {invoiceStatusOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Customer Information
                    </Typography>
                    <Button 
                      variant="outlined"
                      size="small"
                      startIcon={<Search />}
                      onClick={openClientLookup}
                    >
                      Find Client
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Customer Name"
                    fullWidth
                    required
                    value={formData.customerInfo.name}
                    onChange={(e) => handleFormChange('customerInfo.name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={formData.customerInfo.email}
                    onChange={(e) => handleFormChange('customerInfo.email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={formData.customerInfo.phone}
                    onChange={(e) => handleFormChange('customerInfo.phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Address"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.customerInfo.address}
                    onChange={(e) => handleFormChange('customerInfo.address', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Vehicle Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Make"
                    fullWidth
                    value={formData.vehicleInfo.make}
                    onChange={(e) => handleFormChange('vehicleInfo.make', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Model"
                    fullWidth
                    value={formData.vehicleInfo.model}
                    onChange={(e) => handleFormChange('vehicleInfo.model', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Year"
                    fullWidth
                    value={formData.vehicleInfo.year}
                    onChange={(e) => handleFormChange('vehicleInfo.year', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="License Plate"
                    fullWidth
                    value={formData.vehicleInfo.licensePlate}
                    onChange={(e) => handleFormChange('vehicleInfo.licensePlate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="VIN"
                    fullWidth
                    value={formData.vehicleInfo.vin}
                    onChange={(e) => handleFormChange('vehicleInfo.vin', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Odometer"
                    fullWidth
                    type="number"
                    value={formData.vehicleInfo.odometer}
                    onChange={(e) => handleFormChange('vehicleInfo.odometer', e.target.value)}
                  />
                </Grid>
                
                {formData.relatedClientId && clientRepairHistory.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Client Repair History
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Service</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {clientRepairHistory.map(repair => (
                            <TableRow key={repair.id}>
                              <TableCell>{format(new Date(repair.date), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                {repair.procedures.join(", ")}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(repair.total)}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={repair.status} 
                                  color={repair.status === "completed" ? "success" : "primary"}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => {
                                    openInvoiceFromRepair(formData.relatedClientId, repair.id);
                                  }}
                                  startIcon={<Copy size={16} />}
                                >
                                  Use
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}

            {currentStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Services & Parts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined"
                        startIcon={<Search />}
                        onClick={(e) => setAnchorElItem(e.currentTarget)}
                      >
                        Add Predefined Item
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<Plus />}
                        onClick={addNewItem}
                      >
                        Add Custom Item
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {formData.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <Grid item xs={12}>
                      <Card sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Item #{index + 1}
                          </Typography>
                          <IconButton 
                            color="error"
                            onClick={() => removeItem(item.id)}
                            disabled={formData.items.length <= 1}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={12}>
                            <FormControl fullWidth>
                              <TextField
                                select
                                label="Type"
                                value={item.type}
                                onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                              >
                                <MenuItem value="service">Service</MenuItem>
                                <MenuItem value="part">Part</MenuItem>
                              </TextField>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Description"
                              fullWidth
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Quantity"
                              fullWidth
                              type="number"
                              InputProps={{ inputProps: { min: 1 } }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Unit Price"
                              fullWidth
                              type="number"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                inputProps: { step: "0.01", min: 0 }
                              }}
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </Grid>
                          
                          {item.type === 'service' && (
                            <>
                              <Grid item xs={12} md={3}>
                                <TextField
                                  label="Labor Hours"
                                  fullWidth
                                  type="number"
                                  InputProps={{ inputProps: { step: "0.5", min: 0 } }}
                                  value={item.laborHours}
                                  onChange={(e) => handleItemChange(index, 'laborHours', parseFloat(e.target.value) || 0)}
                                />
                              </Grid>
                              <Grid item xs={12} md={3}>
                                <TextField
                                  label="Labor Rate"
                                  fullWidth
                                  type="number"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    inputProps: { step: "0.01", min: 0 }
                                  }}
                                  value={item.laborRate}
                                  onChange={(e) => handleItemChange(index, 'laborRate', parseFloat(e.target.value) || 0)}
                                />
                              </Grid>
                            </>
                          )}
                          
                          <Grid item xs={12} md={item.type === 'service' ? 12 : 6}>
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={item.taxable}
                                  onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
                                />
                              }
                              label="Taxable"
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  </React.Fragment>
                ))}

                <Grid item xs={12}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={6}></Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" align="right">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body1" align="right" fontWeight="bold">
                          {formatCurrency(calculateInvoiceTotals().subtotal)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}></Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" align="right">
                          Tax ({formData.taxRate}%):
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body1" align="right" fontWeight="bold">
                          {formatCurrency(calculateInvoiceTotals().tax)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}></Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" align="right">Total:</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="h6" align="right" fontWeight="bold" color="primary">
                          {formatCurrency(calculateInvoiceTotals().total)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}

            {currentStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Payment Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tax Rate (%)"
                    fullWidth
                    type="number"
                    InputProps={{ inputProps: { step: "0.1", min: 0 } }}
                    value={formData.taxRate}
                    onChange={(e) => handleFormChange('taxRate', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <TextField
                      select
                      label="Payment Method"
                      value={formData.paymentMethod}
                      onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                    >
                      <MenuItem value="">Select Method</MenuItem>
                      {paymentMethods.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <DatePicker
                    selected={formData.paymentDate}
                    onChange={(date) => handleFormChange('paymentDate', date)}
                    dateFormat="MMMM d, yyyy"
                    isClearable
                    placeholderText="Not paid yet"
                    customInput={
                      <TextField 
                        label="Payment Date" 
                        fullWidth
                      />
                    }
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Notes & Terms
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Customer Notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Any notes visible to the customer"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Mechanic Notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.mechanicNotes}
                    onChange={(e) => handleFormChange('mechanicNotes', e.target.value)}
                    placeholder="Internal notes, not visible on invoice"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Terms & Conditions"
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.terms}
                    onChange={(e) => handleFormChange('terms', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Invoice Summary
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Customer</Typography>
                          <Typography variant="body1">{formData.customerInfo.name}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                          <Typography variant="body1">
                            {formData.vehicleInfo.year} {formData.vehicleInfo.make} {formData.vehicleInfo.model}
                            {formData.vehicleInfo.licensePlate && ` (${formData.vehicleInfo.licensePlate})`}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                          <Typography variant="body1">{formData.invoiceNumber}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)} 
                            color={getStatusColor(formData.status)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={6} md={9}>
                        <Typography variant="body2">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" align="right">
                          {formatCurrency(calculateInvoiceTotals().subtotal)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6} md={9}>
                        <Typography variant="body2">
                          Tax ({formData.taxRate}%):
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" align="right">
                          {formatCurrency(calculateInvoiceTotals().tax)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6} md={9}>
                        <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="subtitle1" align="right" fontWeight="bold" color="primary">
                          {formatCurrency(calculateInvoiceTotals().total)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeInvoiceForm}>Cancel</Button>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            {currentStep < 2 ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSubmitInvoice}
              >
                {editMode ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Invoice Preview Dialog */}
        <Dialog 
          open={previewOpen} 
          onClose={closeInvoicePreview}
          maxWidth="md"
          fullWidth
        >
          {selectedInvoice && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Invoice {selectedInvoice.invoiceNumber}
                  </Typography>
                  <Box>
                    <Chip 
                      label={selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)} 
                      color={getStatusColor(selectedInvoice.status)}
                      sx={{ mr: 1 }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => handlePrintInvoice(selectedInvoice)}
                      title="Print Invoice"
                    >
                      <Printer size={18} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEmailInvoice(selectedInvoice)}
                      title="Email Invoice"
                    >
                      <Mail size={18} />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {/* Header */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <Tool size={24} />
                        </Avatar>
                        <Typography variant="h5">
                          Auto Garage
                        </Typography>
                      </Box>
                      <Typography variant="body2">123 Repair Street</Typography>
                      <Typography variant="body2">Automative City, AC 12345</Typography>
                      <Typography variant="body2">Phone: (555) 123-4567</Typography>
                      <Typography variant="body2">Email: service@autogarage.com</Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <Typography variant="h6" align="right">INVOICE</Typography>
                      <Typography variant="body2" align="right" gutterBottom>
                        <strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}
                      </Typography>
                      <Typography variant="body2" align="right" gutterBottom>
                        <strong>Date:</strong> {format(new Date(selectedInvoice.issueDate), "MMMM d, yyyy")}
                      </Typography>
                      <Typography variant="body2" align="right" gutterBottom>
                        <strong>Due Date:</strong> {format(new Date(selectedInvoice.dueDate), "MMMM d, yyyy")}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Bill To */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>BILL TO:</Typography>
                        <Typography variant="body1" gutterBottom><strong>{selectedInvoice.customerInfo.name}</strong></Typography>
                        {selectedInvoice.customerInfo.address && (
                          <Typography variant="body2" gutterBottom>{selectedInvoice.customerInfo.address}</Typography>
                        )}
                        {selectedInvoice.customerInfo.phone && (
                          <Typography variant="body2" gutterBottom>Phone: {selectedInvoice.customerInfo.phone}</Typography>
                        )}
                        {selectedInvoice.customerInfo.email && (
                          <Typography variant="body2" gutterBottom>Email: {selectedInvoice.customerInfo.email}</Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>VEHICLE:</Typography>
                        <Typography variant="body1" gutterBottom>
                          <strong>
                            {selectedInvoice.vehicleInfo.year} {selectedInvoice.vehicleInfo.make} {selectedInvoice.vehicleInfo.model}
                          </strong>
                        </Typography>
                        {selectedInvoice.vehicleInfo.licensePlate && (
                          <Typography variant="body2" gutterBottom>License: {selectedInvoice.vehicleInfo.licensePlate}</Typography>
                        )}
                        {selectedInvoice.vehicleInfo.vin && (
                          <Typography variant="body2" gutterBottom>VIN: {selectedInvoice.vehicleInfo.vin}</Typography>
                        )}
                        {selectedInvoice.vehicleInfo.odometer && (
                          <Typography variant="body2" gutterBottom>Odometer: {selectedInvoice.vehicleInfo.odometer} miles</Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Items */}
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                          <TableCell sx={{ color: 'white' }}>Item</TableCell>
                          <TableCell sx={{ color: 'white' }}>Description</TableCell>
                          <TableCell align="right" sx={{ color: 'white' }}>Qty</TableCell>
                          <TableCell align="right" sx={{ color: 'white' }}>Price</TableCell>
                          <TableCell align="right" sx={{ color: 'white' }}>Labor</TableCell>
                          <TableCell align="right" sx={{ color: 'white' }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => {
                          const laborCost = item.type === 'service' ? item.laborHours * item.laborRate : 0;
                          const partsCost = item.quantity * item.unitPrice;
                          const totalItemCost = laborCost + partsCost;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip 
                                  label={item.type === 'service' ? 'Service' : 'Part'} 
                                  color={item.type === 'service' ? 'primary' : 'secondary'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell align="right">
                              {item.type === 'service' ? 
                                `${item.laborHours} hrs @ ${formatCurrency(item.laborRate)}` : 
                                '-'}
                            </TableCell>
                            <TableCell align="right">{formatCurrency(totalItemCost)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Totals */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {selectedInvoice.notes && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                        <Typography variant="body2">{selectedInvoice.notes}</Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Terms & Conditions:</Typography>
                      <Typography variant="body2">{selectedInvoice.terms}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">Subtotal:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">{formatCurrency(selectedInvoice.subtotal)}</Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2">Tax ({selectedInvoice.taxRate}%):</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="right">{formatCurrency(selectedInvoice.tax)}</Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle1" align="right" fontWeight="bold" color="primary">
                            {formatCurrency(selectedInvoice.total)}
                          </Typography>
                        </Grid>
                        
                        {selectedInvoice.status === 'paid' && (
                          <>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'success.light',
                                color: 'success.dark',
                                p: 1,
                                borderRadius: 1
                              }}>
                                <CheckCircle size={16} style={{ marginRight: 8 }} />
                                <Typography variant="body2" fontWeight="bold">
                                  PAID {selectedInvoice.paymentDate ? `on ${format(new Date(selectedInvoice.paymentDate), "MMM d, yyyy")}` : ''}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeInvoicePreview}>Close</Button>
              {selectedInvoice.status !== 'paid' && (
                <Button 
                  variant="outlined"
                  color="success"
                  startIcon={<DollarSign />}
                  onClick={() => openPaymentDialog(selectedInvoice)}
                >
                  Process Payment
                </Button>
              )}
              <Button 
                variant="outlined"
                color="primary"
                startIcon={<Edit />}
                onClick={() => {
                  closeInvoicePreview();
                  openInvoiceForm(selectedInvoice);
                }}
              >
                Edit
              </Button>
              <Button 
                variant="contained"
                color="primary"
                startIcon={<Printer />}
                onClick={() => handlePrintInvoice(selectedInvoice)}
              >
                Print
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Client Lookup Dialog */}
      <Dialog
        open={clientLookupOpen}
        onClose={closeClientLookup}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <User size={20} style={{ marginRight: 8 }} />
            Find Client
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search clients by name, phone or vehicle"
            fullWidth
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.filter(client => 
                  client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  client.phoneNumber.includes(searchTerm) ||
                  (client.carDetails?.make + " " + client.carDetails?.model).toLowerCase().includes(searchTerm.toLowerCase())
                ).map(client => (
                  <TableRow key={client.id}>
                    <TableCell>{client.clientName}</TableCell>
                    <TableCell>{client.phoneNumber}</TableCell>
                    <TableCell>
                      {client.carDetails ? 
                        `${client.carDetails.year} ${client.carDetails.make} ${client.carDetails.model}` : 
                        'No vehicle info'}
                    </TableCell>
                    <TableCell>
                      {client.lastVisit ? format(new Date(client.lastVisit), "MMM d, yyyy") : 'Never'}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleClientSelect(client)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeClientLookup}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Client Detail Sidebar */}
      <Dialog
        open={clientDetailsOpen}
        onClose={() => setClientDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedClient && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Client Details
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openInvoiceForm(null, selectedClient.id)}
                  >
                    Create Invoice
                  </Button>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Client Name</Typography>
                    <Typography variant="body1">{selectedClient.clientName}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                    <Typography variant="body2">{selectedClient.phoneNumber}</Typography>
                    <Typography variant="body2">{selectedClient.email}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body1">
                      {selectedClient.carDetails?.year} {selectedClient.carDetails?.make} {selectedClient.carDetails?.model}
                    </Typography>
                    {selectedClient.carDetails?.licensePlate && (
                      <Typography variant="body2">License: {selectedClient.carDetails.licensePlate}</Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Service History</Typography>
                    <Typography variant="body2">Repair Count: {selectedClient.repairCount}</Typography>
                    <Typography variant="body2">Last Visit: {format(new Date(selectedClient.lastVisit), "MMMM d, yyyy")}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Repair History
                  </Typography>
                  
                  {clientRepairHistory.length > 0 ? (
                    <List>
                      {clientRepairHistory.map(repair => (
                        <Paper 
                          key={repair.id} 
                          variant="outlined" 
                          sx={{ mb: 2, p: 2, borderLeft: 3, borderColor: 'primary.main' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1">
                                {format(new Date(repair.date), "MMM d, yyyy")}
                              </Typography>
                              <Typography variant="body2">
                                {repair.procedures.join(", ")}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="h6" color="primary" align="right">
                                {formatCurrency(repair.total)}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Chip 
                                  label={repair.paymentStatus} 
                                  color={repair.paymentStatus === 'paid' ? 'success' : repair.paymentStatus === 'partial' ? 'warning' : 'error'}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={repair.status} 
                                  color={repair.status === 'completed' ? 'success' : 'primary'}
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Copy />}
                              onClick={() => openInvoiceFromRepair(selectedClient.id, repair.id)}
                            >
                              Create Invoice
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No repair history found for this client.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setClientDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteInvoice} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Predefined Item Selector Popover */}
      <Popover
        open={Boolean(anchorElItem)}
        anchorEl={anchorElItem}
        onClose={() => {
          setAnchorElItem(null);
          setItemSearchTerm("");
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: { width: '500px', maxHeight: '400px' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            autoFocus
            placeholder="Search for services or parts..."
            fullWidth
            variant="outlined"
            size="small"
            value={itemSearchTerm}
            onChange={(e) => setItemSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Chip 
                        label={item.type.charAt(0).toUpperCase() + item.type.slice(1)} 
                        color={item.type === "service" ? "primary" : "secondary"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small"
                        onClick={() => addPredefinedItem(item)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No items found. Try a different search term.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Popover>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={closePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Invoice: {selectedInvoice?.invoiceNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Customer: {selectedInvoice?.customerInfo.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Total Due: {formatCurrency(selectedInvoice?.total || 0)}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Payment Amount"
                fullWidth
                type="number"
                value={paymentDetails.amount}
                onChange={(e) => handlePaymentDetailsChange('amount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  select
                  label="Payment Method"
                  value={paymentDetails.method}
                  onChange={(e) => handlePaymentDetailsChange('method', e.target.value)}
                >
                  {paymentMethods.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Reference Number"
                fullWidth
                value={paymentDetails.reference}
                onChange={(e) => handlePaymentDetailsChange('reference', e.target.value)}
                placeholder="Check #, Transaction ID, etc."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                selected={paymentDetails.date}
                onChange={(date) => handlePaymentDetailsChange('date', date)}
                dateFormat="MMMM d, yyyy"
                customInput={
                  <TextField 
                    label="Payment Date" 
                    fullWidth
                  />
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleProcessPayment}
            startIcon={<DollarSign />}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <X size={16} />
          </IconButton>
        }
      />
    </Container>
  </>
  );
};

// Separate table component
const InvoicesTable = ({ 
  invoices, 
  onPreview,
  onEdit, 
  onDelete,
  onPrint,
  onEmail,
  onPay,
  formatCurrency,
  getStatusColor,
  getStatusIcon
}) => {
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const handleActionsClick = (event, invoiceId) => {
    setActionsMenuAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleActionsClose = () => {
    setActionsMenuAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleAction = (action) => {
    const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!invoice) return;

    switch (action) {
      case 'preview':
        onPreview(invoice);
        break;
      case 'edit':
        onEdit(invoice);
        break;
      case 'print':
        onPrint(invoice);
        break;
      case 'email':
        onEmail(invoice);
        break;
      case 'pay':
        onPay(invoice);
        break;
      case 'delete':
        onDelete(invoice);
        break;
      default:
        break;
    }

    handleActionsClose();
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="invoices table">
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 5 }}>
                    No invoices found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => onPreview(invoice)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {invoice.invoiceNumber}
                    </Button>
                    {invoice.relatedClientId && (
                      <Chip 
                        icon={<Link size={12} />}
                        label={`Client #${invoice.relatedClientId}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ ml: 1, height: 20 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{invoice.customerInfo.name}</TableCell>
                  <TableCell>
                    {invoice.vehicleInfo && (
                      <Typography variant="body2">
                        {invoice.vehicleInfo.year} {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getStatusIcon(invoice.status)}
                      label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)} 
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="View">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => onPreview(invoice)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => onEdit(invoice)}
                        >
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small" 
                          color="default"
                          onClick={(event) => handleActionsClick(event, invoice.id)}
                        >
                          <CornerDownRight size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionsMenuAnchorEl}
        open={Boolean(actionsMenuAnchorEl)}
        onClose={handleActionsClose}
      >
        <MenuItem onClick={() => handleAction('preview')}>
          <ListItemIcon>
            <Eye size={16} />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction('print')}>
          <ListItemIcon>
            <Printer size={16} />
          </ListItemIcon>
          Print
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')}>
          <ListItemIcon>
            <Mail size={16} />
          </ListItemIcon>
          Email to Client
        </MenuItem>
        {selectedInvoiceId && invoices.find(inv => inv.id === selectedInvoiceId)?.status !== 'paid' && (
          <MenuItem onClick={() => handleAction('pay')}>
            <ListItemIcon>
              <DollarSign size={16} />
            </ListItemIcon>
            Process Payment
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <Trash2 size={16} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default Invoices;