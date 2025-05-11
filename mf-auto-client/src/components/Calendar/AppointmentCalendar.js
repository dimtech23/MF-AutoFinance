import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../Context/UserContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import { appointmentsAPI,appointmentAPI, clientsAPI } from "../../api";
import {
  mapStatus,
  // getStatusColor,
  shouldCreateInvoice,
} from "../../utility/statusMapper.js";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Calendar,
  CheckCircle,
  Clock,
  Tool,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Truck,
  DollarSign,
  FileText,
  Camera,
} from "react-feather";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addDays,
  isToday,
} from "date-fns";

// Status options for appointments
const appointmentStatusOptions = [
  { value: "scheduled", label: "Scheduled", color: "primary" },
  { value: "in_progress", label: "In Progress", color: "info" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "error" },
  { value: "waiting", label: "Waiting", color: "warning" },
];

// Type options for appointments
const appointmentTypeOptions = [
  { value: "repair", label: "Repair", icon: <Tool size={16} /> },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: <CheckCircle size={16} />,
  },
  { value: "inspection", label: "Inspection", icon: <FileText size={16} /> },
  { value: "invoice", label: "Invoice", icon: <DollarSign size={16} /> },
  { value: "delivery", label: "Delivery", icon: <Truck size={16} /> },
  {
    value: "documentation",
    label: "Documentation",
    icon: <Camera size={16} />,
  },
];

// Map repair status to appointment status
const mapRepairStatusToAppointmentStatus = {
  waiting: "scheduled",
  in_progress: "in_progress",
  completed: "completed",
  delivered: "completed",
  cancelled: "cancelled",
};

