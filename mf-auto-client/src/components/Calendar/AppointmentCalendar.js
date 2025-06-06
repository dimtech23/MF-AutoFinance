import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../Context/UserContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import { appointmentsAPI, appointmentAPI } from "../../api";
import {
  mapStatus,
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
  Paper,
  FormControlLabel,
  Switch,
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
  RefreshCw,
  Calendar as CalendarIcon,
  ArrowRight,
  Flag,
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
  differenceInDays,
  isWithinInterval,
} from "date-fns";
import { useTheme } from '@mui/material/styles';

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
  { value: "milestone", label: "Service Milestone", icon: <Flag size={16} /> },
];

// Add service milestone types
const serviceMilestoneTypes = [
  { value: "diagnosis", label: "Diagnosis Complete", color: "info" },
  { value: "parts_ordered", label: "Parts Ordered", color: "warning" },
  { value: "parts_received", label: "Parts Received", color: "success" },
  { value: "work_started", label: "Work Started", color: "primary" },
  { value: "work_completed", label: "Work Completed", color: "success" },
  { value: "quality_check", label: "Quality Check", color: "info" },
  { value: "ready_for_delivery", label: "Ready for Delivery", color: "success" },
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
  isFullPage = false,
  onError = (error) => console.error(error)
}) => {
  const theme = useTheme();
  const { token } = useContext(UserContext);
  
  // State declarations
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [selectedMilestoneType, setSelectedMilestoneType] = useState("");
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSync: null,
    syncInProgress: false
  });
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    date: new Date(),
    time: new Date(),
    clientName: "",
    vehicleInfo: "",
    description: "",
    status: "scheduled",
    type: "repair",
    invoiceId: "",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Update handleApiError to use the onError prop
  const handleApiError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = error?.response?.data?.message || error?.message || `An error occurred while ${context}`;
    setError(errorMessage);
    onError(error);
  }, [onError]);

  // Define filterAppointments function at the top level
  const filterAppointments = useCallback((allAppointments, status, type, date, showAll) => {
    if (!allAppointments || allAppointments.length === 0) {
      console.log("No appointments to filter");
      return [];
    }

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

    // Filter by date if not showing all appointments
    if (!showAll && date) {
      filtered = filtered.filter((appointment) => {
        if (!appointment.date) return false;

        const startDate = appointment.date instanceof Date 
          ? appointment.date 
          : new Date(appointment.date);
        
        const endDate = appointment.deliveryDate && appointment.type === 'repair'
          ? new Date(appointment.deliveryDate)
          : startDate;
        
        const selectedDate = date instanceof Date 
          ? date 
          : new Date(date);
      
        if (appointment.type === 'repair' && appointment.deliveryDate) {
          try {
            return isWithinInterval(selectedDate, { start: startDate, end: endDate });
          } catch (error) {
            return (
              startDate.getFullYear() === selectedDate.getFullYear() &&
              startDate.getMonth() === selectedDate.getMonth() &&
              startDate.getDate() === selectedDate.getDate()
            );
          }
        } else {
          return (
            startDate.getFullYear() === selectedDate.getFullYear() &&
            startDate.getMonth() === selectedDate.getMonth() &&
            startDate.getDate() === selectedDate.getDate()
          );
        }
      });
    }

    return filtered;
  }, []);

  // Add memoization for appointment filtering
  const memoizedFilterAppointments = useCallback(
    (allAppointments, status, type, date, showAll) => {
      const cacheKey = `${status}-${type}-${date?.toISOString()}-${showAll}`;
      
      // Use a simple in-memory cache
      if (memoizedFilterAppointments.cache && memoizedFilterAppointments.cache[cacheKey]) {
        return memoizedFilterAppointments.cache[cacheKey];
      }

      const filtered = filterAppointments(allAppointments, status, type, date, showAll);

      // Cache the result
      if (!memoizedFilterAppointments.cache) {
        memoizedFilterAppointments.cache = {};
      }
      memoizedFilterAppointments.cache[cacheKey] = filtered;

      return filtered;
    },
    [filterAppointments]
  );

  // Add cache clearing function
  const clearFilterCache = useCallback(() => {
    if (memoizedFilterAppointments.cache) {
      memoizedFilterAppointments.cache = {};
    }
  }, []);

  const normalizeAppointment = (appointment) => {
    if (!appointment) return null;

    // Ensure appointment has an id field (MongoDB returns _id)
    if (!appointment.id && appointment._id) {
      appointment.id = appointment._id;
    }

    // Ensure date is a Date object
    if (appointment.date && !(appointment.date instanceof Date)) {
      appointment.date = new Date(appointment.date);
    }

    // Ensure deliveryDate is a Date object if provided
    if (appointment.deliveryDate && !(appointment.deliveryDate instanceof Date)) {
      appointment.deliveryDate = new Date(appointment.deliveryDate);
    }

    // Add useful computed properties
    const now = new Date();
    appointment.isOverdue =
      appointment.date < now && appointment.status === "scheduled";
    appointment.isUpcoming =
      appointment.date > now && appointment.status === "scheduled";
    
    // Calculate duration for display
    if (appointment.type === 'repair' && appointment.deliveryDate) {
      appointment.duration = differenceInDays(
        new Date(appointment.deliveryDate),
        new Date(appointment.date)
      ) + 1; // Include both start and end days
    } else if (appointment.estimatedDuration) {
      appointment.duration = appointment.estimatedDuration;
    } else {
      appointment.duration = 1; // Default to 1 day
    }

    // Set displayEndDate for UI
    appointment.displayEndDate = appointment.deliveryDate || 
      (appointment.date && appointment.estimatedDuration 
        ? addDays(new Date(appointment.date), appointment.estimatedDuration) 
        : null);

    return appointment;
  };

  // Memoize fetchAppointments to prevent recreation on every render
  const fetchAppointments = useCallback(async (forceRefresh = false) => {
    if (syncStatus.syncInProgress) {
      console.log('Sync already in progress, skipping fetch');
      return;
    }

    setSyncStatus(prev => ({
      ...prev,
      syncInProgress: true
    }));

    try {
      const monthKey = format(currentMonth, 'yyyy-MM');
      
      // Check cache first unless force refresh
      if (!forceRefresh && fetchAppointments.cache?.[monthKey]) {
        const cached = fetchAppointments.cache[monthKey];
        const cacheAge = Date.now() - cached.timestamp;
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('Using cached appointments');
          setAppointments(cached.appointments);
          const filtered = filterAppointments(
            cached.appointments,
            statusFilter,
            typeFilter,
            selectedDate,
            showAllAppointments
          );
          setFilteredAppointments(filtered);
          setSyncStatus(prev => ({
            ...prev,
            syncInProgress: false
          }));
          setLoading(false);
          return;
        }
      }

      console.log(`Fetching appointments for ${format(currentMonth, "MMMM yyyy")}`);

      const firstDay = startOfMonth(currentMonth);
      const lastDay = endOfMonth(currentMonth);

      const response = await appointmentsAPI.getAll({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
      });

      let fetchedAppointments = [];
      
      if (response?.data?.length > 0) {
        console.log(`Received ${response.data.length} appointments from API`);
        fetchedAppointments = response.data.map(appointment => normalizeAppointment(appointment));
      }

      // Update cache
      if (!fetchAppointments.cache) {
        fetchAppointments.cache = {};
      }
      fetchAppointments.cache[monthKey] = {
        appointments: fetchedAppointments,
        timestamp: Date.now()
      };

      setAppointments(fetchedAppointments);
      const filtered = filterAppointments(
        fetchedAppointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );
      setFilteredAppointments(filtered);
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncInProgress: false
      }));
    } catch (error) {
      handleApiError(error, "fetching appointments");
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        syncError: error.message
      }));
    } finally {
      setLoading(false);
    }
  }, [
    currentMonth,
    statusFilter,
    typeFilter,
    selectedDate,
    showAllAppointments,
    filterAppointments,
    handleApiError,
    syncStatus.syncInProgress,
    normalizeAppointment
  ]);

  // Update useEffect for month changes with better sync control
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const fetchData = async () => {
      if (!mounted) return;
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Add a small delay to prevent rapid refetches
      timeoutId = setTimeout(async () => {
        if (!mounted) return;
        
        if (!syncStatus.syncInProgress && !loading) {
          console.log("Month changed, refreshing appointments");
          await fetchAppointments();
        }
      }, 100);
    };

    fetchData();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentMonth]); // Only depend on currentMonth changes

  // Update event listener effect with proper cleanup and debouncing
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const handleClientUpdate = (event) => {
      if (!mounted) return;
      
      if (event.detail && !syncStatus.syncInProgress) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          console.log('Client update detected, refreshing appointments');
          fetchAppointments(true);
        }, 500);
      }
    };

    const handleAppointmentUpdate = (event) => {
      if (!mounted) return;
      
      if (event.detail && !syncStatus.syncInProgress) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (!mounted) return;
          console.log('Appointment update detected, refreshing appointments');
          fetchAppointments(true);
        }, 500);
      }
    };

    window.addEventListener('client-updated', handleClientUpdate);
    window.addEventListener('appointment-updated', handleAppointmentUpdate);
    
    return () => {
      mounted = false;
      window.removeEventListener('client-updated', handleClientUpdate);
      window.removeEventListener('appointment-updated', handleAppointmentUpdate);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchAppointments, syncStatus.syncInProgress]);

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
        const deliveryDate = appointment.deliveryDate 
          ? new Date(appointment.deliveryDate) 
          : null;
          
        // Check if this day is the appointment date
        if (
          appointmentDate.getFullYear() === day.getFullYear() &&
          appointmentDate.getMonth() === day.getMonth() &&
          appointmentDate.getDate() === day.getDate()
        ) {
          return true;
        }
        
        // For repair appointments with a delivery date, check if day is within the service range
        if (appointment.type === 'repair' && deliveryDate) {
          try {
            // Check if the day is within the appointment's date range
            return isWithinInterval(day, { 
              start: appointmentDate,
              end: deliveryDate
            });
          } catch (error) {
            // Fallback if interval check fails
            return false;
          }
        }
        
        return false;
      });
    },
    [appointments]
  );

  // For multi-day appointments, check if this is the start, end, or middle of the span
  const getAppointmentPositionInSpan = useCallback((appointment, day) => {
    if (!appointment.deliveryDate || appointment.type !== 'repair') {
      return 'single'; // Not a spanning appointment
    }
    
    const appointmentDate = new Date(appointment.date);
    const deliveryDate = new Date(appointment.deliveryDate);
    const checkDate = new Date(day);
    
    const isStart = isSameDay(appointmentDate, checkDate);
    const isEnd = isSameDay(deliveryDate, checkDate);
    
    if (isStart && isEnd) return 'single';
    if (isStart) return 'start';
    if (isEnd) return 'end';
    return 'middle';
  }, []);

  // Handle date selection in calendar
  const onDateClick = useCallback(
    (day) => {
      console.log(`Date clicked: ${format(day, "yyyy-MM-dd")}`);

      // Create a new date object at noon to prevent timezone issues
      const newSelectedDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        12,
        0,
        0
      );

      // Update the selected date
      setSelectedDate(newSelectedDate);
      setShowAllAppointments(false);

      console.log(
        `Selected date set to: ${format(newSelectedDate, "yyyy-MM-dd")}`
      );

      // Filter appointments for this day using our filter function
      const filtered = filterAppointments(
        appointments,
        statusFilter,
        typeFilter,
        newSelectedDate,
        false
      );
      setFilteredAppointments(filtered);
    },
    [appointments, statusFilter, typeFilter, filterAppointments]
  );

  // Render calendar header
  const renderHeader = () => {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" component="h2">
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          {syncStatus.lastSync && (
            <Typography variant="caption" color="text.secondary">
              Last synced: {format(syncStatus.lastSync, "HH:mm:ss")}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Add filter controls */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                const filtered = filterAppointments(
                  appointments,
                  e.target.value,
                  typeFilter,
                  selectedDate,
                  showAllAppointments
                );
                setFilteredAppointments(filtered);
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {appointmentStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                const filtered = filterAppointments(
                  appointments,
                  statusFilter,
                  e.target.value,
                  selectedDate,
                  showAllAppointments
                );
                setFilteredAppointments(filtered);
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
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
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant={viewMode === "month" ? "contained" : "outlined"}
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button
            size="small"
            variant={viewMode === "day" ? "contained" : "outlined"}
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            size="small"
            onClick={prevMonth}
            disabled={loading || syncStatus.syncInProgress}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            size="small"
            onClick={nextMonth}
            disabled={loading || syncStatus.syncInProgress}
          >
            <ChevronRight size={20} />
          </Button>
          <Button
            size="small"
            onClick={() => fetchAppointments()}
            disabled={loading || syncStatus.syncInProgress}
            startIcon={
              syncStatus.syncInProgress ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshCw size={16} />
              )
            }
          >
            {syncStatus.syncInProgress ? "Syncing..." : "Refresh"}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showMilestones}
                onChange={(e) => setShowMilestones(e.target.checked)}
                color="primary"
              />
            }
            label="Show Service Milestones"
          />
          
          {showMilestones && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter Milestones</InputLabel>
              <Select
                value={selectedMilestoneType || ''}
                onChange={(e) => setSelectedMilestoneType(e.target.value)}
                label="Filter Milestones"
              >
                <MenuItem value="">All Milestones</MenuItem>
                <MenuItem value="partsOrdered">Parts Ordered</MenuItem>
                <MenuItem value="partsReceived">Parts Received</MenuItem>
                <MenuItem value="workStarted">Work Started</MenuItem>
                <MenuItem value="workCompleted">Work Completed</MenuItem>
                <MenuItem value="qualityCheckCompleted">Quality Check Completed</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
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

  // Helper function to get status color in hex for styling
  const getStatusColorHex = (status) => {
    switch (status) {
      case "scheduled":
        return theme.palette.primary.main;
      case "in_progress":
        return theme.palette.warning.main;
      case "completed":
        return theme.palette.success.main;
      case "cancelled":
        return theme.palette.error.main;
      case "delivered":
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Render a single appointment indicator for a day cell
  const renderAppointmentIndicator = (appointment, day) => {
    const spanPosition = getAppointmentPositionInSpan(appointment, day);
    const isMilestone = appointment.type === 'milestone';
    const milestoneType = isMilestone ? serviceMilestoneTypes.find(m => m.value === appointment.milestoneType) : null;
    const statusColor = getAppointmentStatusColor(appointment.status);
    const statusColorHex = getStatusColorHex(appointment.status);
    
    // Get background color based on status with better contrast
    const getBackgroundColor = () => {
      switch (appointment.status) {
        case "scheduled":
          return theme.palette.primary.main;
        case "in_progress":
          return theme.palette.warning.main;
        case "completed":
          return theme.palette.success.main;
        case "cancelled":
          return theme.palette.error.main;
        case "delivered":
          return theme.palette.info.main;
        default:
          return theme.palette.grey[700];
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '24px',
          p: 0.5,
          mb: 0.5,
          backgroundColor: getBackgroundColor(),
          borderLeft: 4,
          borderColor: isMilestone ? milestoneType?.color || 'primary' : statusColorHex,
          borderRadius: 1,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            cursor: 'pointer',
          },
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease-in-out',
        }}
        onClick={(e) => {
          e.stopPropagation();
          openAppointmentForm(appointment);
        }}
      >
        {(spanPosition === 'start' || spanPosition === 'single') && (
          <>
            {isMilestone ? (
              <Flag size={14} color="white" />
            ) : (
              <Box sx={{ color: 'white' }}>
                {renderAppointmentIcon(appointment.type)}
              </Box>
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 0.5,
                color: 'white',
                fontWeight: 'medium',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 'calc(100% - 20px)',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textShadow: '0 1px 1px rgba(0,0,0,0.2)'
              }}
            >
              {isMilestone 
                ? milestoneType?.label
                : appointment.title.length > (window.innerWidth < 600 ? 12 : 18)
                  ? appointment.title.substring(0, window.innerWidth < 600 ? 10 : 15) + "..."
                  : appointment.title}
            </Typography>
          </>
        )}
        
        {spanPosition === 'middle' && (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%',
              background: isMilestone
                ? `repeating-linear-gradient(45deg, ${theme.palette[milestoneType?.color || 'primary'].main}, ${theme.palette[milestoneType?.color || 'primary'].dark} 10px, ${theme.palette[milestoneType?.color || 'primary'].main} 10px, ${theme.palette[milestoneType?.color || 'primary'].dark} 20px)`
                : `repeating-linear-gradient(45deg, ${theme.palette[statusColor].main}, ${theme.palette[statusColor].dark} 10px, ${theme.palette[statusColor].main} 10px, ${theme.palette[statusColor].dark} 20px)`
            }}
          />
        )}
        
        {spanPosition === 'end' && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', mr: 1 }}>
            {isMilestone ? (
              <CheckCircle size={14} color="white" />
            ) : (
              <Box sx={{ color: 'white' }}>
                <Truck size={14} />
              </Box>
            )}
          </Box>
        )}
      </Box>
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
      const dayAppointments = getAppointmentsForDay(day);
      const isSelectedDate = isSameDay(day, selectedDate);
      const isCurrentDay = isToday(day);

      days.push(
        <Grid
          item
          key={day.toString()}
          xs={true}
          onClick={() => onDateClick(day)}
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
              cursor: "pointer",
            },
            color: !isSameMonth(day, monthStart)
              ? "#ccc"
              : isCurrentDay
              ? "primary.main"
              : "inherit",
          }}
          data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
        >
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: 5,
              right: 8,
              fontWeight: isCurrentDay ? "bold" : "normal",
              color: isCurrentDay ? "primary.main" : "inherit",
            }}
          >
            {formattedDate}
          </Typography>

          {dayAppointments.length > 0 && (
            <Box sx={{ mt: 4 }}>
              {dayAppointments.length <= 2 ? (
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

  // Render the single day view
  const renderDayView = () => {
    // Get appointments for the selected date
    const dayAppointments = getAppointmentsForDay(selectedDate);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
            {isToday(selectedDate) && (
              <Chip size="small" label="Today" color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            startIcon={<Plus />}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                date: selectedDate,
                time: new Date().toTimeString().slice(0, 5),
              }));
              openAppointmentForm();
            }}
          >
            Add Appointment
          </Button>
        </Box>
        
        {dayAppointments.length === 0 ? (
          <Alert severity="info">No appointments scheduled for this day.</Alert>
        ) : (
          <Box>
            {/* Morning Appointments */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Morning (6:00 AM - 12:00 PM)
              </Typography>
              {dayAppointments
                .filter(a => {
                  const hour = parseInt(a.time.split(':')[0]);
                  return hour >= 6 && hour < 12;
                })
                .map(appointment => renderAppointmentItem(appointment))}
              {dayAppointments.filter(a => {
                const hour = parseInt(a.time.split(':')[0]);
                return hour >= 6 && hour < 12;
              }).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No morning appointments
                </Typography>
              )}
            </Paper>
            
            {/* Afternoon Appointments */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Afternoon (12:00 PM - 5:00 PM)
              </Typography>
              {dayAppointments
                .filter(a => {
                  const hour = parseInt(a.time.split(':')[0]);
                  return hour >= 12 && hour < 17;
                })
                .map(appointment => renderAppointmentItem(appointment))}
              {dayAppointments.filter(a => {
                const hour = parseInt(a.time.split(':')[0]);
                return hour >= 12 && hour < 17;
              }).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No afternoon appointments
                </Typography>
              )}
            </Paper>
            
            {/* Evening Appointments */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Evening (5:00 PM - 10:00 PM)
              </Typography>
              {dayAppointments
                .filter(a => {
                  const hour = parseInt(a.time.split(':')[0]);
                  return hour >= 17 && hour < 22;
                })
                .map(appointment => renderAppointmentItem(appointment))}
              {dayAppointments.filter(a => {
                const hour = parseInt(a.time.split(':')[0]);
                return hour >= 17 && hour < 22;
              }).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No evening appointments
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Box>
    );
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
    return typeOption ? (
      <Box sx={{ color: 'white' }}>
        {typeOption.icon}
      </Box>
    ) : null;
  };

  // Open appointment form for creating or editing
  const openAppointmentForm = (appointment = null) => {
    if (appointment) {
      setFormData({
        id: appointment.id,
        title: appointment.title,
        date: new Date(appointment.date),
        time: appointment.time,
        clientName: appointment.clientName || "",
        vehicleInfo: appointment.vehicleInfo || "",
        type: appointment.type,
        status: appointment.status,
        description: appointment.description || "",
        invoiceId: appointment.invoiceId || "",
        createdBy: appointment.createdBy || "",
        estimatedDuration: appointment.estimatedDuration || 1,
        deliveryDate: appointment.deliveryDate ? new Date(appointment.deliveryDate) : null,
        allDay: appointment.allDay || false
      });
    } else {
      // Create new appointment
      console.log("Creating new appointment");
      setFormData({
        id: null,
        title: "",
        date: selectedDate,
        time: "10:00",
        clientName: "",
        vehicleInfo: "",
        type: "repair",
        status: "scheduled",
        description: "",
        invoiceId: "",
        createdBy: "",
        estimatedDuration: 1,
        deliveryDate: null,
        allDay: false
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

  // Save appointment (create or update)
  const handleSaveAppointment = async () => {
    // Validate form
    if (!formData.title || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      console.log("Saving appointment...");

      // Combine date and time
      const appointmentDateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(":").map(Number);
      appointmentDateTime.setHours(hours, minutes);

      // Ensure we have a delivery date for repair appointments
      let deliveryDate = formData.deliveryDate;
      if (formData.type === 'repair' && !deliveryDate) {
        deliveryDate = addDays(appointmentDateTime, formData.estimatedDuration || 1);
      }

      const appointmentData = {
        ...formData,
        date: appointmentDateTime.toISOString(),
        deliveryDate: deliveryDate ? deliveryDate.toISOString() : undefined
      };

      let updatedAppointment;

      if (formData.id) {
        console.log(`Updating appointment: ${formData.id}`);
        // Update existing appointment
        const response = await appointmentAPI.update(formData.id, appointmentData);
        updatedAppointment = response.data;

        // Update appointments state
        setAppointments((prevAppointments) => {
          return prevAppointments.map((appt) =>
            appt.id === formData.id
              ? normalizeAppointment({
                  ...updatedAppointment,
                  date: new Date(updatedAppointment.date),
                  deliveryDate: updatedAppointment.deliveryDate ? new Date(updatedAppointment.deliveryDate) : null,
                  createdAt: updatedAppointment.createdAt
                    ? new Date(updatedAppointment.createdAt)
                    : new Date(),
                })
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
          normalizeAppointment({
            ...updatedAppointment,
            date: new Date(updatedAppointment.date),
            deliveryDate: updatedAppointment.deliveryDate ? new Date(updatedAppointment.deliveryDate) : null,
            createdAt: updatedAppointment.createdAt
              ? new Date(updatedAppointment.createdAt)
              : new Date(),
          }),
        ]);
      }

      console.log("Appointment saved successfully");
      toast.success("Appointment saved successfully");
      setLoading(false);
      closeAppointmentForm();

      // Refresh appointments data
      await fetchAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      setError("Failed to save appointment");
      toast.error("Failed to save appointment");
      setLoading(false);
    }
  };

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
        const filtered = filterAppointments(
          appointments.filter(appointment => appointment.id !== appointmentId),
          statusFilter,
          typeFilter,
          selectedDate,
          showAllAppointments
        );
        setFilteredAppointments(filtered);

        toast.success("Appointment deleted successfully");
        setLoading(false);
      } catch (error) {
        console.error("Error deleting appointment:", error);
        setError("Failed to delete appointment");
        toast.error("Failed to delete appointment");
        setLoading(false);
      }
    }
  };

  // Enhance appointment rendering with better status indicators
  const renderAppointmentItem = (appointment) => {
    const isOverdue = appointment.isOverdue;
    const isUpcoming = appointment.isUpcoming;
    const statusColor = getAppointmentStatusColor(appointment.status);
    const spanDuration = appointment.duration || 1;
    const isRepair = appointment.type === 'repair';
    const hasDeliveryDate = appointment.deliveryDate && isRepair;

    return (
      <Box
        key={appointment.id}
        sx={{
          mb: { xs: 1, sm: 2 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: 1,
          boxShadow: 1,
          borderLeft: 3,
          borderColor: `${statusColor}.main`,
          bgcolor: isOverdue
            ? "error.lighter"
            : isUpcoming
            ? "success.lighter"
            : "background.paper",
          opacity: appointment.status === "cancelled" ? 0.7 : 1,
        }}
        data-testid={`appointment-item-${appointment.id}`}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between",
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, width: '100%' }}>
            <Box sx={{ mr: 1 }}>{renderAppointmentIcon(appointment.type)}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '1rem' },
                  textDecoration:
                    appointment.status === "cancelled"
                      ? "line-through"
                      : "none",
                  color: isOverdue
                    ? "error.main"
                    : isUpcoming
                    ? "success.main"
                    : "text.primary",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: { xs: 500, sm: 600 }
                }}
              >
                {appointment.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: { xs: 400, sm: 500 }
                }}
              >
                {appointment.vehicleInfo}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: "flex", 
            gap: 1, 
            alignItems: "center",
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
            {isOverdue && (
              <Chip
                size="small"
                label="Overdue"
                color="error"
                variant="outlined"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            )}
            <Chip
              label={
                appointmentStatusOptions.find(
                  (opt) => opt.value === appointment.status
                )?.label
              }
              color={statusColor}
              size="small"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            mt: { xs: 1, sm: 1 },
            flexWrap: "wrap",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Calendar size={14} style={{ marginRight: 4 }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {format(new Date(appointment.date), "MMM d")} at{" "}
              {appointment.time}
            </Typography>
          </Box>
          
          {hasDeliveryDate && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowRight size={14} style={{ marginRight: 4 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {format(new Date(appointment.deliveryDate), "MMM d")}
                {spanDuration > 1 && ` (${spanDuration} days)`}
              </Typography>
            </Box>
          )}
          
          {appointment.clientName && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <User size={14} style={{ marginRight: 4 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {appointment.clientName}
              </Typography>
            </Box>
          )}
        </Box>

        {appointment.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {appointment.description}
          </Typography>
        )}

        <Box
          sx={{ 
            display: "flex", 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "flex-end", 
            mt: { xs: 1, sm: 1 }, 
            gap: { xs: 1, sm: 1 }
          }}
        >
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' },
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' }
          }}>
            {/* Status change buttons */}
            {appointment.status !== 'completed' && (
              <Button
                size="small"
                color="success"
                variant="outlined"
                onClick={() => handleStatusChange(appointment.id, 'completed')}
                fullWidth={window.innerWidth < 600}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Mark Completed
              </Button>
            )}
            {appointment.status === 'scheduled' && (
              <Button
                size="small"
                color="info"
                variant="outlined"
                onClick={() => handleStatusChange(appointment.id, 'in_progress')}
                fullWidth={window.innerWidth < 600}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Start Work
              </Button>
            )}
          </Box>
          
          <Box sx={{ 
            display: 'flex',
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}>
            <Button
              size="small"
              onClick={() => openAppointmentForm(appointment)}
              disabled={loading || syncStatus.syncInProgress}
              fullWidth={window.innerWidth < 600}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleDeleteAppointment(appointment.id)}
              disabled={loading || syncStatus.syncInProgress}
              fullWidth={window.innerWidth < 600}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  // Update the appointments list rendering
  const renderAppointmentsList = () => {
    return (
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {showAllAppointments
                  ? "All Appointments"
                  : `Appointments for ${format(selectedDate, "MMMM d, yyyy")}`}
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => openAppointmentForm()}
                disabled={loading || syncStatus.syncInProgress}
                startIcon={<Plus size={16} />}
              >
                New
              </Button>
            </Box>
          }
          action={
            <Button
              size="small"
              onClick={() => setShowAllAppointments(!showAllAppointments)}
            >
              {showAllAppointments ? "Show Selected Day" : "Show All"}
            </Button>
          }
        />
        <CardContent sx={{ maxHeight: 600, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError(null);
                    fetchAppointments();
                  }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : filteredAppointments.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No appointments found for the selected filters.
            </Alert>
          ) : (
            filteredAppointments.map(renderAppointmentItem)
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
          status: newStatus,
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

  const handleStatusChange = useCallback(async (appointmentId, newStatus) => {
    if (syncStatus.syncInProgress) {
      console.log("Sync in progress, skipping status update");
      return;
    }

    try {
      setLoading(true);
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

      const appointment = appointments.find(
        (a) => a.id === appointmentId || a._id === appointmentId
      );
      
      if (!appointment) {
        console.error(`Appointment ${appointmentId} not found`);
        toast.error("Appointment not found");
        return;
      }

      await appointmentsAPI.updateStatus(appointmentId, newStatus);
      console.log(`Updated appointment ${appointmentId} status to ${newStatus}`);

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

      // Update filtered appointments
      const filtered = filterAppointments(
        updatedAppointments,
        statusFilter,
        typeFilter,
        selectedDate,
        showAllAppointments
      );
      setFilteredAppointments(filtered);

      toast.success(`Appointment status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    } finally {
      setLoading(false);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [appointments, filterAppointments, statusFilter, typeFilter, selectedDate, showAllAppointments, syncStatus.syncInProgress]);

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: { xs: 2, sm: 4 }, 
        mb: { xs: 2, sm: 4 },
        width: isFullPage ? '100%' : 'auto',
        px: { xs: 1, sm: isFullPage ? 0 : 2 },
        height: 'calc(100vh - 64px)', // Adjusted to account for header
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setError(null);
                fetchAppointments();
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Main Grid Container for Calendar and Appointments List */}
      <Grid 
        container 
        spacing={2} 
        sx={{ 
          height: '100%',
          flex: 1,
          minHeight: 0 // Important for proper flex behavior
        }}
      >
        {/* Calendar Section - Takes 2/3 of the space */}
        <Grid 
          item 
          xs={12} 
          md={8} 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0 // Important for proper flex behavior
          }}
        >
          <Card 
            sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <CardContent 
              sx={{ 
                p: { xs: 1, sm: isFullPage ? 4 : 2 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                height: '100%',
                '& > *': { // Ensure all direct children respect the container
                  minHeight: 0
                }
              }}
            >
              {/* Calendar Header */}
              {renderHeader()}

              {/* Calendar View */}
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0 // Important for proper flex behavior
              }}>
                {viewMode === "month" ? (
                  <>
                    {renderDays()}
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'auto',
                      minHeight: 0 // Important for proper flex behavior
                    }}>
                      {renderCells()}
                    </Box>
                  </>
                ) : (
                  renderDayView()
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Appointments List Section - Takes 1/3 of the space */}
        <Grid 
          item 
          xs={12} 
          md={4}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0 // Important for proper flex behavior
          }}
        >
          {renderAppointmentsList()}
        </Grid>
      </Grid>

      {/* Appointment Form Dialog */}
      <Dialog open={appointmentFormOpen} onClose={closeAppointmentForm}>
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
                data-testid="appointment-title-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Client Name"
                fullWidth
                value={formData.clientName}
                onChange={(e) => handleFormChange("clientName", e.target.value)}
                data-testid="client-name-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Vehicle Information"
                fullWidth
                value={formData.vehicleInfo}
                onChange={(e) => handleFormChange("vehicleInfo", e.target.value)}
                placeholder="Year Make Model"
                data-testid="vehicle-info-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={format(formData.date, "yyyy-MM-dd")}
                onChange={(e) => handleFormChange("date", new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
                data-testid="appointment-date-input"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Time"
                type="time"
                fullWidth
                value={format(formData.time, "HH:mm")}
                onChange={(e) => handleFormChange("time", e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                data-testid="appointment-time-input"
              />
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

            {formData.type === 'repair' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Estimated Duration (days)"
                    type="number"
                    fullWidth
                    value={formData.estimatedDuration}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value) || 1;
                      handleFormChange("estimatedDuration", duration);
                      // Update delivery date based on new duration
                      if (!formData.deliveryDate) {
                        handleFormChange("deliveryDate", addDays(formData.date, duration));
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                    helperText="Estimated number of days for repair"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Delivery Date"
                    type="date"
                    fullWidth
                    value={formData.deliveryDate ? format(formData.deliveryDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => handleFormChange("deliveryDate", e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Expected completion date"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                data-testid="appointment-description-input"
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : formData.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentCalendar;