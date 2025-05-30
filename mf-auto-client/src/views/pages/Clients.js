import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../Context/UserContext.js";
import {
  getStatusColor,
  getStatusIcon,
} from "../../utility/statusMapper.js";
import { generateServiceReport } from "../../utility/pdfGenerator.js";
import AppointmentCalendar from "components/Calendar/AppointmentCalendar.js";
import Header from "components/Headers/Header.js";
import { clientsAPI, invoicesAPI } from "../../api.js";
import { toast } from "react-toastify";
import { format, addDays, differenceInDays } from "date-fns";
import axios from "axios";
import debounce from "lodash/debounce";
import Autocomplete from "@mui/material/Autocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Users,
  Plus,
  Filter,
  Download,
  Search,
  Calendar,
  CheckCircle,
  Phone,
  FileText,
  Camera,
  Tag,
  ChevronDown,
  User,
  Truck,
  Wrench,
  Clock,
  XCircle,
  DollarSign,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Paper,
  TextField,
  InputAdornment,
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
  Divider,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ClientsTable from "components/ClientsTable";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const repairProcedures = [
  { value: "oil_change", label: "Oil Change" },
  { value: "brake_service", label: "Brake Service" },
  { value: "tire_replacement", label: "Tire Replacement" },
  { value: "engine_diagnostics", label: "Engine Diagnostics" },
  { value: "suspension_repair", label: "Suspension Repair" },
  { value: "transmission_service", label: "Transmission Service" },
  { value: "electrical_repair", label: "Electrical System Repair" },
  { value: "ac_service", label: "A/C Service & Repair" },
  { value: "wheel_alignment", label: "Wheel Alignment" },
  { value: "battery_replacement", label: "Battery Replacement" },
  { value: "radiator_service", label: "Radiator Service" },
  { value: "exhaust_repair", label: "Exhaust System Repair" },
  { value: "major_engine_repair", label: "Major Engine Repair" },
  { value: "preventive_maintenance", label: "Preventive Maintenance" },
  { value: "body_work", label: "Body Work & Painting" },
  { value: "glass_repair", label: "Windshield & Glass Repair" },
];