const AppointmentCalendar = ({
  clients = [],
  invoices = [],
  onCreateInvoiceFromAppointment = null,
  onError = null
}) => {
  const { token } = useContext(UserContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // State for the appointment form
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    date: new Date(),
    time: "10:00",
    clientId: "",
    clientName: "",
    vehicleInfo: "",
    type: "repair",
    status: "scheduled",
    description: "",
    invoiceId: "",
    createdBy: "",
  });

  // State for filtering
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Add error handling wrapper for API calls
  const handleApiError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    // Don't set error state for 404 or when no clients exist
    if (error?.response?.status === 404 || error?.response?.status === 504) {
      console.log(`No ${context} available`);
      return null;
    }
    const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${context}`;
    setError(errorMessage);
    if (onError) {
      onError(new Error(errorMessage));
    }
    return null;
  };

  // Filter appointments based on active filters
  const filterAppointments = useCallback(
    (allAppointments, status, type, date, showAll) => {
      if (!allAppointments || allAppointments.length === 0) {
        console.log("No appointments to filter");
        setFilteredAppointments([]);
        return;
      }

      console.log("Filtering appointments:", {
        total: allAppointments.length,
        status,
        type,
        date: date ? format(date, "yyyy-MM-dd") : null,
        showAll,
      });

      let filtered = [...allAppointments];

      // Filter by status if not "all"
      if (status !== "all") {
        filtered = filtered.filter(
          (appointment) => appointment.status === status
        );
      }

      // Filter by type if not "all"
      if (type !== "all") {
        filtered = filtered.filter((appointment) => appointment.type === type);
      }

      // Filter by selected date if not showing all
      if (!showAll && date) {
        filtered = filtered.filter((appointment) => {
          if (!appointment.date) return false;

          const appointmentDate = new Date(appointment.date);
          // Compare only the year, month, and day components
          const result =
            appointmentDate.getFullYear() === date.getFullYear() &&
            appointmentDate.getMonth() === date.getMonth() &&
            appointmentDate.getDate() === date.getDate();

          return result;
        });
      }

      console.log(`Filtered to ${filtered.length} appointments`);
      setFilteredAppointments(filtered);
    },
    []
  );

  // Format client options from props
  const formatClientOptions = useCallback((clientsList) => {
    if (!clientsList || !clientsList.length) return [];

    return clientsList.map((client) => ({
      id: client.id || client._id,
      clientName: client.clientName,
      vehicleInfo: client.carDetails
        ? `${client.carDetails.year || ""} ${client.carDetails.make || ""} ${
            client.carDetails.model || ""
          }`.trim()
        : "Vehicle info not available",
      issueDescription: client.issueDescription || "",
      repairStatus: client.repairStatus || "waiting",
    }));
  }, []);

  // Generate appointments from clients and invoices data
  const generateAppointmentsFromData = useCallback(
    (clientsList = [], invoicesList = []) => {
      console.log("Generating appointments from data:", {
        clientsCount: clientsList.length,
        invoicesCount: invoicesList.length,
      });

      const generatedAppointments = [];

      // Process client data to create appointments
      clientsList.forEach((client, index) => {
        // Create initial appointment for when the vehicle was dropped off
        const dropOffDate = client.createdAt
          ? new Date(client.createdAt)
          : new Date();

        generatedAppointments.push({
          id: `client-dropoff-${client.id || client._id || index}`,
          title: `Initial Assessment - ${client.clientName}`,
          date: dropOffDate,
          time: format(dropOffDate, "HH:mm"),
          clientId: client.id || client._id || index,
          clientName: client.clientName,
          vehicleInfo: client.carDetails
            ? `${client.carDetails.year || ""} ${
                client.carDetails.make || ""
              } ${client.carDetails.model || ""}`.trim()
            : "Vehicle info not available",
          type: "inspection",
          status: "completed",
          description:
            client.issueDescription ||
            `Initial assessment for ${client.clientName}`,
          invoiceId: "",
          createdBy: client.createdBy || "",
          createdAt: dropOffDate,
        });

        // Add appointment for ongoing work or delivery based on repair status
        let workAppointmentDate;

        if (client.deliveryDate) {
          workAppointmentDate = new Date(client.deliveryDate);
        } else {
          // If no delivery date, create an appointment in the future based on estimated duration
          const duration = client.estimatedDuration || 3; // Default to 3 days if not specified
          workAppointmentDate = addDays(dropOffDate, duration);
        }

        // Determine appointment type and status based on client's repair status
        const repairStatus = client.repairStatus || "waiting";
        const appointmentStatus =
          mapRepairStatusToAppointmentStatus[repairStatus] || "scheduled";
        const appointmentType =
          repairStatus === "delivered" ? "delivery" : "repair";

        generatedAppointments.push({
          id: `client-work-${client.id || client._id || index}`,
          title:
            repairStatus === "delivered"
              ? `Delivery - ${client.clientName}`
              : `${repairStatus === "completed" ? "Completed" : "Service"} - ${
                  client.clientName
                }`,
          date: workAppointmentDate,
          time: format(workAppointmentDate, "HH:mm"),
          clientId: client.id || client._id || index,
          clientName: client.clientName,
          vehicleInfo: client.carDetails
            ? `${client.carDetails.year || ""} ${
                client.carDetails.make || ""
              } ${client.carDetails.model || ""}`.trim()
            : "Vehicle info not available",
          type: appointmentType,
          status: appointmentStatus,
          description:
            client.issueDescription || `Service for ${client.clientName}`,
          invoiceId: "",
          createdBy: client.createdBy || "",
          createdAt: dropOffDate,
        });
      });

      // Add appointments for invoices
      if (invoicesList && invoicesList.length > 0) {
        invoicesList.forEach((invoice, index) => {
          const invoiceDate = invoice.createdAt
            ? new Date(invoice.createdAt)
            : invoice.issueDate
            ? new Date(invoice.issueDate)
            : new Date();

          generatedAppointments.push({
            id: `invoice-${invoice.id || invoice._id || index}`,
            title: `Invoice Review - ${
              invoice.customerInfo?.name ||
              invoice.customerName ||
              `Customer ${index + 1}`
            }`,
            date: invoiceDate,
            time: format(invoiceDate, "HH:mm"),
            clientId: invoice.customerInfo?.id || invoice.clientId || "",
            clientName:
              invoice.customerInfo?.name ||
              invoice.customerName ||
              `Customer ${index + 1}`,
            vehicleInfo: invoice.vehicleInfo
              ? `${invoice.vehicleInfo.year || ""} ${
                  invoice.vehicleInfo.make || ""
                } ${invoice.vehicleInfo.model || ""}`.trim()
              : "",
            type: "invoice",
            status: "scheduled",
            description: `Review invoice #${
              invoice.invoiceNumber || index + 1
            }`,
            invoiceId: invoice.id || invoice._id || index,
            createdBy: invoice.createdBy || "",
            createdAt: invoiceDate,
          });
        });
      }

      console.log(`Generated ${generatedAppointments.length} appointments`);
      return generatedAppointments;
    },
    []
  );

  // Fetch clients data from API if not provided via props
  const fetchClients = useCallback(async () => {
    try {
      console.log("Fetching clients data...");
      
      if (!token) {
        console.log("Token not available yet, skipping clients fetch");
        return [];
      }
      
      const response = await axios.get("/api/clients", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }).catch(error => {
        // Handle 404 and 504 gracefully
        if (error?.response?.status === 404 || error?.response?.status === 504) {
          console.log("No clients available or server timeout");
          return { data: [] };
        }
        throw handleApiError(error, 'fetch clients');
      });
      
      if (!response) return []; // Error was handled
      
      if (response.data && response.data.length > 0) {
        console.log(`Fetched ${response.data.length} clients successfully`);
        setClientOptions(formatClientOptions(response.data));
        return response.data;
      } else {
        console.log("No clients found in the response");
        setClientOptions([]);
        return [];
      }
    } catch (error) {
      console.error("Error in fetchClients:", error);
      handleApiError(error, 'fetch clients');
      return [];
    }
  }, [token, formatClientOptions, onError]);

  // Fetch appointments from the API
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching appointments for ${format(currentMonth, "MMMM yyyy")}`);

      // Get the first day of the month
      const firstDay = startOfMonth(currentMonth);
      // Get the last day of the month
      const lastDay = endOfMonth(currentMonth);

      // Log the API request details
      console.log('Appointment API Request:', {
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
        token: token ? 'Present' : 'Missing'
      });

      // Use appointmentAPI instead of direct axios call
      const response = await appointmentAPI.getAll({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
      }).catch(error => {
        throw handleApiError(error, 'fetch appointments');
      });

      if (!response) return; // Error was handled

      // Format appointments
      let fetchedAppointments = [];

      if (response.data && response.data.length > 0) {
        console.log(`Received ${response.data.length} appointments from API`);

        // Format API appointments
        fetchedAppointments = response.data.map((appointment) => ({
          id: appointment._id,
          title: appointment.title,
          date: new Date(appointment.date),
          time: appointment.time,
          clientId: appointment.clientId || "",
          clientName: appointment.clientName,
          vehicleInfo: appointment.vehicleInfo || "",
          type: appointment.type,
          status: appointment.status,
          description: appointment.description || "",
          invoiceId: appointment.invoiceId || "",
          createdBy: appointment.createdBy || "",
          createdAt: new Date(appointment.createdAt),
        }));
      } else {
        console.log("No appointments from API, generating from client data");
        // If no appointments from API, generate from clients and invoices
        fetchedAppointments = generateAppointmentsFromData(clients, invoices);
      }

      console.log(`Total appointments processed: ${fetchedAppointments.length}`);
      setAppointments(fetchedAppointments);

      // Filter for the selected date
      filterAppointments(
        fetchedAppointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );

      setLoading(false);
      return fetchedAppointments;
    } catch (error) {
      console.error("Error in fetchAppointments:", error);
      handleApiError(error, 'fetch appointments');
      setLoading(false);
      return [];
    }
  }, [
    currentMonth,
    token,
    clients,
    invoices,
    selectedDate,
    statusFilter,
    typeFilter,
    showAllAppointments,
    filterAppointments,
    generateAppointmentsFromData,
    onError
  ]);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      console.log("Initial data loading started");

      try {
        // Format client options from the provided clients prop
        if (clients && clients.length > 0) {
          console.log(`Using ${clients.length} clients from props`);
          const options = formatClientOptions(clients);
          setClientOptions(options);
        } else {
          // If clients weren't provided as props, fetch them from the API
          console.log("No clients in props, fetching from API");
          await fetchClients();
        }

        // Fetch appointments from API
        await fetchAppointments();
        setInitialLoadComplete(true);

        console.log("Initial data loading complete");
        setLoading(false);
      } catch (err) {
        console.error("Error initializing appointment calendar:", err);
        // Only set error if it's not a "no data" case
        if (err?.response?.status !== 404 && err?.response?.status !== 504) {
          setError("Failed to load calendar data. Please try again.");
        }
        setLoading(false);
      }
    };

    if (!initialLoadComplete) {
      fetchInitialData();
    }
  }, [clients, token, fetchClients, fetchAppointments, formatClientOptions, initialLoadComplete]);

  // Update appointments when currentMonth changes
  useEffect(() => {
    if (initialLoadComplete) {
      console.log("Month changed, refreshing appointments");
      fetchAppointments();
    }
  }, [currentMonth, fetchAppointments, initialLoadComplete]);

  // Update filtered appointments when relevant state changes
  useEffect(() => {
    if (appointments.length > 0) {
      console.log("Filter parameters changed, updating filtered appointments");
      filterAppointments(
        appointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );
    }
  }, [
    appointments,
    selectedDate,
    statusFilter,
    typeFilter,
    showAllAppointments,
    filterAppointments,
  ]);

  // Navigate to the next month
  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    console.log(`Navigating to next month: ${format(newMonth, "MMMM yyyy")}`);
    setCurrentMonth(newMonth);
  };

  // Navigate to the previous month
  const prevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    console.log(
      `Navigating to previous month: ${format(newMonth, "MMMM yyyy")}`
    );
    setCurrentMonth(newMonth);
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = useCallback(
    (day) => {
      return appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getFullYear() === day.getFullYear() &&
          appointmentDate.getMonth() === day.getMonth() &&
          appointmentDate.getDate() === day.getDate()
        );
      });
    },
    [appointments]
  );

  // Handle date selection in calendar
  const onDateClick = useCallback(
    (day) => {
      console.log(`Date clicked: ${format(day, "yyyy-MM-dd")}`);

      // Create a new date object to prevent reference issues
      const newSelectedDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      // Update the selected date
      setSelectedDate(newSelectedDate);
      setShowAllAppointments(false);

      console.log(
        `Selected date set to: ${format(newSelectedDate, "yyyy-MM-dd")}`
      );

      // Filter appointments for this day
      const dayAppointments = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getFullYear() === newSelectedDate.getFullYear() &&
          appointmentDate.getMonth() === newSelectedDate.getMonth() &&
          appointmentDate.getDate() === newSelectedDate.getDate()
        );
      });

      console.log(
        `Found ${dayAppointments.length} appointments for selected date`
      );

      // Update filtered appointments
      setFilteredAppointments(dayAppointments);
    },
    [appointments]
  );

  // Render calendar header
  const renderHeader = () => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={prevMonth}
            aria-label="Previous month"
            data-testid="prev-month-button"
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5" sx={{ mx: 2 }}>
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <IconButton
            onClick={nextMonth}
            aria-label="Next month"
            data-testid="next-month-button"
          >
            <ChevronRight />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus />}
          onClick={() => openAppointmentForm()}
          data-testid="add-appointment-button"
        >
          Add Appointment
        </Button>
      </Box>
    );
  };

  // Render days of the week header
  const renderDays = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <Grid container sx={{ mb: 1 }}>
        {weekDays.map((day, idx) => (
          <Grid
            item
            key={idx}
            xs={true}
            sx={{
              textAlign: "center",
              p: 1,
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
            }}
          >
            {day}
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render days in the calendar
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateFormat = "d";
    const rows = [];

    let days = [];

    // Get all days in month
    const daysInMonth = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    // Fill in the days of the week
    let dayOfWeekStart = startDate.getDay();
    for (let i = 0; i < dayOfWeekStart; i++) {
      days.push(
        <Grid
          item
          key={`empty-${i}`}
          xs={true}
          sx={{
            height: 120,
            border: "1px solid #eee",
            p: 1,
            bgcolor: "#f9f9f9",
          }}
        />
      );
    }

    // Add the days of the month
    for (let i = 0; i < daysInMonth.length; i++) {
      const day = daysInMonth[i];
      const formattedDate = format(day, dateFormat);

      // Get appointments for this day
      const dayAppointments = getAppointmentsForDay(day);

      // Check if this day is the selected date
      const isSelectedDate = isSameDay(day, selectedDate);

      // Check if this day is today
      const isCurrentDay = isToday(day);

      days.push(
        <Grid
          item
          key={day.toString()}
          xs={true}
          sx={{
            height: 120,
            border: "1px solid #eee",
            p: 1,
            position: "relative",
            bgcolor: isSelectedDate
              ? "primary.light"
              : isCurrentDay
              ? "#e6f7ff"
              : "white",
            "&:hover": {
              bgcolor: isSelectedDate ? "primary.light" : "#f5f5f5",
            },
            color: !isSameMonth(day, monthStart)
              ? "#ccc"
              : isCurrentDay
              ? "primary.main"
              : "inherit",
          }}
          data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
        >
          {/* This transparent overlay ensures clicks are captured */}
          <Box
            onClick={() => onDateClick(day)}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
              zIndex: 2,
            }}
            data-testid={`calendar-day-overlay-${format(day, "yyyy-MM-dd")}`}
          />

          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: 5,
              right: 8,
              fontWeight: isCurrentDay ? "bold" : "normal",
              color: isCurrentDay ? "primary.main" : "inherit",
              zIndex: 1,
            }}
          >
            {formattedDate}
          </Typography>

          {dayAppointments.length > 0 && (
            <Box sx={{ mt: 4, position: "relative", zIndex: 1 }}>
              {dayAppointments.length <= 2 ? (
                // Show actual appointments if there are only a few
                dayAppointments.map((appointment, idx) => (
                  <Chip
                    key={idx}
                    size="small"
                    label={
                      appointment.title.substring(0, 15) +
                      (appointment.title.length > 15 ? "..." : "")
                    }
                    color={getAppointmentStatusColor(appointment.status)}
                    sx={{ mb: 0.5, maxWidth: "100%", fontSize: "0.7rem" }}
                  />
                ))
              ) : (
                // Otherwise just show the count
                <Chip
                  size="small"
                  label={`${dayAppointments.length} appointments`}
                  color="primary"
                  sx={{ mb: 0.5 }}
                />
              )}
            </Box>
          )}
        </Grid>
      );

      if ((i + dayOfWeekStart + 1) % 7 === 0 || i === daysInMonth.length - 1) {
        rows.push(
          <Grid container key={`row-${i}`}>
            {days}
          </Grid>
        );
        days = [];
      }
    }

    return <Box sx={{ mt: 2 }}>{rows}</Box>;
  };

  // Get the appropriate status color for an appointment
  const getAppointmentStatusColor = (status) => {
    const statusOption = appointmentStatusOptions.find(
      (opt) => opt.value === status
    );
    return statusOption ? statusOption.color : "default";
  };

  // Get icon for appointment type
  const renderAppointmentIcon = (type) => {
    const typeOption = appointmentTypeOptions.find((opt) => opt.value === type);
    return typeOption ? typeOption.icon : null;
  };

  // Open appointment form for creating or editing
  const openAppointmentForm = (appointment = null) => {
    if (appointment) {
      // Edit existing appointment
      console.log(
        `Editing appointment: ${appointment.id} - ${appointment.title}`
      );
      setFormData({
        id: appointment.id,
        title: appointment.title,
        date: new Date(appointment.date),
        time: appointment.time,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        vehicleInfo: appointment.vehicleInfo,
        type: appointment.type,
        status: appointment.status,
        description: appointment.description,
        invoiceId: appointment.invoiceId,
        createdBy: appointment.createdBy,
      });
    } else {
      // Create new appointment
      console.log("Creating new appointment");
      setFormData({
        id: null,
        title: "",
        date: selectedDate,
        time: "10:00",
        clientId: "",
        clientName: "",
        vehicleInfo: "",
        type: "repair",
        status: "scheduled",
        description: "",
        invoiceId: "",
        createdBy: "",
      });
    }

    setAppointmentFormOpen(true);
  };

  // Close appointment form
  const closeAppointmentForm = () => {
    setAppointmentFormOpen(false);
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle client selection in appointment form
  const handleClientChange = (event, newValue) => {
    if (newValue) {
      console.log(`Client selected: ${newValue.clientName}`);
      setFormData((prev) => ({
        ...prev,
        clientId: newValue.id,
        clientName: newValue.clientName,
        vehicleInfo: newValue.vehicleInfo,
        description: newValue.issueDescription || prev.description,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        vehicleInfo: "",
      }));
    }
  };

  // Save appointment (create or update)
  const handleSaveAppointment = async () => {
    // Validate form
    if (!formData.title || !formData.date || !formData.time) {
      alert("Please fill in required fields");
      return;
    }

    try {
      setLoading(true);
      console.log("Saving appointment...");

      // Combine date and time
      const appointmentDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(":").map(Number);
      appointmentDateTime.setHours(hours, minutes);

      const appointmentData = {
        ...formData,
        date: appointmentDateTime.toISOString(),
      };

      let updatedAppointment;

      if (formData.id) {
        console.log(`Updating appointment: ${formData.id}`);
        // Update existing appointment
        if (
          formData.id.startsWith("client-") ||
          formData.id.startsWith("invoice-")
        ) {
          // This is a generated appointment, create a new one instead
          console.log("Converting generated appointment to real appointment");
          const response = await appointmentAPI.create(appointmentData);
          updatedAppointment = response.data;
        } else {
          // Update existing real appointment
          const response = await appointmentAPI.update(
            formData.id,
            appointmentData
          );
          updatedAppointment = response.data;
        }

        // Update appointments state
        setAppointments((prevAppointments) => {
          return prevAppointments.map((appt) =>
            appt.id === formData.id
              ? {
                  ...updatedAppointment,
                  date: new Date(updatedAppointment.date),
                  createdAt: updatedAppointment.createdAt
                    ? new Date(updatedAppointment.createdAt)
                    : new Date(),
                }
              : appt
          );
        });
      } else {
        // Create new appointment
        console.log("Creating new appointment");
        const response = await appointmentAPI.create(appointmentData);

        updatedAppointment = response.data;

        // Add to appointments state
        setAppointments((prevAppointments) => [
          ...prevAppointments,
          {
            ...updatedAppointment,
            date: new Date(updatedAppointment.date),
            createdAt: updatedAppointment.createdAt
              ? new Date(updatedAppointment.createdAt)
              : new Date(),
          },
        ]);
      }

      // If this is linked to a client, update client repair status
      if (formData.clientId && formData.type === "repair") {
        try {
          console.log(`Updating client status: ${formData.clientId}`);
          // Map appointment status to repair status
          const statusMap = {
            scheduled: "waiting",
            in_progress: "in_progress",
            completed: "completed",
            cancelled: "cancelled",
          };

          // Use axios for client status update since we don't have a dedicated API function
          await axios.patch(
            `/api/clients/${formData.clientId}/status`,
            { status: statusMap[formData.status] || "waiting" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Client status updated successfully");
        } catch (err) {
          console.error("Error updating client status:", err);
        }
      }

      console.log("Appointment saved successfully");
      setLoading(false);
      closeAppointmentForm();

      // Refresh appointments data and filter for current date
      await fetchAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      setError("Failed to save appointment");
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (appointmentId, newStatus) => {
    try {
      setLoading(true);
  
      // Get the appointment being updated
      const appointment = appointments.find((a) => a.id === appointmentId || a._id === appointmentId);
      if (!appointment) {
        setError("Appointment not found");
        setLoading(false);
        return;
      }
  
      // Old status for comparison
      const oldStatus = appointment.status;
  
      // Update appointment in backend
      await appointmentsAPI.updateStatus(appointmentId, newStatus);
  
      // Update local state
      const updatedAppointments = appointments.map((app) => {
        if (app.id === appointmentId || app._id === appointmentId) {
          return {
            ...app,
            status: newStatus,
          };
        }
        return app;
      });
  
      setAppointments(updatedAppointments);
  
      // If this is a repair appointment linked to a client, update client status
      if (
        appointment.clientId &&
        (appointment.type === 'repair' || appointment.type === 'maintenance')
      ) {
        // Map appointment status to repair status
        const repairStatus = mapStatus(newStatus, "appointment", "repair");
  
        try {
          // Update client status
          await clientsAPI.updateStatus(appointment.clientId, repairStatus);
  
          toast.info(`Client status updated to ${repairStatus.replace("_", " ")}`);
  
          // If status changed to completed, offer to create invoice
          if (
            shouldCreateInvoice(
              mapStatus(oldStatus, "appointment", "repair"),
              repairStatus
            )
          ) {
            const createInvoice = window.confirm(
              "Repair marked as completed. Would you like to create an invoice now?"
            );
  
            if (createInvoice && onCreateInvoiceFromAppointment) {
              onCreateInvoiceFromAppointment(appointment.clientId);
            }
          }
        } catch (err) {
          console.error("Error updating client status:", err);
          // Don't fail if client update fails
        }
      }
  
      // Update filtered appointments
      filterAppointments(
        updatedAppointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );
  
      toast.success(`Appointment status updated to ${newStatus.replace("_", " ")}`);
      setLoading(false);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError("Failed to update appointment status");
      setLoading(false);
    }
  }, [handleApiError, appointments, statusFilter, typeFilter, selectedDate, showAllAppointments, filterAppointments, appointmentsAPI, clientsAPI, onCreateInvoiceFromAppointment]);

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        setLoading(true);
        console.log(`Deleting appointment: ${appointmentId}`);

        // Check if this is a generated appointment
        if (
          appointmentId.startsWith("client-") ||
          appointmentId.startsWith("invoice-")
        ) {
          // For generated appointments, just update local state
          console.log("Deleting generated appointment (local state only)");
          const updatedAppointments = appointments.filter(
            (appointment) => appointment.id !== appointmentId
          );
          setAppointments(updatedAppointments);
        } else {
          // For real appointments, delete from the backend
          console.log("Deleting appointment from backend");
          await appointmentAPI.delete(appointmentId);

          // Update local state
          const updatedAppointments = appointments.filter(
            (appointment) => appointment.id !== appointmentId
          );
          setAppointments(updatedAppointments);
        }

        // Update filtered appointments
        filterAppointments(
          appointments.filter(
            (appointment) => appointment.id !== appointmentId
          ),
          statusFilter,
          typeFilter,
          selectedDate,
          showAllAppointments
        );

        setLoading(false);
      } catch (error) {
        console.error("Error deleting appointment:", error);
        setError("Failed to delete appointment");
        setLoading(false);
      }
    }
  };

  // Render appointments list in sidebar
  const renderAppointmentsList = () => {
    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">
                {showAllAppointments
                  ? "All Appointments"
                  : `Appointments for ${format(selectedDate, "MMMM d, yyyy")}`}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  console.log(
                    `Toggle view: ${
                      showAllAppointments ? "selected day" : "all"
                    }`
                  );
                  const newShowAll = !showAllAppointments;
                  setShowAllAppointments(newShowAll);

                  // Update filtered appointments
                  filterAppointments(
                    appointments,
                    statusFilter,
                    typeFilter,
                    selectedDate,
                    newShowAll
                  );
                }}
                data-testid="toggle-view-button"
              >
                {showAllAppointments ? "Show Selected Day" : "Show All"}
              </Button>
            </Box>
          }
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  data-testid="status-filter"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {appointmentStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  data-testid="type-filter"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {appointmentTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent sx={{ maxHeight: 600, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : filteredAppointments.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No appointments found for the selected filters.
            </Alert>
          ) : (
            filteredAppointments.map((appointment, index) => (
              <Box
                key={appointment.id}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 1,
                  borderLeft: 3,
                  borderColor: `${getAppointmentStatusColor(
                    appointment.status
                  )}.main`,
                }}
                data-testid={`appointment-item-${appointment.id}`}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ mr: 1 }}>
                      {renderAppointmentIcon(appointment.type)}
                    </Box>
                    <Typography variant="subtitle1">
                      {appointment.title}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      label={
                        appointmentStatusOptions.find(
                          (opt) => opt.value === appointment.status
                        )?.label
                      }
                      color={getAppointmentStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Clock size={14} style={{ marginRight: 4 }} />
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    {format(new Date(appointment.date), "MMM d")} at{" "}
                    {appointment.time}
                  </Typography>
                  {appointment.clientName && (
                    <>
                      <User size={14} style={{ marginRight: 4 }} />
                      <Typography variant="body2">
                        {appointment.clientName}
                      </Typography>
                    </>
                  )}
                </Box>

                {appointment.vehicleInfo && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <Truck size={14} style={{ marginRight: 4 }} />
                    <Typography variant="body2">
                      {appointment.vehicleInfo}
                    </Typography>
                  </Box>
                )}

                {appointment.description && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    {appointment.description}
                  </Typography>
                )}

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
                  <FormControl sx={{ minWidth: 120, mr: 1 }} size="small">
                    <Select
                      value={appointment.status}
                      onChange={(e) =>
                        handleStatusChange(appointment.id, e.target.value)
                      }
                      displayEmpty
                      variant="outlined"
                      size="small"
                      data-testid={`status-select-${appointment.id}`}
                    >
                      {appointmentStatusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => openAppointmentForm(appointment)}
                      data-testid={`edit-button-${appointment.id}`}
                    >
                      <Tool size={18} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      data-testid={`delete-button-${appointment.id}`}
                    >
                      <X size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  const handleAppointmentUpdate = async (appointment, newStatus) => {
    try {
      // Create new appointment for generated ones to maintain history
      if (appointment.isGenerated) {
        const newAppointment = {
          ...appointment,
          isGenerated: false,
          status: newStatus
        };
        await appointmentsAPI.create(newAppointment);
      } else {
        await appointmentsAPI.updateStatus(appointment.id, newStatus);
      }
      await fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    }
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => {
              setError(null);
              fetchAppointments();
            }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {!error && (!clients || clients.length === 0) && !loading && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => {
              fetchClients();
            }}>
              Refresh
            </Button>
          }
        >
          No clients available. You can still create appointments without linking them to clients.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {renderAppointmentsList()}
        </Grid>
      </Grid>

      {/* Appointment Form Dialog */}
      <Dialog
        open={appointmentFormOpen}
        onClose={closeAppointmentForm}
        maxWidth="md"
        fullWidth
        aria-labelledby="appointment-dialog-title"
      >
        <DialogTitle id="appointment-dialog-title">
          {formData.id ? "Edit Appointment" : "New Appointment"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                data-testid="appointment-title-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                required
                value={format(formData.date, "yyyy-MM-dd")}
                onChange={(e) =>
                  handleFormChange("date", new Date(e.target.value))
                }
                InputLabelProps={{ shrink: true }}
                data-testid="appointment-date-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Time"
                type="time"
                fullWidth
                required
                value={formData.time}
                onChange={(e) => handleFormChange("time", e.target.value)}
                InputLabelProps={{ shrink: true }}
                data-testid="appointment-time-input"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Client Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                id="client-autocomplete"
                options={clientOptions}
                getOptionLabel={(option) => option.clientName || ""}
                onChange={handleClientChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Client"
                    placeholder="Start typing client name"
                    fullWidth
                    data-testid="client-autocomplete"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.clientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.vehicleInfo}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Client Name"
                fullWidth
                value={formData.clientName}
                onChange={(e) => handleFormChange("clientName", e.target.value)}
                disabled={formData.clientId !== ""}
                helperText={
                  formData.clientId !== ""
                    ? "Selected from client records"
                    : "Manual entry (if client not in system)"
                }
                data-testid="client-name-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Vehicle Information"
                fullWidth
                value={formData.vehicleInfo}
                onChange={(e) =>
                  handleFormChange("vehicleInfo", e.target.value)
                }
                disabled={formData.clientId !== ""}
                placeholder="Year Make Model"
                helperText={
                  formData.clientId !== ""
                    ? "Selected from client records"
                    : "Manual entry"
                }
                data-testid="vehicle-info-input"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Appointment Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => handleFormChange("type", e.target.value)}
                  data-testid="appointment-type-select"
                >
                  {appointmentTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {option.icon}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  data-testid="appointment-status-select"
                >
                  {appointmentStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                data-testid="appointment-description-input"
              />
            </Grid>

            {formData.type === "invoice" && (
              <Grid item xs={12}>
                <TextField
                  label="Invoice ID (if applicable)"
                  fullWidth
                  value={formData.invoiceId}
                  onChange={(e) =>
                    handleFormChange("invoiceId", e.target.value)
                  }
                  data-testid="invoice-id-input"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeAppointmentForm}
            data-testid="cancel-appointment-button"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAppointment}
            disabled={loading}
            data-testid="save-appointment-button"
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : formData.id ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentCalendar;
