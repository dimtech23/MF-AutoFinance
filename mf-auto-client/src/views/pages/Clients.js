import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import { clientsAPI } from "../../api.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  Users,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Search,
  Calendar,
  Check,
  CheckCircle,
  X,
  Tool,
  Clock,
  DollarSign,
  Info,
  AlertTriangle,
  Phone,
  Car,
  FilePlus,
  FileText,
  Camera,
  Clipboard,
  XCircle,
  Tag,
  ChevronDown,
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
  Tabs,
  Tab,
  TextareaAutosize,
  Stepper,
  Step,
  StepLabel,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
  ListItemAvatar,
} from "@mui/material";
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Predefined procedures for auto garage
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

// Payment status options
const paymentStatusOptions = [
  { value: "paid", label: "Paid" },
  { value: "not_paid", label: "Not Paid" },
  { value: "partial", label: "Partial Payment" },
];

// Repair status options
const repairStatusOptions = [
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const Clients = () => {
  const { token, userRole } = useContext(UserContext);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [showPreDeliveryDialog, setShowPreDeliveryDialog] = useState(false);
  const [clientToDeliver, setClientToDeliver] = useState(null);
  const [preDeliveryImages, setPreDeliveryImages] = useState([]);
  const [preDeliveryNotes, setPreDeliveryNotes] = useState("");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    carDetails: {
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      color: "",
      vin: "",
    },
    procedures: [],
    issueDescription: "",
    preExistingIssues: "",
    estimatedDuration: 1,
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    paymentStatus: "not_paid",
    partialPaymentAmount: 0,
    repairStatus: "waiting",
    notes: "",
    createdAt: new Date(),
    images: [],
  });

  // Client history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [clientHistory, setClientHistory] = useState([]);
  const [selectedClientForHistory, setSelectedClientForHistory] =
    useState(null);

  // Confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const response = await clientsAPI.getAll();
        setClients(response.data);
        setFilteredClients(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (token) {
      fetchClients();
    }
  }, [token]);

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

    // Update filtered clients
    setFilteredClients(result);
  }, [clients, searchTerm, filterStatus, startDate, endDate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Set filter based on tab
    if (newValue === "all") {
      setFilterStatus(null);
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
      // Edit mode
      setEditMode(true);
      setSelectedClient(client);
      setFormData({
        clientName: client.clientName,
        phoneNumber: client.phoneNumber,
        carDetails: { ...client.carDetails },
        procedures: client.procedures,
        issueDescription: client.issueDescription,
        preExistingIssues: client.preExistingIssues,
        estimatedDuration: client.estimatedDuration,
        deliveryDate: new Date(client.deliveryDate),
        paymentStatus: client.paymentStatus,
        partialPaymentAmount: client.partialPaymentAmount,
        repairStatus: client.repairStatus,
        notes: client.notes || "",
        createdAt: new Date(client.createdAt),
        images: client.images || [],
      });
    } else {
      // Add mode
      setEditMode(false);
      setSelectedClient(null);
      setFormData({
        clientName: "",
        phoneNumber: "",
        carDetails: {
          make: "",
          model: "",
          year: "",
          licensePlate: "",
          color: "",
          vin: "",
        },
        procedures: [],
        issueDescription: "",
        preExistingIssues: "",
        estimatedDuration: 1,
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        paymentStatus: "not_paid",
        partialPaymentAmount: 0,
        repairStatus: "waiting",
        notes: "",
        createdAt: new Date(),
        images: [],
      });
    }
    setFormOpen(true);
  };

  const closeClientForm = () => {
    setFormOpen(false);
  };

  const handleFormChange = (field, value) => {
    if (field.includes(".")) {
      const [parentField, childField] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

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

  const handleSubmitClient = async () => {
    // Validate form
    if (!formData.clientName || !formData.phoneNumber) {
      toast.error("Please enter client name and phone number");
      return;
    }
  
    if (
      !formData.carDetails.make ||
      !formData.carDetails.model ||
      !formData.carDetails.licensePlate
    ) {
      toast.error("Please enter vehicle details");
      return;
    }
  
    if (formData.procedures.length === 0) {
      toast.error("Please select at least one repair procedure");
      return;
    }
  
    if (!formData.issueDescription) {
      toast.error("Please enter issue description");
      return;
    }
  
    if (
      formData.paymentStatus === "partial" &&
      (!formData.partialPaymentAmount || formData.partialPaymentAmount <= 0)
    ) {
      toast.error("Please enter partial payment amount");
      return;
    }
  
    try {
      let response;
      if (editMode && selectedClient) {
        response = await clientsAPI.update(selectedClient.id, formData);
        
        // Update local state
        const updatedClients = clients.map(client => 
          client.id === selectedClient.id ? response.data : client
        );
        setClients(updatedClients);
        toast.success("Client record updated successfully");
      } else {
        response = await clientsAPI.create(formData);
        
        // Update local state
        setClients([response.data, ...clients]);
        toast.success("Client added successfully");
      }
      
      // Close the form
      closeClientForm();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(error.response?.data?.message || "Failed to save client");
    }
  };

  const openDeleteConfirmation = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

const handleDeleteClient = async () => {
  if (!clientToDelete) return;
  
  try {
    await clientsAPI.delete(clientToDelete.id);
    
    // Update local state
    const updatedClients = clients.filter(client => client.id !== clientToDelete.id);
    setClients(updatedClients);
    toast.success("Client record deleted successfully");
    setDeleteDialogOpen(false);
  } catch (error) {
    console.error("Error deleting client:", error);
    toast.error("Failed to delete client");
    setDeleteDialogOpen(false);
  }
};

const handleUpdateStatus = async (clientId, newStatus) => {
  try {
    await clientsAPI.updateStatus(clientId, newStatus);
    
    // Update local state
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          repairStatus: newStatus
        };
      }
      return client;
    });
    
    setClients(updatedClients);
    toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error("Failed to update status");
  }
};

