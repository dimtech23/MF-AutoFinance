const AppointmentCalendar = ({ 
  isFullPage = false,
  onError = (error) => toast.error(error.message || 'An error occurred'),
  clients = [],
  onCreateInvoiceFromAppointment = null,
  onAppointmentUpdate = null
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
  const [viewMode, setViewMode] = useState(isFullPage ? "month" : "week");
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [selectedMilestoneType, setSelectedMilestoneType] = useState("");
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSync: null,
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Enhanced error handling
  const handleApiError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `An error occurred while ${context}`;
    setError(errorMessage);
    onError({ message: errorMessage, context });
  }, [onError]);

  // Fetch appointments with retry logic
  const fetchAppointments = useCallback(async (retryCount = 0) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setAppointments(response.data);
        setFilteredAppointments(response.data);
        setSyncStatus(prev => ({ ...prev, lastSync: new Date() }));
      }
    } catch (error) {
      if (retryCount < 3) {
        console.warn(`Retrying appointment fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchAppointments(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        handleApiError(error, "fetching appointments");
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleApiError]);

  // Effect to fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, refreshTrigger]);

  // Filter appointments based on current filters
  useEffect(() => {
    let filtered = [...appointments];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(apt => apt.type === typeFilter);
    }
    
    if (!showAllAppointments) {
      const today = new Date();
      filtered = filtered.filter(apt => new Date(apt.date) >= today);
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, typeFilter, showAllAppointments]);

  // Handle appointment status update
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setAppointments(prev => 
          prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt)
        );
        if (onAppointmentUpdate) {
          onAppointmentUpdate(appointmentId, newStatus);
        }
        toast.success("Appointment status updated successfully");
      }
    } catch (error) {
      handleApiError(error, "updating appointment status");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced render method with loading and error states
  const renderContent = () => {
    if (loading && appointments.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setRefreshTrigger(prev => prev + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    return (
      <>
        {/* Calendar Controls */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Button
              variant={viewMode === "month" ? "contained" : "outlined"}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "contained" : "outlined"}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "contained" : "outlined"}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
          </ButtonGroup>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="inspection">Inspection</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showAllAppointments}
                onChange={(e) => setShowAllAppointments(e.target.checked)}
              />
            }
            label="Show Past Appointments"
          />

          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setAppointmentFormOpen(true)}
          >
            New Appointment
          </Button>
        </Box>

        {/* Calendar View */}
        <Box sx={{ 
          height: isFullPage ? 'calc(100vh - 300px)' : '600px',
          position: 'relative'
        }}>
          {viewMode === "month" && (
            <MonthView
              appointments={filteredAppointments}
              currentMonth={currentMonth}
              onDateClick={setSelectedDate}
              onAppointmentClick={(apt) => {
                setFormData(apt);
                setAppointmentFormOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              appointments={filteredAppointments}
              selectedDate={selectedDate}
              onDateClick={setSelectedDate}
              onAppointmentClick={(apt) => {
                setFormData(apt);
                setAppointmentFormOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
          {viewMode === "day" && (
            <DayView
              appointments={filteredAppointments}
              selectedDate={selectedDate}
              onAppointmentClick={(apt) => {
                setFormData(apt);
                setAppointmentFormOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </Box>

        {/* Appointment Form Dialog */}
        <AppointmentFormDialog
          open={appointmentFormOpen}
          onClose={() => {
            setAppointmentFormOpen(false);
            setFormData({
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
          }}
          formData={formData}
          clients={clients}
          onSubmit={async (data) => {
            try {
              setLoading(true);
              if (data.id) {
                // Update existing appointment
                await axios.patch(
                  `${process.env.REACT_APP_API_URL}/api/appointments/${data.id}`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Appointment updated successfully");
              } else {
                // Create new appointment
                const response = await axios.post(
                  `${process.env.REACT_APP_API_URL}/api/appointments`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data?.invoiceId && onCreateInvoiceFromAppointment) {
                  onCreateInvoiceFromAppointment(response.data.invoiceId);
                }
                toast.success("Appointment created successfully");
              }
              setRefreshTrigger(prev => prev + 1);
              setAppointmentFormOpen(false);
            } catch (error) {
              handleApiError(error, data.id ? "updating appointment" : "creating appointment");
            } finally {
              setLoading(false);
            }
          }}
        />
      </>
    );
  };

  return (
    <Box sx={{ 
      p: isFullPage ? 3 : 2,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 1
    }}>
      {renderContent()}
    </Box>
  );
};

// ... existing code ... 