const carYears = Array.from({ length: 30 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);

const repairStatusOptions = [
  { value: "waiting", label: "Waiting", color: "warning" },
  { value: "in_progress", label: "In Progress", color: "info" },
];

const allRepairStatusOptions = [
  { value: "waiting", label: "Waiting", color: "warning" },
  { value: "in_progress", label: "In Progress", color: "info" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "delivered", label: "Delivered", color: "primary" },
  { value: "cancelled", label: "Cancelled", color: "error" },
];

const carModels = {
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Focus", "Fusion", "Edge", "Ranger", "Expedition"],
  "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "Sienna", "Prius", "4Runner"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Ridgeline", "Passport"],
  "Chevrolet": ["Silverado", "Malibu", "Equinox", "Tahoe", "Traverse", "Colorado", "Camaro", "Cruze"],
  "Nissan": ["Altima", "Rogue", "Sentra", "Murano", "Pathfinder", "Frontier", "Titan", "Maxima"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona", "Accent", "Veloster"],
  "Kia": ["Sorento", "Sportage", "Forte", "Optima", "Telluride", "Soul", "Rio", "Stinger"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "Arteon", "Taos", "ID.4"],
  "BMW": ["3 Series", "5 Series", "X3", "X5", "X7", "M3", "M5", "i3", "i4"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class", "A-Class", "CLA", "GLA"]
};

const carColors = [
  "Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", 
  "Orange", "Purple", "Brown", "Beige", "Gold", "Navy", "Burgundy", "Teal"
];

// Define initial form state
const initialFormState = {
  clientName: "",
  phoneNumber: "",
  email: "",
  carDetails: {
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    vin: "",
  },
  issueDescription: "",
  repairStatus: "waiting",
  paymentStatus: "not_paid",
  estimatedCost: "",
  estimatedDuration: 1,
  deliveryDate: addDays(new Date(), 1),
  images: [],
  deliveryImages: [],
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Simplified status constants
const REPAIR_STATUSES = {
  WAITING: {
    value: "waiting",
    label: "Waiting",
    color: "warning",
    icon: Clock,
    nextStatus: "in_progress",
    nextLabel: "Start Repair"
  },
  IN_PROGRESS: {
    value: "in_progress",
    label: "In Progress",
    color: "info",
    icon: Wrench,
    nextStatus: "completed",
    nextLabel: "Complete Repair"
  },
  COMPLETED: {
    value: "completed",
    label: "Completed",
    color: "success",
    icon: CheckCircle,
    nextStatus: "delivered",
    nextLabel: "Mark Delivered",
    requiresPayment: true
  },
  DELIVERED: {
    value: "delivered",
    label: "Delivered",
    color: "primary",
    icon: CheckCircle,
    isFinal: true
  }
};

const PAYMENT_STATUSES = {
  NOT_PAID: {
    value: "not_paid",
    label: "Not Paid",
    color: "error",
    icon: XCircle,
    nextStatus: "paid",
    nextLabel: "Mark as Paid"
  },
  PAID: {
    value: "paid",
    label: "Paid",
    color: "success",
    icon: CheckCircle,
    isFinal: true
  },
  PARTIAL: {
    value: "partial",
    label: "Partial Payment",
    color: "warning",
    icon: DollarSign,
    nextStatus: "paid",
    nextLabel: "Complete Payment"
  }
};

const Clients = () => {
  const history = useHistory();
  const { token } = useContext(UserContext);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    email: "",
    carDetails: {
      make: "",
      model: "",
      year: "",
      color: "",
      licensePlate: "",
    },
    issueDescription: "",
    procedures: [],
    estimatedDuration: 1,
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    paymentStatus: "not_paid",
    partialPaymentAmount: 0,
    totalAmount: 0,
    repairStatus: "waiting",
    notes: "",
    createdAt: new Date(),
    images: [],
    deliveryImages: [],
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [clientHistory, setClientHistory] = useState([]);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    clientId: null,
    newStatus: null
  });
  const [activeTab, setActiveTab] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPreDeliveryDialog, setShowPreDeliveryDialog] = useState(false);
  const [preDeliveryImages, setPreDeliveryImages] = useState([]);
  const [preDeliveryNotes, setPreDeliveryNotes] = useState("");

  const getRepairStatusColor = (status) => getStatusColor(status, "repair");
  const getPaymentStatusColor = (status) => getStatusColor(status, "payment");
  const getPaymentStatusIcon = (status) => getStatusIcon(status, "payment");

  // Move fetchClients definition to the top of the component
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await clientsAPI.getAll();
      if (response && response.data) {
        // Sort clients by createdAt in descending order (newest first)
        const sortedClients = response.data.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at);
          const dateB = new Date(b.createdAt || b.created_at);
          return dateB - dateA;
        });
        setClients(sortedClients);
        setFilteredClients(sortedClients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add useEffect for initial client fetch
  useEffect(() => {
    fetchClients();
  }, [fetchClients]); // Only depend on fetchClients since it's memoized

  // Apply filters when search term, filter status, or date range changes
  useEffect(() => {
    let result = [...clients];

    // Filter by status
    if (filterStatus) {
      if (filterStatus.value === "active") {
        result = result.filter(
          (client) =>
            client.repairStatus !== "delivered" &&
            client.repairStatus !== "cancelled"
        );
      } else {
        result = result.filter(
          (client) => client.repairStatus === filterStatus.value
        );
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (client) =>
          client.clientName.toLowerCase().includes(term) ||
          client.phoneNumber.toLowerCase().includes(term) ||
          (client.carDetails.make &&
            client.carDetails.make.toLowerCase().includes(term)) ||
          (client.carDetails.model &&
            client.carDetails.model.toLowerCase().includes(term)) ||
          (client.carDetails.licensePlate &&
            client.carDetails.licensePlate.toLowerCase().includes(term))
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      result = result.filter((client) => {
        const clientDate = new Date(client.createdAt);
        return clientDate >= startDate && clientDate <= endDate;
      });
    }

    // Sort by createdAt in descending order (newest first)
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      return dateB - dateA;
    });

    // Update filtered clients
    setFilteredClients(result);
  }, [clients, searchTerm, filterStatus, startDate, endDate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Set filter based on tab
    if (newValue === "all") {
      // Reset all filters when switching to "all" tab
      setFilterStatus(null);
      setSearchTerm("");
      setDateRange([null, null]);
    } else if (newValue === "waiting") {
      setFilterStatus({ value: "waiting", label: "Waiting" });
    } else if (newValue === "in_progress") {
      setFilterStatus({ value: "in_progress", label: "In Progress" });
    } else if (newValue === "completed") {
      setFilterStatus({ value: "completed", label: "Completed" });
    } else if (newValue === "active") {
      setFilterStatus({ value: "active", label: "Active Repairs" });
    }
  };

  const openClientForm = (client = null) => {
    if (client) {
      // Editing existing client - use all status options
      setFormData({
        ...client,
        createdAt: new Date(client.createdAt),
        deliveryDate: new Date(client.deliveryDate),
        carDetails: {
          ...client.carDetails,
          year: client.carDetails.year || "",
        },
        procedures: client.procedures || [],
        images: client.images || [],
        deliveryImages: client.deliveryImages || [],
      });
      setEditMode(true);
      setSelectedClient(client);
    } else {
      // New client - only allow waiting or in_progress
      setFormData({
        clientName: "",
        phoneNumber: "",
        email: "",
        carDetails: {
          make: "",
          model: "",
          year: "",
          color: "",
          licensePlate: "",
        },
        issueDescription: "",
        procedures: [],
        repairStatus: "waiting", // Default to waiting for new clients
        paymentStatus: "pending",
        partialPaymentAmount: 0,
        totalAmount: 0,
        createdAt: new Date(),
        deliveryDate: addDays(new Date(), 3),
        estimatedDuration: 3,
        images: [],
        deliveryImages: [],
        notes: "",
      });
      setEditMode(false);
      setSelectedClient(null);
    }
    setFormOpen(true);
  };

  const closeClientForm = () => {
    setFormOpen(false);
    // Reset form data after modal is closed
    setTimeout(() => {
      setFormData({
        clientName: "",
        phoneNumber: "",
        email: "",
        carDetails: {
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          color: "",
          vin: "",
        },
        issueDescription: "",
        repairStatus: "waiting",
        paymentStatus: "pending",
        estimatedCost: "",
        estimatedDuration: 1,
        deliveryDate: addDays(new Date(), 1),
        images: [], // Reset images array
        deliveryImages: [], // Reset delivery images array
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }, 300); // Small delay to ensure smooth transition
  };

  // Create a debounced version of handleFormChange for text inputs
  const debouncedHandleFormChange = useMemo(
    () =>
      debounce((field, value) => {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }, 100),
    []
  );

  // Separate handler for immediate updates (like selects and dates)
  const handleImmediateFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Optimize car details handling
  const handleCarDetailsChange = (field, value) => {
    setFormData((prev) => {
      const newCarDetails = { ...prev.carDetails };
      
      // Handle model autocomplete based on make
      if (field === 'make') {
        const availableModels = carModels[value] || [];
        // Clear model if the new make doesn't support the current model
        if (newCarDetails.model && !availableModels.includes(newCarDetails.model)) {
          newCarDetails.model = '';
        }
        newCarDetails[field] = value;
      } else {
        newCarDetails[field] = value;
      }

      return {
        ...prev,
        carDetails: newCarDetails
      };
    });
  };

  // Create debounced version of car details handler
  const debouncedCarDetailsChange = useMemo(
    () =>
      debounce((field, value) => {
        handleCarDetailsChange(field, value);
      }, 100),
    []
  );

  const handleImageUpload = (e) => {
    // In a real app, this would handle file uploads
    // For this demo, we'll just simulate adding image data
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Create array of image file names (simulating actual upload)
      const newImages = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file), // This creates a temporary URL for preview
        uploadDate: new Date(),
      }));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));

      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  // Add this function to check for duplicates
  const checkForDuplicate = (clientData) => {
    // Skip duplicate check if we're editing an existing client
    if (clientData.id || clientData._id) {
      return false;
    }

    // Only check for duplicates when creating a new client
    return clients.some(
      (client) =>
        client.phoneNumber === clientData.phoneNumber &&
        (client.id !== clientData.id && client._id !== clientData._id)
    );
  };

  // Add validation helper functions
  const validateClientForm = (formData) => {
    const errors = [];
    
    // Basic validation - only check essential fields
    if (!formData.clientName?.trim()) {
      errors.push("Client name is required");
    }
    
    // Only validate phone number for new clients
    if (!formData.id && !formData._id) {
      if (!formData.phoneNumber?.trim()) {
        errors.push("Phone number is required");
      } else if (!/^[0-9+\-\s()]{5,}$/.test(formData.phoneNumber.trim())) {
        errors.push("Please enter a valid phone number (minimum 5 digits)");
      }
    }
    
    // Car details validation - at least one field should be filled
    if (!formData.carDetails?.make?.trim() && 
        !formData.carDetails?.model?.trim() && 
        !formData.carDetails?.licensePlate?.trim()) {
      errors.push("Please provide at least one vehicle detail (make, model, or license plate)");
    }
    
    // Issue description validation
    if (!formData.issueDescription?.trim()) {
      errors.push("Please describe the issue or service needed");
    }

    // Duration validation
    if (formData.estimatedDuration === null || formData.estimatedDuration <= 0) {
      errors.push("Please enter a valid estimated duration");
    }

    // Delivery date validation
    if (!formData.deliveryDate) {
      errors.push("Please select an expected delivery date");
    }
    
    return errors;
  };

  // Update the handleSubmitClient function
  const handleSubmitClient = async () => {
    try {
      // Validate form
      const validationErrors = validateClientForm(formData);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      // Check for duplicates only when creating a new client
      if (!formData.id && !formData._id && checkForDuplicate(formData)) {
        toast.error("A client with this phone number already exists");
        return;
      }

      setIsSubmitting(true);

      // Prepare client data
      const clientData = { ...formData };
      
      // Remove _id and id when creating a new client
      if (!clientData.id && !clientData._id) {
        delete clientData._id;
        delete clientData.id;
      }

      // Ensure license plate is uppercase
      if (clientData.carDetails?.licensePlate) {
        clientData.carDetails.licensePlate = clientData.carDetails.licensePlate.toUpperCase();
      }

      let clientResponse;
      const isUpdate = !!(clientData.id || clientData._id);
      const clientId = clientData.id || clientData._id;

      if (isUpdate) {
        // Update existing client
        clientResponse = await clientsAPI.update(clientId, clientData);
      } else {
        // Create new client
        clientResponse = await clientsAPI.create(clientData);
      }

      if (!clientResponse?.data) {
        throw new Error("Failed to save client data");
      }

      // Ensure we have a consistent ID format
      const responseId = clientResponse.data._id || clientResponse.data.id;
      
      // Update the clients list with the new data
      setClients(prevClients => {
        if (isUpdate) {
          // Update existing client
          return prevClients.map(client => 
            (client.id === clientId || client._id === clientId) 
              ? { ...clientResponse.data, id: responseId }
              : client
          );
        } else {
          // Add new client
          return [...prevClients, { ...clientResponse.data, id: responseId }];
        }
      });

      // Dispatch event for calendar update
      window.dispatchEvent(new CustomEvent('client-updated', {
        detail: {
          clientId: responseId,
          action: isUpdate ? 'client-updated' : 'client-created',
          timestamp: new Date().getTime()
        }
      }));

      // Show success message
      toast.success(isUpdate ? "Client updated successfully" : "Client created successfully");
      
      // Close the form
      closeClientForm();

      // Refresh the client list to ensure we have the latest data
      await fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(error.response?.data?.message || "Failed to save client data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add back the missing functions
  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };

  const exportToCSV = () => {
    const headers = [
      "ID", "Client", "Phone", "Vehicle", "Procedures", "Issue", "Status", "Payment Status",
    ];
    const csvData = filteredClients.map((client) => [
      client.id,
      client.clientName,
      client.phoneNumber,
      `${client.carDetails.year} ${client.carDetails.make} ${client.carDetails.model} (${client.carDetails.licensePlate})`,
      client.procedures.map((p) => p.label).join(", "),
      client.issueDescription,
      client.repairStatus.replace("_", " "),
      client.paymentStatus.replace("_", " "),
    ]);

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clients_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openClientDetails = (client) => {
    setSelectedClientForDetails(client);
    setDetailsDialogOpen(true);
  };

  const closeClientDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedClientForDetails(null);
  };

  const openDeleteConfirmation = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await clientsAPI.delete(clientToDelete.id);
      const updatedClients = clients.filter((client) => client.id !== clientToDelete.id);
      setClients(updatedClients);
      toast.success("Client record deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChangeConfirmation = (clientId, newStatus) => {
    const client = clients.find(c => c.id === clientId || c._id === clientId);
    if (!client) return;

    let title = "Confirm Status Change";
    let message = `Are you sure you want to mark this repair as ${newStatus.replace("_", " ")}?`;

    if (newStatus === "completed") {
      message += "\n\nThis will allow you to proceed with delivery once payment is completed.";
    } else if (newStatus === "delivered") {
      message += "\n\nThis will generate a comprehensive service and delivery report.";
    }

    setConfirmationDialog({
      open: true,
      title,
      message,
      onConfirm: () => handleUpdateStatus(clientId, newStatus),
      clientId,
      newStatus
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
      clientId: null,
      newStatus: null
    });
  };

  const openPreDeliveryDialog = (client) => {
    setSelectedClient(client);
    setPreDeliveryImages([]);
    setPreDeliveryNotes("");
    setShowPreDeliveryDialog(true);
  };

  const handleCompleteDelivery = async () => {
    if (!selectedClient) {
      toast.error("No client selected for delivery");
      return;
    }

    try {
      if (selectedClient.repairStatus !== "completed") {
        toast.error("Repair must be completed before delivery");
        return;
      }

      if (selectedClient.paymentStatus !== "paid") {
        toast.error("Payment must be completed before delivery");
        return;
      }

      setIsLoading(true);
      const deliveryData = {
        deliveryDate: new Date(),
        deliveryNotes: preDeliveryNotes,
        deliveryImages: preDeliveryImages,
        status: "delivered"
      };

      const deliveryResponse = await clientsAPI.markAsDelivered(
        selectedClient.id || selectedClient._id, 
        deliveryData
      );

      if (!deliveryResponse?.data) {
        throw new Error("Failed to update delivery status");
      }

      const updatedClient = { 
        ...deliveryResponse.data, 
        id: deliveryResponse.data._id || deliveryResponse.data.id 
      };
      
      setClients(prevClients => 
        prevClients.map(client => 
          (client.id === selectedClient.id || client._id === selectedClient._id)
            ? updatedClient
            : client
        )
      );

      setFilteredClients(prevFiltered => 
        prevFiltered.map(client => 
          (client.id === selectedClient.id || client._id === selectedClient._id)
            ? updatedClient
            : client
        )
      );

      // Reset state
      setShowPreDeliveryDialog(false);
      setSelectedClient(null);
      setPreDeliveryImages([]);
      setPreDeliveryNotes("");

      toast.success("Client marked as delivered successfully");

      // Generate and download the service report PDF
      try {
        const pdfResult = await generateServiceReport(updatedClient);
        if (!pdfResult.success) {
          console.error("Failed to generate PDF:", pdfResult.error);
          toast.warning("Service report generation failed, but delivery was successful");
        }
      } catch (pdfError) {
        console.error("Error generating service report:", pdfError);
        toast.warning("Service report generation failed, but delivery was successful");
      }

      // Dispatch event for calendar update
      window.dispatchEvent(new CustomEvent('client-updated', {
        detail: {
          clientId: selectedClient.id || selectedClient._id,
          status: 'delivered',
          action: 'delivered',
          timestamp: new Date().getTime()
        }
      }));
    } catch (error) {
      console.error("Error completing delivery:", error);
      toast.error(error.response?.data?.message || "Failed to complete delivery");
    } finally {
      setIsLoading(false);
    }
  };

  const openClientHistory = (client) => {
    setSelectedClient(client);
    setSelectedClientForHistory(client);
    setHistoryDialogOpen(true);
  };

  // Optimize form handling with debounced updates
  const debouncedFormChange = useCallback(
    debounce((field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }, 100),
    []
  );

  // Update the form change handler to use debouncing
  const handleFormChange = (field, value) => {
    // For immediate UI feedback
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Debounce the actual state update
    debouncedFormChange(field, value);
  };

  // Add the missing functions
  const handleUpdateStatus = async (clientId, newStatus) => {
    try {
      setIsLoading(true);
      const response = await clientsAPI.updateStatus(clientId, newStatus);
      
      if (!response?.data) {
        throw new Error("Failed to update status");
      }

      const updatedClient = { 
        ...response.data, 
        id: response.data._id || response.data.id 
      };

      // Update clients list
      setClients(prevClients => 
        prevClients.map(client => 
          (client.id === clientId || client._id === clientId)
            ? updatedClient
            : client
        )
      );

      // Update filtered clients
      setFilteredClients(prevFiltered => 
        prevFiltered.map(client => 
          (client.id === clientId || client._id === clientId)
            ? updatedClient
            : client
        )
      );

      // If status is completed or delivered, automatically download the completion PDF
      if (['completed', 'delivered'].includes(newStatus)) {
        try {
          const pdfResponse = await clientsAPI.getCompletionPDF(clientId);
          const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `completion-${updatedClient.clientName}-${clientId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Completion certificate downloaded successfully');
        } catch (pdfError) {
          console.error('Error generating completion PDF:', pdfError);
          toast.warning('Client status updated, but there was an error downloading the completion certificate');
        }
      }

      // Close confirmation dialog
      closeConfirmationDialog();

      // Show success message
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);

      // Dispatch event for calendar update
      window.dispatchEvent(new CustomEvent('client-updated', {
        detail: {
          clientId,
          status: newStatus,
          action: 'status-updated',
          timestamp: new Date().getTime()
        }
      }));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePayment = async (clientId, newPaymentStatus, amount = 0) => {
    try {
      setIsLoading(true);
      
      const paymentData = {
        paymentStatus: newPaymentStatus,
        partialPaymentAmount: newPaymentStatus === "partial" ? amount : 0,
      };
      
      // Call API to update payment status using updatePayment
      const response = await clientsAPI.updatePayment(clientId, paymentData);
      
      if (!response || !response.data) {
        throw new Error("Failed to update payment status");
      }
      
      console.log(`Client payment status updated successfully: ${clientId} -> ${newPaymentStatus}`);

      // Update local state
      const updatedClients = clients.map((client) => {
        if (client.id === clientId || client._id === clientId) {
          return {
            ...client,
            paymentStatus: newPaymentStatus,
            partialPaymentAmount: newPaymentStatus === "partial" ? amount : 0,
          };
        }
        return client;
      });

      setClients(updatedClients);
      setFilteredClients(prevFiltered => prevFiltered.map(client => {
        if (client.id === clientId || client._id === clientId) {
          return {
            ...client,
            paymentStatus: newPaymentStatus,
            partialPaymentAmount: newPaymentStatus === "partial" ? amount : 0,
          };
        }
        return client;
      }));
      
      toast.success(`Payment status updated to ${newPaymentStatus.replace("_", " ")}`);
      
      // Notify other components via custom event
      const updateEvent = new CustomEvent('payment-updated', {
        detail: {
          clientId,
          status: newPaymentStatus,
          amount: newPaymentStatus === "partial" ? amount : 0,
          timestamp: new Date().getTime()
        }
      });
      window.dispatchEvent(updateEvent);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status: " + (error.message || "Unknown error"));
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <Container fluid className="mt--7">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Header />
      <Container
        maxWidth={false}
        sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
              <Users size={24} />
            </Avatar>
            <Typography variant="h4" component="h1">
              Clients
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={showCalendarView ? <Users /> : <Calendar />}
              onClick={() => setShowCalendarView(!showCalendarView)}
            >
              {showCalendarView ? "Table View" : "Calendar View"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={() => openClientForm()}
            >
              New Client
            </Button>
          </Box>
        </Box>

        {/* Toggle between table and calendar view */}
        {showCalendarView ? (
          <AppointmentCalendar
            clients={clients}
            onCreateInvoiceFromAppointment={(clientId) => {
              history.push({
                pathname: "/admin/invoices",
                state: { createFromClient: clientId },
              });
            }}
          />
        ) : (
          <>
            {/* Dashboard Summary */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "info.main" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "info.light", mr: 2 }}>
                        <Users size={20} />
                      </Avatar>
                      <Typography color="info.main" variant="h6">
                        Total Clients
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {clients.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "warning.light", mr: 2 }}>
                        <Wrench size={20} />
                      </Avatar>
                      <Typography color="warning.main" variant="h6">
                        Active Repairs
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {
                        clients.filter(
                          (client) => client.repairStatus === "in_progress"
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "success.main" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "success.light", mr: 2 }}>
                        <CheckCircle size={20} />
                      </Avatar>
                      <Typography color="success.main" variant="h6">
                        Completed Jobs
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {
                        clients.filter(
                          (client) =>
                            client.repairStatus === "completed" ||
                            client.repairStatus === "delivered"
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ borderLeft: 4, borderColor: "error.main" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "error.light", mr: 2 }}>
                        <AlertTriangle size={20} />
                      </Avatar>
                      <Typography color="error.main" variant="h6">
                        Unpaid Jobs
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {
                        clients.filter(
                          (client) => client.paymentStatus === "not_paid"
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, phone, vehicle..."
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
                    value={filterStatus}
                    onChange={(option) => setFilterStatus(option)}
                    options={[
                      { value: "active", label: "Active Repairs" },
                      ...repairStatusOptions,
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Filter />}
                      onClick={() => {
                        setSearchTerm("");
                        setDateRange([null, null]);
                        setFilterStatus(null);
                        setActiveTab("all");
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
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="client tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="All Clients" value="all" />
                  <Tab
                    label={
                      <Badge
                        badgeContent={
                          clients.filter(
                            (client) => client.repairStatus === "waiting"
                          ).length
                        }
                        color="warning"
                      >
                        Waiting
                      </Badge>
                    }
                    value="waiting"
                  />
                  <Tab
                    label={
                      <Badge
                        badgeContent={
                          clients.filter(
                            (client) => client.repairStatus === "in_progress"
                          ).length
                        }
                        color="info"
                      >
                        In Progress
                      </Badge>
                    }
                    value="in_progress"
                  />
                  <Tab
                    label={
                      <Badge
                        badgeContent={
                          clients.filter(
                            (client) => client.repairStatus === "completed"
                          ).length
                        }
                        color="success"
                      >
                        Completed
                      </Badge>
                    }
                    value="completed"
                  />
                  <Tab label="Active Repairs" value="active" />
                </Tabs>
              </Box>

              <Box sx={{ pt: 2 }}>
                <ClientsTable
                  clients={filteredClients}
                  onView={openClientDetails}
                  onEdit={openClientForm}
                  onDelete={openDeleteConfirmation}
                  onUpdateStatus={handleStatusChangeConfirmation}
                  onUpdatePayment={handleUpdatePayment}
                  onMarkDelivered={openPreDeliveryDialog}
                  formatDate={formatDate}
                />
              </Box>
            </Box>
          </>
        )}

        {/* Client Form Dialog */}
        <Dialog
          open={formOpen}
          onClose={closeClientForm}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {editMode ? "Edit Client Record" : "New Client"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Client Name"
                  fullWidth
                  required
                  value={formData.clientName}
                  onChange={(e) =>
                    handleImmediateFormChange("clientName", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  required
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleImmediateFormChange("phoneNumber", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Vehicle Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={Object.keys(carModels)}
                  value={formData.carDetails.make}
                  onChange={(event, newValue) => handleCarDetailsChange("make", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Make"
                      fullWidth
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={carModels[formData.carDetails.make] || []}
                  value={formData.carDetails.model}
                  onChange={(event, newValue) => handleCarDetailsChange("model", newValue)}
                  disabled={!formData.carDetails.make}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Model"
                      fullWidth
                      required
                      helperText={!formData.carDetails.make ? "Select make first" : ""}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={carYears}
                  freeSolo
                  value={formData.carDetails.year}
                  onChange={(event, newValue) =>
                    handleImmediateFormChange("carDetails.year", newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Year" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="License Plate"
                  fullWidth
                  required
                  value={formData.carDetails.licensePlate}
                  onChange={(e) =>
                    handleCarDetailsChange("licensePlate", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={carColors}
                  freeSolo
                  value={formData.carDetails.color}
                  onChange={(event, newValue) =>
                    handleImmediateFormChange("carDetails.color", newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Color" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="VIN (Optional)"
                  fullWidth
                  value={formData.carDetails.vin}
                  onChange={(e) =>
                    handleImmediateFormChange("carDetails.vin", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Repair Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Procedures*
                </Typography>
                <Select
                  isMulti
                  name="procedures"
                  options={repairProcedures}
                  value={formData.procedures}
                  onChange={(selectedOptions) =>
                    handleImmediateFormChange("procedures", selectedOptions || [])
                  }
                  placeholder="Select repair procedures..."
                  isSearchable
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "white",
                      zIndex: 9999,
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                      maxHeight: "300px"
                    }),
                    menuList: (provided) => ({
                      ...provided,
                      maxHeight: "300px",
                      padding: "8px 0"
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected
                        ? "#1976d2"
                        : state.isFocused
                        ? "#e8f0fe"
                        : "white",
                      color: state.isSelected ? "white" : "black",
                      padding: "10px 15px",
                      cursor: "pointer",
                      '&:active': {
                        backgroundColor: state.isSelected ? "#1976d2" : "#e8f0fe"
                      }
                    }),
                    control: (provided, state) => ({
                      ...provided,
                      borderColor: state.isFocused ? "#1976d2" : "#ced4da",
                      boxShadow: state.isFocused
                        ? "0 0 0 2px rgba(25, 118, 210, 0.25)"
                        : "none",
                      "&:hover": {
                        borderColor: state.isFocused ? "#1976d2" : "#adb5bd",
                      },
                      minHeight: "42px"
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: "2px 8px"
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: "#e8f0fe",
                      borderRadius: "4px"
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: "#1976d2",
                      padding: "2px 6px"
                    }),
                    multiValueRemove: (provided) => ({
                      ...provided,
                      color: "#1976d2",
                      '&:hover': {
                        backgroundColor: "#bbdefb",
                        color: "#1565c0"
                      }
                    })
                  }}
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: "#1976d2",
                      primary25: "#e8f0fe",
                      primary50: "#bbdefb",
                      primary75: "#90caf9"
                    }
                  })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Issue Description"
                  fullWidth
                  required
                  multiline
                  rows={2}
                  value={formData.issueDescription}
                  onChange={(e) =>
                    handleImmediateFormChange("issueDescription", e.target.value)
                  }
                  placeholder="Describe the issues that need to be repaired"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Pre-Existing Issues/Damage"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.preExistingIssues}
                  onChange={(e) =>
                    handleImmediateFormChange("preExistingIssues", e.target.value)
                  }
                  placeholder="Document any pre-existing damage or issues (dents, scratches, etc.)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Estimated Duration (days)"
                  type="text"
                  inputMode="numeric"
                  value={formData.estimatedDuration === null ? '' : formData.estimatedDuration}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty value
                    if (value === '') {
                      handleImmediateFormChange("estimatedDuration", null);
                      // Reset delivery date when duration is cleared
                      handleImmediateFormChange("deliveryDate", null);
                    } else {
                      // Only allow numbers
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleImmediateFormChange("estimatedDuration", numValue);
                        // Update delivery date based on new duration
                        const newDeliveryDate = addDays(new Date(formData.createdAt), numValue);
                        handleImmediateFormChange("deliveryDate", newDeliveryDate);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // If empty or invalid, set to default of 1
                    const value = e.target.value;
                    if (!value || isNaN(parseInt(value)) || parseInt(value) <= 0) {
                      handleImmediateFormChange("estimatedDuration", 1);
                      const newDeliveryDate = addDays(new Date(formData.createdAt), 1);
                      handleImmediateFormChange("deliveryDate", newDeliveryDate);
                    }
                  }}
                  fullWidth
                  required
                  error={formData.estimatedDuration === null}
                  helperText={formData.estimatedDuration === null ? "Duration is required" : "Enter number of days for repair"}
                  InputProps={{
                    inputProps: { 
                      min: 1,
                      pattern: '[0-9]*'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={formData.deliveryDate}
                  onChange={(date) => {
                    if (!date) {
                      // If date is cleared, also clear duration
                      handleImmediateFormChange("deliveryDate", null);
                      handleImmediateFormChange("estimatedDuration", null);
                    } else {
                      const duration = differenceInDays(date, new Date(formData.createdAt));
                      setFormData(prev => ({
                        ...prev,
                        deliveryDate: date,
                        estimatedDuration: Math.max(1, duration)
                      }));
                    }
                  }}
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                  customInput={
                    <TextField
                      label="Expected Delivery Date"
                      fullWidth
                      required
                      error={formData.deliveryDate === null}
                      helperText={formData.deliveryDate === null ? "Delivery date is required" : ""}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Calendar size={20} />
                          </InputAdornment>
                        )
                      }}
                    />
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Payment & Status
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel id="payment-status-label">
                    Payment Status
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="payment-status-label"
                    name="payment-status"
                    value={formData.paymentStatus}
                    onChange={(e) =>
                      handleImmediateFormChange("paymentStatus", e.target.value)
                    }
                  >
                    <FormControlLabel
                      value="paid"
                      control={<Radio />}
                      label="Paid"
                    />
                    <FormControlLabel
                      value="not_paid"
                      control={<Radio />}
                      label="Not Paid"
                    />
                    <FormControlLabel
                      value="partial"
                      control={<Radio />}
                      label="Partial Payment"
                    />
                  </RadioGroup>
                </FormControl>

                {formData.paymentStatus === "partial" && (
                  <TextField
                    label="Partial Payment Amount"
                    fullWidth
                    type="number"
                    value={formData.partialPaymentAmount}
                    onChange={(e) =>
                      handleImmediateFormChange(
                        "partialPaymentAmount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">D</InputAdornment>
                      ),
                    }}
                    sx={{ mt: 2 }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Repair Status</FormLabel>
                  <RadioGroup
                    row
                    value={formData.repairStatus}
                    onChange={(e) => handleImmediateFormChange("repairStatus", e.target.value)}
                  >
                    {(editMode ? allRepairStatusOptions : repairStatusOptions).map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={
                          <Radio 
                            sx={{
                              color: `${option.color}.main`,
                              '&.Mui-checked': {
                                color: `${option.color}.main`,
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              size="small"
                              label={option.label}
                              color={option.color}
                              sx={{ mr: 1 }}
                            />
                          </Box>
                        }
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Additional Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleImmediateFormChange("notes", e.target.value)}
                  placeholder="Any additional notes about this repair"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Documentation
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Upload images of the vehicle to document its condition
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Camera />}
                  >
                    Upload Images
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Box>

                {formData.images.length > 0 && (
                  <Box
                    sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}
                  >
                    {formData.images.map((image, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "1px solid #ccc",
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Vehicle image ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bgcolor: "rgba(255,255,255,0.7)",
                          }}
                          onClick={() => {
                            const updatedImages = [...formData.images];
                            updatedImages.splice(index, 1);
                            handleImmediateFormChange("images", updatedImages);
                          }}
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeClientForm}>Cancel</Button>
            <Button
              onClick={handleSubmitClient}
              variant="contained"
              color="primary"
              disabled={isSubmitting || isLoading}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? "Saving..." : (editMode ? "Update" : "Add")} Client
            </Button>
          </DialogActions>
        </Dialog>
        {/* Client History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2
            }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <FileText size={20} />
                </Avatar>
                <Box>
                  <Typography variant="h6" component="div">
                    {selectedClientForHistory?.clientName}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Service History
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={selectedClientForHistory?.repairStatus.replace("_", " ")}
                  color={getRepairStatusColor(selectedClientForHistory?.repairStatus)}
                  size="small"
                />
                <Chip
                  label={selectedClientForHistory?.paymentStatus.replace("_", " ")}
                  color={getPaymentStatusColor(selectedClientForHistory?.paymentStatus)}
                  size="small"
                  icon={getPaymentStatusIcon(selectedClientForHistory?.paymentStatus)}
                />
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {clientHistory.length > 0 ? (
              <>
                {/* Vehicle Information Card */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Vehicle Details
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Truck size={16} />
                          <Typography variant="body1">
                            {selectedClientForHistory?.carDetails.year}{" "}
                            {selectedClientForHistory?.carDetails.make}{" "}
                            {selectedClientForHistory?.carDetails.model}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          License: {selectedClientForHistory?.carDetails.licensePlate}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Contact Information
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <User size={16} />
                          <Typography variant="body2">
                            {selectedClientForHistory?.phoneNumber}
                          </Typography>
                        </Box>
                        {selectedClientForHistory?.email && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {selectedClientForHistory?.email}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Service History Timeline */}
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                  Service Records
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  '& .MuiAccordion-root': {
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: '8px 0',
                      boxShadow: 2
                    }
                  }
                }}>
                  {clientHistory.map((record, index) => (
                    <Accordion 
                      key={index}
                      sx={{ 
                        borderLeft: '4px solid',
                        borderColor: getRepairStatusColor(record.repairStatus)
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ChevronDown />}
                        aria-controls={`history-content-${index}`}
                        id={`history-header-${index}`}
                        sx={{
                          '& .MuiAccordionSummary-content': {
                            margin: '12px 0'
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: "flex", 
                          alignItems: "center", 
                          width: "100%",
                          gap: 2
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            minWidth: { xs: 'auto', sm: '200px' }
                          }}>
                            <Calendar size={16} style={{ marginRight: 8 }} />
                            <Typography variant="body2">
                              {formatDate(record.date)}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            flex: 1,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: { xs: 1, sm: 2 }
                          }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {record.procedures.map((p) => p.label).join(", ")}
                            </Typography>
                            <Chip
                              label={record.repairStatus.replace("_", " ")}
                              color={getRepairStatusColor(record.repairStatus)}
                              size="small"
                              sx={{ 
                                height: 24,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {record.procedures.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Procedures Performed
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {record.procedures.map((procedure, idx) => (
                                  <Chip
                                    key={idx}
                                    label={procedure.label}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      height: 24,
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          )}
                          
                          {record.estimatedCost && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Estimated Cost
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DollarSign size={16} />
                                <Typography variant="body1">
                                  {record.estimatedCost.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          
                          {record.estimatedDuration && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Estimated Duration
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Clock size={16} />
                                <Typography variant="body1">
                                  {record.estimatedDuration} day{record.estimatedDuration !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          
                          {record.notes && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Notes
                              </Typography>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2,
                                  bgcolor: 'background.default',
                                  borderRadius: 1
                                }}
                              >
                                <Typography variant="body2">
                                  {record.notes}
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                          
                          {record.images && record.images.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Service Images
                              </Typography>
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                flexWrap: 'wrap',
                                '& img': {
                                  width: 100,
                                  height: 100,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  cursor: 'pointer'
                                }
                              }}>
                                {record.images.map((image, idx) => (
                                  <img 
                                    key={idx}
                                    src={image}
                                    alt={`Service image ${idx + 1}`}
                                    onClick={() => window.open(image, '_blank')}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{
                display: "flex",
                flexDirection: 'column',
                justifyContent: "center",
                alignItems: "center",
                height: 200,
                gap: 2
              }}>
                <FileText size={48} color="#ccc" />
                <Typography variant="subtitle1" color="text.secondary">
                  No service history found for this client
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setHistoryDialogOpen(false)}
              variant="outlined"
            >
              Close
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setHistoryDialogOpen(false);
                openClientForm(selectedClientForHistory);
              }}
            >
              Update Record
            </Button>
          </DialogActions>
        </Dialog>
        {/* Pre-Delivery Documentation Dialog */}
        <Dialog
          open={showPreDeliveryDialog}
          onClose={() => setShowPreDeliveryDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckCircle size={20} style={{ marginRight: 8 }} />
              Confirm Delivery
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please confirm that the vehicle is ready for delivery to the client.
            </Alert>

            <Typography variant="subtitle1" gutterBottom>
              Vehicle: {selectedClient?.carDetails.year}{" "}
              {selectedClient?.carDetails.make}{" "}
              {selectedClient?.carDetails.model} (
              {selectedClient?.carDetails.licensePlate})
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Notes:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter any additional notes about the delivery..."
                value={preDeliveryNotes}
                onChange={(e) => setPreDeliveryNotes(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreDeliveryDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompleteDelivery}
              startIcon={<CheckCircle />}
            >
              Mark as Delivered
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
              Are you sure you want to delete the client record for{" "}
              {clientToDelete?.clientName}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteClient} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        {/* Add new Client Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={closeClientDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <User size={20} style={{ marginRight: 8 }} />
                <Typography variant="h6">
                  Client Details: {selectedClientForDetails?.clientName}
                </Typography>
              </Box>
              <Box>
                <Button
                  size="small"
                  onClick={() => {
                    closeClientDetails();
                    openClientHistory(selectedClientForDetails);
                  }}
                  startIcon={<FileText size={16} />}
                >
                  View History
                </Button>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedClientForDetails && (
              <Grid container spacing={3}>
                {/* Client Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Client Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Name
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedClientForDetails.clientName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Contact
                      </Typography>
                      <Typography variant="body1" paragraph>
                        Phone: {selectedClientForDetails.phoneNumber}
                        {selectedClientForDetails.email && (
                          <Box component="span" sx={{ display: "block" }}>
                            Email: {selectedClientForDetails.email}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Vehicle Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Vehicle Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Vehicle Details
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedClientForDetails.carDetails?.year}{" "}
                        {selectedClientForDetails.carDetails?.make}{" "}
                        {selectedClientForDetails.carDetails?.model}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        License Plate
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedClientForDetails.carDetails?.licensePlate || "N/A"}
                      </Typography>
                      {selectedClientForDetails.carDetails?.vin && (
                        <>
                          <Typography variant="body2" color="textSecondary">
                            VIN
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {selectedClientForDetails.carDetails.vin}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Repair Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Repair Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Issue Description
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {selectedClientForDetails.issueDescription}
                        </Typography>
                        {selectedClientForDetails.preExistingIssues && (
                          <>
                            <Typography variant="body2" color="textSecondary">
                              Pre-existing Issues
                            </Typography>
                            <Typography variant="body1" paragraph>
                              {selectedClientForDetails.preExistingIssues}
                            </Typography>
                          </>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Procedures
                        </Typography>
                        <Box sx={{ mt: 1, mb: 2 }}>
                          {selectedClientForDetails.procedures?.length > 0 ? (
                            selectedClientForDetails.procedures.map((procedure, index) => (
                              <Chip
                                key={index}
                                label={procedure.label || procedure}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No procedures listed
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Estimated Duration
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {selectedClientForDetails.estimatedDuration} days
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Status and Payment Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Status and Payment
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Repair Status:
                          </Typography>
                          <Chip
                            label={selectedClientForDetails.repairStatus?.replace("_", " ")}
                            color={getStatusColor(selectedClientForDetails.repairStatus, "repair")}
                            icon={getStatusIcon(selectedClientForDetails.repairStatus, "repair")}
                          />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Payment Status:
                          </Typography>
                          <Chip
                            label={selectedClientForDetails.paymentStatus?.replace("_", " ")}
                            color={getStatusColor(selectedClientForDetails.paymentStatus, "payment")}
                            icon={getStatusIcon(selectedClientForDetails.paymentStatus, "payment")}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Dates
                        </Typography>
                        <Typography variant="body1">
                          Created: {formatDate(selectedClientForDetails.createdAt)}
                        </Typography>
                        {selectedClientForDetails.deliveryDate && (
                          <Typography variant="body1">
                            Expected Delivery: {formatDate(selectedClientForDetails.deliveryDate)}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Images Section */}
                {(selectedClientForDetails.images?.length > 0 || selectedClientForDetails.deliveryImages?.length > 0) && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Images
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedClientForDetails.images?.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Initial Images
                            </Typography>
                            <Box sx={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                              gap: 2,
                              '& img': {
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }
                            }}>
                              {selectedClientForDetails.images.map((image, index) => (
                                <Box
                                  key={index}
                                  component="img"
                                  src={typeof image === 'string' ? image : image.url}
                                  alt={`Initial image ${index + 1}`}
                                  onClick={() => window.open(typeof image === 'string' ? image : image.url, "_blank")}
                                  sx={{
                                    boxShadow: 1,
                                    '&:hover': {
                                      boxShadow: 3
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        {selectedClientForDetails.deliveryImages?.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Delivery Images
                            </Typography>
                            <Box sx={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                              gap: 2,
                              '& img': {
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }
                            }}>
                              {selectedClientForDetails.deliveryImages.map((image, index) => (
                                <Box
                                  key={index}
                                  component="img"
                                  src={typeof image === 'string' ? image : image.url}
                                  alt={`Delivery image ${index + 1}`}
                                  onClick={() => window.open(typeof image === 'string' ? image : image.url, "_blank")}
                                  sx={{
                                    boxShadow: 1,
                                    '&:hover': {
                                      boxShadow: 3
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Notes Section */}
                {selectedClientForDetails.notes && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body1">
                        {selectedClientForDetails.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeClientDetails}>Close</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                closeClientDetails();
                openClientForm(selectedClientForDetails);
              }}
            >
              Edit Client
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={confirmationDialog.open}
          onClose={closeConfirmationDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertTriangle size={20} />
              {confirmationDialog.title}
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
              {confirmationDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={closeConfirmationDialog}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmationDialog.onConfirm?.()}
              variant="contained"
              color="primary"
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default Clients;