import React, { useState, useEffect } from "react";
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
  AlertTriangle,
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
];

const AppointmentCalendar = ({ clients, invoices }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);

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
    createdBy: "admin",
    createdAt: new Date(),
  });

  // State for filtering
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    // In a real app, you'd call your API to fetch appointments
    // For now, we'll generate sample data
    const generateSampleData = () => {
      // If there are clients and invoices, create appointments based on them
      const sampleAppointments = [];

      // Generate appointments from clients data (simulating their delivery dates)
      if (clients && clients.length > 0) {
        clients.slice(0, 10).forEach((client, index) => {
          const startDate = subMonths(new Date(), 1);
          const endDate = addMonths(new Date(), 2);

          // Create an appointment date that's either past, current, or future
          const appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + (index % 8) - 3); // Spread over a week

          // Create various statuses
          const statuses = ["scheduled", "in_progress", "completed", "waiting"];
          const status = statuses[index % statuses.length];

          sampleAppointments.push({
            id: `client-${client.id || index}`,
            title: `${status === "completed" ? "Delivery" : "Service"} - ${
              client.clientName || `Client ${index + 1}`
            }`,
            date: appointmentDate,
            time: `${9 + (index % 8)}:${index % 2 === 0 ? "00" : "30"}`,
            clientId: client.id || index,
            clientName: client.clientName || `Client ${index + 1}`,
            vehicleInfo: client.carDetails
              ? `${client.carDetails.year} ${client.carDetails.make} ${client.carDetails.model}`
              : `Vehicle ${index + 1}`,
            type: index % 2 === 0 ? "repair" : "maintenance",
            status: status,
            description:
              client.issueDescription ||
              `Service appointment for ${
                client.clientName || `Client ${index + 1}`
              }`,
            invoiceId: "",
            createdBy: "admin",
            createdAt: new Date(appointmentDate),
          });
        });
      }

      // Generate appointments from invoices (for payment or review)
      if (invoices && invoices.length > 0) {
        invoices.slice(0, 5).forEach((invoice, index) => {
          const invoiceDate = new Date();
          invoiceDate.setDate(invoiceDate.getDate() + index + 1); // Future dates for invoice followups

          sampleAppointments.push({
            id: `invoice-${invoice.id || index}`,
            title: `Invoice Review - ${
              invoice.customerInfo?.name || `Customer ${index + 1}`
            }`,
            date: invoiceDate,
            time: `${13 + (index % 5)}:${index % 2 === 0 ? "00" : "30"}`,
            clientId: invoice.customerInfo?.id || "",
            clientName: invoice.customerInfo?.name || `Customer ${index + 1}`,
            vehicleInfo: invoice.vehicleInfo
              ? `${invoice.vehicleInfo.year} ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`
              : "",
            type: "invoice",
            status: "scheduled",
            description: `Review invoice #${invoice.invoiceNumber} for ${
              invoice.customerInfo?.name || `Customer ${index + 1}`
            }`,
            invoiceId: invoice.id || "",
            createdBy: "admin",
            createdAt: new Date(),
          });
        });
      }

      // Generate some future appointments if needed
      if (sampleAppointments.length < 15) {
        const additionalCount = 15 - sampleAppointments.length;

        for (let i = 0; i < additionalCount; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + (i % 20) + 1); // Spread over next 3 weeks

          const types = ["repair", "maintenance", "inspection", "invoice"];
          const statuses = ["scheduled", "waiting"];

          sampleAppointments.push({
            id: `future-${i}`,
            title: `${
              types[i % 4].charAt(0).toUpperCase() + types[i % 4].slice(1)
            } Appointment`,
            date: futureDate,
            time: `${9 + (i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
            clientId: "",
            clientName: `Future Client ${i + 1}`,
            vehicleInfo: `Vehicle ${i + 1}`,
            type: types[i % 4],
            status: statuses[i % 2],
            description: `Future appointment for ${types[i % 4]}`,
            invoiceId: "",
            createdBy: "admin",
            createdAt: new Date(),
          });
        }
      }

      return sampleAppointments;
    };

    const sampleAppointments = generateSampleData();
    setAppointments(sampleAppointments);
    filterAppointments(
      sampleAppointments,
      statusFilter,
      typeFilter,
      selectedDate,
      showAllAppointments
    );
  }, [clients, invoices]);

  useEffect(() => {
    filterAppointments(
      appointments,
      statusFilter,
      typeFilter,
      selectedDate,
      showAllAppointments
    );
  }, [
    appointments,
    selectedDate,
    statusFilter,
    typeFilter,
    showAllAppointments,
  ]);

useEffect(() => {
  if (appointments.length > 0) {
    // Make sure we immediately filter for the current selected date
    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });
    
    setFilteredAppointments(dayAppointments);
  }
}, [appointments, selectedDate]);
  const filterAppointments = (allAppointments, status, type, date, showAll) => {
    if (!allAppointments || allAppointments.length === 0) return;

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
        const appointmentDate = new Date(appointment.date);
        // Compare only the year, month, and day components
        return (
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getDate() === date.getDate()
        );
      });
    }

    setFilteredAppointments(filtered);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getAppointmentsForDay = (day) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === day.getFullYear() &&
        appointmentDate.getMonth() === day.getMonth() &&
        appointmentDate.getDate() === day.getDate()
      );
    });
  };

  const onDateClick = (day) => {
    // Create a new date object to prevent reference issues
    const newSelectedDate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate()
    );
    
    // Update the selected date
    setSelectedDate(newSelectedDate);
    setShowAllAppointments(false);
    
  
  };
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
          <IconButton onClick={prevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5" sx={{ mx: 2 }}>
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <IconButton onClick={nextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus />}
          onClick={() => openAppointmentForm()}
        >
          Add Appointment
        </Button>
      </Box>
    );
  };

  const renderDays = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <Grid container sx={{ mb: 1 }}>
        {weekDays.map((day, idx) => (
          <Grid
            item
            key={idx}
            xs={1.7}
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

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateFormat = "d";
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

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
          xs={1.7}
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
  day = daysInMonth[i];
  formattedDate = format(day, dateFormat);

  // Get appointments for this day
  const dayAppointments = getAppointmentsForDay(day);

  // Check if this day is the selected date by comparing year, month, and day
  const isSelectedDate = 
    day.getFullYear() === selectedDate.getFullYear() &&
    day.getMonth() === selectedDate.getMonth() &&
    day.getDate() === selectedDate.getDate();

  // Check if this day is today
  const isToday = 
    day.getFullYear() === new Date().getFullYear() &&
    day.getMonth() === new Date().getMonth() &&
    day.getDate() === new Date().getDate();

  days.push(
    <Grid
      item
      key={day.toString()}
      xs={1.7}
      onClick={() => onDateClick(day)}
      sx={{
        height: 120,
        border: "1px solid #eee",
        p: 1,
        cursor: "pointer",
        position: "relative",
        bgcolor: isSelectedDate ? "primary.light" : "white",
        "&:hover": {
          bgcolor: isSelectedDate ? "primary.light" : "#f5f5f5",
        },
        color: !isSameMonth(day, monthStart)
          ? "#ccc"
          : isToday
          ? "primary.main"
          : "inherit",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          top: 5,
          right: 8,
          fontWeight: isToday ? "bold" : "normal",
          color: isToday ? "primary.main" : "inherit",
        }}
      >
        {formattedDate}
      </Typography>

      {dayAppointments.length > 0 && (
        <Box sx={{ mt: 4 }}>
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

const getAppointmentStatusColor = (status) => {
const statusOption = appointmentStatusOptions.find(
  (opt) => opt.value === status
);
return statusOption ? statusOption.color : "default";
};

const renderAppointmentIcon = (type) => {
const typeOption = appointmentTypeOptions.find((opt) => opt.value === type);
return typeOption ? typeOption.icon : null;
};

const openAppointmentForm = (appointment = null) => {
if (appointment) {
  // Edit existing appointment
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
    createdAt: new Date(appointment.createdAt),
  });
} else {
  // Create new appointment
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
    createdBy: "admin",
    createdAt: new Date(),
  });
}

setAppointmentFormOpen(true);
};

  const closeAppointmentForm = () => {
    setAppointmentFormOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAppointment = () => {
    // Validate form
    if (!formData.title || !formData.date || !formData.time) {
      alert("Please fill in required fields");
      return;
    }

    // Combine date and time
    const appointmentDateTime = new Date(formData.date);
    const [hours, minutes] = formData.time.split(":").map(Number);
    appointmentDateTime.setHours(hours, minutes);

    const updatedAppointment = {
      ...formData,
      date: appointmentDateTime,
    };

    let updatedAppointments;

    if (formData.id) {
      // Update existing appointment
      updatedAppointments = appointments.map((appointment) =>
        appointment.id === formData.id ? updatedAppointment : appointment
      );
    } else {
      // Create new appointment
      const newId = `new-${Date.now()}`;
      const newAppointment = {
        ...updatedAppointment,
        id: newId,
      };
      updatedAppointments = [...appointments, newAppointment];
    }

    // Set the updated appointments
    setAppointments(updatedAppointments);

    // Close the form
    closeAppointmentForm();
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    const updatedAppointments = appointments.map((appointment) => {
      if (appointment.id === appointmentId) {
        return {
          ...appointment,
          status: newStatus,
        };
      }
      return appointment;
    });

    setAppointments(updatedAppointments);
    filterAppointments(
      updatedAppointments,
      statusFilter,
      typeFilter,
      selectedDate,
      showAllAppointments
    );
  };

  const handleDeleteAppointment = (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      const updatedAppointments = appointments.filter(
        (appointment) => appointment.id !== appointmentId
      );
      setAppointments(updatedAppointments);
      filterAppointments(
        updatedAppointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );
    }
  };

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
                  setShowAllAppointments(!showAllAppointments);
                  // If toggling to "Show All", re-filter to show all appointments
                  if (!showAllAppointments) {
                    filterAppointments(
                      appointments,
                      statusFilter,
                      typeFilter,
                      selectedDate,
                      true
                    );
                  } else {
                    // If toggling to show only selected day, re-filter for just that day
                    filterAppointments(
                      appointments,
                      statusFilter,
                      typeFilter,
                      selectedDate,
                      false
                    );
                  }
                }}
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
          {filteredAppointments.length === 0 ? (
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
                    >
                      <Tool size={18} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAppointment(appointment.id)}
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

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
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
      >
        <DialogTitle>
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
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Client Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Client Name"
                fullWidth
                value={formData.clientName}
                onChange={(e) => handleFormChange("clientName", e.target.value)}
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
                placeholder="Year Make Model"
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
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Invoice ID (if applicable)"
                fullWidth
                value={formData.invoiceId}
                onChange={(e) => handleFormChange("invoiceId", e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAppointmentForm}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAppointment}
          >
            {formData.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentCalendar;
