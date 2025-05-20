const AppointmentCalendar = ({ 
  isFullPage = false,
  onError = (error) => toast.error(error.message || 'An error occurred')
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

  const handleApiError = (error, context) => {
    setError(error.message || `An error occurred while ${context}`);
    onError(error);
  };

  // Remove debugAppointments function
} 