const handleUpdatePayment = async (clientId, newPaymentStatus, amount = 0) => {
  try {
    await clientsAPI.updatePayment(clientId, { 
      paymentStatus: newPaymentStatus,
      partialPaymentAmount: newPaymentStatus === 'partial' ? amount : 0 
    });
    
    // Update local state
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          paymentStatus: newPaymentStatus,
          partialPaymentAmount: newPaymentStatus === 'partial' ? amount : 0
        };
      }
      return client;
    });
    
    setClients(updatedClients);
    toast.success(`Payment status updated to ${newPaymentStatus.replace("_", " ")}`);
  } catch (error) {
    console.error("Error updating payment status:", error);
    toast.error("Failed to update payment status");
  }
};

  const openPreDeliveryDialog = (client) => {
    setClientToDeliver(client);
    setPreDeliveryImages([]);
    setPreDeliveryNotes("");
    setShowPreDeliveryDialog(true);
  };

  const handleDeliveryImageUpload = (e) => {
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

      setPreDeliveryImages([...preDeliveryImages, ...newImages]);
      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!clientToDeliver) return;
  
    try {
      // First, upload any delivery images
      // In a real implementation, you would upload images to your server
      // For now, we'll just send the URLs
      const deliveryData = {
        deliveryNotes: preDeliveryNotes,
        deliveryImages: preDeliveryImages
      };
      
      const response = await clientsAPI.markDelivered(clientToDeliver.id, deliveryData);
      
      // Update local state
      const updatedClients = clients.map(client => {
        if (client.id === clientToDeliver.id) {
          return response.data;
        }
        return client;
      });
      
      setClients(updatedClients);
      toast.success("Vehicle marked as delivered");
      setShowPreDeliveryDialog(false);
    } catch (error) {
      console.error("Error completing delivery:", error);
      toast.error("Failed to mark vehicle as delivered");
    }
  };

  const openClientHistory = async (client) => {
    setSelectedClientForHistory(client);
  
    try {
      const response = await clientsAPI.getHistory(client.id);
      setClientHistory(response.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error("Error fetching client history:", error);
      toast.error("Failed to load client history");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Client",
      "Phone",
      "Vehicle",
      "Procedures",
      "Issue",
      "Status",
      "Payment Status",
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

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `clients_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };

  const getRepairStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "warning";
      case "in_progress":
        return "info";
      case "completed":
        return "success";
      case "delivered":
        return "primary";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getRepairStatusIcon = (status) => {
    switch (status) {
      case "waiting":
        return <Clock size={16} />;
      case "in_progress":
        return <Tool size={16} />;
      case "completed":
        return <Check size={16} />;
      case "delivered":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <X size={16} />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "not_paid":
        return "error";
      case "partial":
        return "warning";
      default:
        return "default";
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} />;
      case "not_paid":
        return <XCircle size={16} />;
      case "partial":
        return <DollarSign size={16} />;
      default:
        return null;
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
      <Header />
      <Container
        maxWidth={false}
        sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}
      >
        {" "}
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus />}
            onClick={() => openClientForm()}
          >
            New Client
          </Button>
        </Box>
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
                    <Tool size={20} />
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
              onView={openClientHistory}
              onEdit={openClientForm}
              onDelete={openDeleteConfirmation}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePayment={handleUpdatePayment}
              onMarkDelivered={openPreDeliveryDialog}
              getRepairStatusColor={getRepairStatusColor}
              getRepairStatusIcon={getRepairStatusIcon}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusIcon={getPaymentStatusIcon}
              formatDate={formatDate}
            />
          </Box>
        </Box>
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
                    handleFormChange("clientName", e.target.value)
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
                    handleFormChange("phoneNumber", e.target.value)
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

              <Grid item xs={12} md={4}>
                <TextField
                  label="Make"
                  fullWidth
                  required
                  value={formData.carDetails.make}
                  onChange={(e) =>
                    handleFormChange("carDetails.make", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Model"
                  fullWidth
                  required
                  value={formData.carDetails.model}
                  onChange={(e) =>
                    handleFormChange("carDetails.model", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Year"
                  fullWidth
                  value={formData.carDetails.year}
                  onChange={(e) =>
                    handleFormChange("carDetails.year", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="License Plate"
                  fullWidth
                  required
                  value={formData.carDetails.licensePlate}
                  onChange={(e) =>
                    handleFormChange("carDetails.licensePlate", e.target.value)
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
                <TextField
                  label="Color"
                  fullWidth
                  value={formData.carDetails.color}
                  onChange={(e) =>
                    handleFormChange("carDetails.color", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="VIN (Optional)"
                  fullWidth
                  value={formData.carDetails.vin}
                  onChange={(e) =>
                    handleFormChange("carDetails.vin", e.target.value)
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
                    handleFormChange("procedures", selectedOptions || [])
                  }
                  placeholder="Select repair procedures..."
                  isSearchable
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
                    handleFormChange("issueDescription", e.target.value)
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
                    handleFormChange("preExistingIssues", e.target.value)
                  }
                  placeholder="Document any pre-existing damage or issues (dents, scratches, etc.)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Estimated Duration (days)"
                  type="number"
                  fullWidth
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    handleFormChange(
                      "estimatedDuration",
                      parseInt(e.target.value) || 1
                    )
                  }
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={formData.deliveryDate}
                  onChange={(date) => handleFormChange("deliveryDate", date)}
                  dateFormat="MMMM d, yyyy"
                  customInput={
                    <TextField
                      label="Expected Delivery Date"
                      fullWidth
                      required
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
                      handleFormChange("paymentStatus", e.target.value)
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
                      handleFormChange(
                        "partialPaymentAmount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    sx={{ mt: 2 }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel id="repair-status-label">Repair Status</FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="repair-status-label"
                    name="repair-status"
                    value={formData.repairStatus}
                    onChange={(e) =>
                      handleFormChange("repairStatus", e.target.value)
                    }
                  >
                    <FormControlLabel
                      value="waiting"
                      control={<Radio />}
                      label="Waiting"
                    />
                    <FormControlLabel
                      value="in_progress"
                      control={<Radio />}
                      label="In Progress"
                    />
                    <FormControlLabel
                      value="completed"
                      control={<Radio />}
                      label="Completed"
                    />
                    <FormControlLabel
                      value="delivered"
                      control={<Radio />}
                      label="Delivered"
                    />
                    <FormControlLabel
                      value="cancelled"
                      control={<Radio />}
                      label="Cancelled"
                    />
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
                  onChange={(e) => handleFormChange("notes", e.target.value)}
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
                            handleFormChange("images", updatedImages);
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
            >
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Client History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <FileText size={20} style={{ marginRight: 8 }} />
              Client History: {selectedClientForHistory?.clientName}
            </Box>
          </DialogTitle>
          <DialogContent>
            {clientHistory.length > 0 ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Vehicle: {selectedClientForHistory?.carDetails.year}{" "}
                  {selectedClientForHistory?.carDetails.make}{" "}
                  {selectedClientForHistory?.carDetails.model} (
                  {selectedClientForHistory?.carDetails.licensePlate})
                </Typography>

                <Box sx={{ mt: 3 }}>
                  {clientHistory.map((record, index) => (
                    <Accordion key={index} sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ChevronDown />}
                        aria-controls={`history-content-${index}`}
                        id={`history-header-${index}`}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography>
                            {formatDate(record.date)} -{" "}
                            {record.procedures.map((p) => p.label).join(", ")}
                          </Typography>
                          <Chip
                            label={record.repairStatus.replace("_", " ")}
                            color={getRepairStatusColor(record.repairStatus)}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">
                              Issue Description:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {record.issueDescription}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">
                              Procedures:
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {record.procedures.map((procedure, i) => (
                                <Chip
                                  key={i}
                                  label={procedure.label}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">
                              Payment Status:
                            </Typography>
                            <Chip
                              label={record.paymentStatus.replace("_", " ")}
                              color={getPaymentStatusColor(
                                record.paymentStatus
                              )}
                              icon={getPaymentStatusIcon(record.paymentStatus)}
                              sx={{ mt: 1 }}
                            />
                          </Grid>

                          {record.notes && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2">
                                Notes:
                              </Typography>
                              <Typography variant="body2">
                                {record.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200,
                }}
              >
                <Typography variant="subtitle1" color="textSecondary">
                  No previous records found for this client
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
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
              Delivery Documentation
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Take photos of the vehicle and document its condition before
              delivery to the client.
            </Alert>

            <Typography variant="subtitle1" gutterBottom>
              Vehicle: {clientToDeliver?.carDetails.year}{" "}
              {clientToDeliver?.carDetails.make}{" "}
              {clientToDeliver?.carDetails.model} (
              {clientToDeliver?.carDetails.licensePlate})
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Delivery Images:
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Camera />}
                sx={{ mb: 2 }}
              >
                Take Photos
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleDeliveryImageUpload}
                />
              </Button>

              {preDeliveryImages.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                  {preDeliveryImages.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        width: 120,
                        height: 120,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid #ccc",
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`Delivery image ${index + 1}`}
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
                          const updatedImages = [...preDeliveryImages];
                          updatedImages.splice(index, 1);
                          setPreDeliveryImages(updatedImages);
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Delivery Notes:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter notes about vehicle condition, items returned to customer, etc."
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
      </Container>
    </>
  );
};

// Separate table component
const ClientsTable = ({
  clients,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdatePayment,
  onMarkDelivered,
  getRepairStatusColor,
  getRepairStatusIcon,
  getPaymentStatusColor,
  getPaymentStatusIcon,
  formatDate,
}) => {
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState(null);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState("");
  const [showPartialDialog, setShowPartialDialog] = useState(false);

  const handleStatusMenuOpen = (event, clientId) => {
    setStatusMenuAnchorEl(event.currentTarget);
    setSelectedClientId(clientId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
    setSelectedClientId(null);
  };

  const handlePaymentMenuOpen = (event, clientId) => {
    setPaymentMenuAnchorEl(event.currentTarget);
    setSelectedClientId(clientId);
  };

  const handlePaymentMenuClose = () => {
    setPaymentMenuAnchorEl(null);
    setSelectedClientId(null);
  };

  const handleStatusUpdate = (newStatus) => {
    if (selectedClientId) {
      onUpdateStatus(selectedClientId, newStatus);
    }
    handleStatusMenuClose();
  };

  const handlePaymentUpdate = (newStatus) => {
    if (selectedClientId) {
      if (newStatus === "partial") {
        setShowPartialDialog(true);
      } else {
        onUpdatePayment(selectedClientId, newStatus);
      }
    }
    handlePaymentMenuClose();
  };

  const handlePartialPaymentSubmit = () => {
    if (selectedClientId && partialPaymentAmount) {
      onUpdatePayment(
        selectedClientId,
        "partial",
        parseFloat(partialPaymentAmount)
      );
      setShowPartialDialog(false);
      setPartialPaymentAmount("");
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="clients table">
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Issue & Procedures</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell align="center">Repair Status</TableCell>
              <TableCell align="center">Payment</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 5 }}>
                    No clients found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle2">
                        {client.clientName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {client.phoneNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle2">
                        {client.carDetails.year} {client.carDetails.make}{" "}
                        {client.carDetails.model}
                      </Typography>
                      <Chip
                        label={client.carDetails.licensePlate}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, maxWidth: "fit-content" }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={client.issueDescription}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {client.issueDescription}
                      </Typography>
                    </Tooltip>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      {client.procedures.slice(0, 2).map((procedure, i) => (
                        <Chip
                          key={i}
                          label={procedure.label}
                          size="small"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                      {client.procedures.length > 2 && (
                        <Chip
                          label={`+${client.procedures.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ mr: 1 }}>
                          Created:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(client.createdAt)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                      >
                        <Typography variant="caption" sx={{ mr: 1 }}>
                          Delivery:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(client.deliveryDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        color={getRepairStatusColor(client.repairStatus)}
                        startIcon={getRepairStatusIcon(client.repairStatus)}
                        onClick={(e) => handleStatusMenuOpen(e, client.id)}
                        aria-haspopup="true"
                        aria-expanded={statusMenuAnchorEl ? "true" : undefined}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {client.repairStatus.replace("_", " ")}
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        color={getPaymentStatusColor(client.paymentStatus)}
                        startIcon={getPaymentStatusIcon(client.paymentStatus)}
                        onClick={(e) => handlePaymentMenuOpen(e, client.id)}
                        aria-haspopup="true"
                        aria-expanded={paymentMenuAnchorEl ? "true" : undefined}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {client.paymentStatus === "partial"
                          ? `Partial (${client.partialPaymentAmount})`
                          : client.paymentStatus.replace("_", " ")}
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Tooltip title="View History">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onView(client)}
                        >
                          <FileText size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Client">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEdit(client)}
                        >
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      {client.repairStatus === "completed" && (
                        <Tooltip title="Mark as Delivered">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onMarkDelivered(client)}
                          >
                            <CheckCircle size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(client)}
                        >
                          <Trash2 size={18} />
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

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchorEl}
        open={Boolean(statusMenuAnchorEl)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusUpdate("waiting")}>
          <ListItemIcon>
            <Clock size={16} />
          </ListItemIcon>
          Waiting
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("in_progress")}>
          <ListItemIcon>
            <Tool size={16} />
          </ListItemIcon>
          In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("completed")}>
          <ListItemIcon>
            <Check size={16} />
          </ListItemIcon>
          Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("delivered")}>
          <ListItemIcon>
            <CheckCircle size={16} />
          </ListItemIcon>
          Delivered
        </MenuItem>
        <MenuItem onClick={() => handleStatusUpdate("cancelled")}>
          <ListItemIcon>
            <X size={16} />
          </ListItemIcon>
          Cancelled
        </MenuItem>
      </Menu>

      {/* Payment Change Menu */}
      <Menu
        anchorEl={paymentMenuAnchorEl}
        open={Boolean(paymentMenuAnchorEl)}
        onClose={handlePaymentMenuClose}
      >
        <MenuItem onClick={() => handlePaymentUpdate("paid")}>
          <ListItemIcon>
            <CheckCircle size={16} />
          </ListItemIcon>
          Paid
        </MenuItem>
        <MenuItem onClick={() => handlePaymentUpdate("not_paid")}>
          <ListItemIcon>
            <XCircle size={16} />
          </ListItemIcon>
          Not Paid
        </MenuItem>
        <MenuItem onClick={() => handlePaymentUpdate("partial")}>
          <ListItemIcon>
            <DollarSign size={16} />
          </ListItemIcon>
          Partial Payment
        </MenuItem>
      </Menu>

      {/* Partial Payment Dialog */}
      <Dialog
        open={showPartialDialog}
        onClose={() => setShowPartialDialog(false)}
      >
        <DialogTitle>Enter Partial Payment Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={partialPaymentAmount}
            onChange={(e) => setPartialPaymentAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPartialDialog(false)}>Cancel</Button>
          <Button onClick={handlePartialPaymentSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Clients;
