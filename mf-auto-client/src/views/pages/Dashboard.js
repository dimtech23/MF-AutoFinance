import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserContext } from "../../Context/UserContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle,
  Wrench,
  Truck,
  FileText,
  Tag,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Trash2
} from "lucide-react";
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
  Tab,
  Tabs,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ButtonGroup,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Tooltip,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
} from "@mui/material";
import {
  BarChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
} from "recharts";
import { useTheme } from "@mui/material/styles";

// Lazy-loaded components
const AppointmentCalendar = React.lazy(() => import("components/Calendar/AppointmentCalendar.js"));

// Add error boundary component
class AppointmentCalendarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppointmentCalendar Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ p: 3, mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load appointment calendar. Please try refreshing the page.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Error details: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshCw />}
          >
            Refresh Page
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Chart error boundary for ResizeObserver issues
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Only catch ResizeObserver errors
    if (error && error.message && error.message.includes('ResizeObserver')) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    // Only log ResizeObserver errors, let others bubble up
    if (error && error.message && error.message.includes('ResizeObserver')) {
      console.warn('Chart resize error caught and handled:', error.message);
    } else {
      throw error; // Re-throw non-ResizeObserver errors
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <BarChart size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                Chart temporarily unavailable
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please refresh the page if this persists
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// Dashboard Cache Class
class DashboardCache {
  constructor() {
    this.data = {};
    this.timestamp = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache duration
  }

  isValid() {
    if (!this.timestamp) return false;
    const now = new Date().getTime();
    return (now - this.timestamp) < this.cacheDuration;
  }

  update(key, data) {
    this.data[key] = data;
    this.timestamp = new Date().getTime();
  }

  clear() {
    this.data = {};
    this.timestamp = null;
  }

  get(key) {
    return this.data[key];
  }
}

// Create cache instance
const dashboardCache = new DashboardCache();

// Fallback data for development or when API fails
const fallbackData = null;

// Stat Card Component
const StatCard = ({ title, value, icon, trend = null, color = "primary.main", formatters, timeRange }) => {
  const IconComponent = icon;
  
  return (
    <Card sx={{ 
      height: "100%", 
      transition: "transform 0.2s ease-in-out",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: 4
      }
    }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color: color }}>
              {formatters?.currency ? formatters.currency(value) : value}
            </Typography>
            {trend && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                {trend.direction === "up" ? (
                  <ArrowUp size={16} color="#2dce89" />
                ) : (
                  <ArrowDown size={16} color="#f44336" />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 0.5, 
                    color: trend.direction === "up" ? "#2dce89" : "#f44336",
                    fontWeight: 500
                  }}
                >
                  {trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color }}>
            <IconComponent size={24} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, token } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false); // Start with false to avoid initial loading state
  const [error, setError] = useState(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [appointmentAvailability, setAppointmentAvailability] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [repairStatusData, setRepairStatusData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);
  const [popularServicesData, setPopularServicesData] = useState([]);
  const [vehicleMakesData, setVehicleMakesData] = useState([]);
  const [dailyWorkloadData, setDailyWorkloadData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("month");

  // Suppress ResizeObserver warnings (harmless browser warnings)
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
        return; // Suppress this specific warning
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const theme = useTheme();

  // Formatter utilities
  const formatters = {
    currency: (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "GMD",
        minimumFractionDigits: 2,
      }).format(amount).replace(/GMD/g, "D");
    },
    
    date: (dateString) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },
    
    dateTime: (dateTimeString) => {
      if (!dateTimeString) return "N/A";
      const date = new Date(dateTimeString);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    },
    
    chartDate: (dateStr) => {
      if (!dateStr) return "";
      return dateStr;
    }
  };

  // Enhanced error handling
  const handleApiError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    // Only show critical errors to users, not loading or data fetch errors
    if (context.includes('login') || context.includes('auth')) {
      const errorMessage = error.response?.data?.message || error.message || `An error occurred while ${context}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } else {
      // For dashboard data errors, just log them and continue with empty data
      console.warn(`Non-critical error in ${context}:`, error.message);
    }
  }, []);

  // API request with built-in error handling and retry logic
  const apiRequest = useCallback(async (endpoint, options = {}, retryCount = 0) => {
    try {
      // Use the environment variable for API URL to maintain consistency with auth
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const fullURL = `${baseURL}/api/${endpoint}`;
      
      console.log(`Making API request to: ${fullURL}`);
      console.log(`Token available: ${!!token}`);
      
      const response = await axios({
        url: fullURL,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        ...options
      });
      
      console.log(`API request successful for ${endpoint}:`, response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      if (retryCount < 3) {
        console.warn(`Retrying ${endpoint} request (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return apiRequest(endpoint, options, retryCount + 1);
      }
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || "An error occurred" 
      };
    }
  }, [token]);

  // Parallel data fetching for dashboard with improved error handling
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    
    // Don't start loading if already loading
    if (loading && !forceRefresh) return;
    
    setLoading(true);
    setError(null);
    
    // Add loading timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn("Dashboard loading timeout - forcing completion");
      setLoading(false);
      setLastUpdated(new Date());
    }, 10000); // 10 second timeout
    
    // Check if we have valid cached data and not forcing refresh
    if (!forceRefresh && dashboardCache.isValid()) {
      console.log("Using cached dashboard data");
      console.log("Cache timestamp:", new Date(dashboardCache.timestamp).toLocaleString());
      setFinancialSummary(dashboardCache.get('data'));
      setRecentTransactions(dashboardCache.get('transactions') || []);
      setUpcomingAppointments(dashboardCache.get('appointments') || []);
      setRepairStatusData(dashboardCache.get('clients') || []);
      setPaymentStatusData(dashboardCache.get('clients') || []); // Use clients data for payment status
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }
    
    try {
      console.log("Fetching fresh dashboard data...");
      console.log("API URL base:", process.env.REACT_APP_API_URL || 'http://localhost:4000');
      console.log("Token available:", !!token);
      
      // Test backend connectivity first
      try {
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        const healthCheck = await axios.get(`${baseURL}/api`);
        console.log("Backend health check successful:", healthCheck.data);
      } catch (healthError) {
        console.error("Backend health check failed:", {
          message: healthError.message,
          status: healthError.response?.status,
          statusText: healthError.response?.statusText
        });
        console.log("This might indicate the backend is not running or not accessible");
      }
      
      // Fetch all data in parallel with Promise.allSettled for better error handling
      const [
        statsRes,
        transactionsRes,
        appointmentsRes,
        clientsRes
      ] = await Promise.allSettled([
        apiRequest(`dashboard/stats?timeRange=${timeRange}`),
        apiRequest('dashboard/transactions'),
        apiRequest('dashboard/appointments'),
        apiRequest('clients')
      ]);
      
      console.log("API Responses:", {
        stats: statsRes,
        transactions: transactionsRes,
        appointments: appointmentsRes,
        clients: clientsRes
      });
      
      // Process stats results
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        const data = statsRes.value.data;
        console.log("Setting financial summary:", data);
        console.log("Financial summary details:", {
          totalIncome: data.financialSummary?.totalIncome,
          netProfit: data.financialSummary?.netProfit,
          averageServiceValue: data.financialSummary?.averageServiceValue,
          monthlyFinancials: data.monthlyFinancials?.length || 0
        });
        
        // Extract financial summary from the response
        const financialData = {
          totalIncome: data.financialSummary?.totalIncome || 0,
          netProfit: data.financialSummary?.netProfit || 0,
          averageServiceValue: data.financialSummary?.averageServiceValue || 0,
          monthlyFinancials: data.monthlyFinancials || [],
          servicesByType: data.servicesByType || [],
          vehiclesByMake: data.vehiclesByMake || [],
          appointmentAvailability: data.appointmentAvailability || null
        };
        setFinancialSummary(financialData);
        setPopularServicesData(data.servicesByType || []);
        setVehicleMakesData(data.vehiclesByMake || []);
        setAppointmentAvailability(data.appointmentAvailability || null);
        dashboardCache.update('data', financialData);
      } else {
        console.warn("Failed to fetch dashboard stats, will calculate from other data");
        // Don't set financialSummary to null yet, wait for other data
      }
      
      // Process transactions results
      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
        const data = transactionsRes.value.data;
        console.log("Setting transactions:", data);
        setRecentTransactions(data);
        dashboardCache.update('transactions', data);
      } else {
        console.warn("Failed to fetch transactions, using empty array");
        setRecentTransactions([]);
      }
      
      // Process appointments results
      if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value.success) {
        const data = appointmentsRes.value.data;
        console.log("Setting appointments:", data);
        setUpcomingAppointments(data);
        dashboardCache.update('appointments', data);
      } else {
        console.warn("Failed to fetch appointments, using empty array");
        setUpcomingAppointments([]);
      }
      
      // Process clients results
      if (clientsRes.status === 'fulfilled' && clientsRes.value.success) {
        const data = clientsRes.value.data;
        console.log("Setting clients data:", data);
        setRepairStatusData(data);
        setPaymentStatusData(data); // Use clients data for payment status too
        dashboardCache.update('clients', data);
        
        // If dashboard stats failed, calculate financial data from clients and transactions
        if (!statsRes.status === 'fulfilled' || !statsRes.value.success) {
          console.log("Calculating financial data from clients and transactions...");
          
          // Calculate from transactions (invoices)
          const transactions = transactionsRes.status === 'fulfilled' && transactionsRes.value.success 
            ? transactionsRes.value.data : [];
          
          const totalIncome = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
          const netProfit = totalIncome; // No expenses tracking in current system
          const averageServiceValue = transactions.length > 0 ? totalIncome / transactions.length : 0;
          
          // Calculate services by type from clients
          const serviceCounts = {};
          data.forEach(client => {
            if (client.procedures && Array.isArray(client.procedures)) {
              client.procedures.forEach(procedure => {
                const procName = procedure.label || procedure.name || procedure;
                if (procName && typeof procName === 'string') {
                  serviceCounts[procName] = (serviceCounts[procName] || 0) + 1;
                }
              });
            }
          });
          
          const servicesByType = Object.entries(serviceCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          
          // Calculate vehicles by make from clients
          const makeCounts = {};
          data.forEach(client => {
            if (client.carDetails?.make) {
              const make = client.carDetails.make;
              makeCounts[make] = (makeCounts[make] || 0) + 1;
            }
          });
          
          const vehiclesByMake = Object.entries(makeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          
          const financialData = {
            totalIncome,
            netProfit,
            averageServiceValue,
            monthlyFinancials: [], // Would need more complex calculation
            servicesByType,
            vehiclesByMake,
            appointmentAvailability: null
          };
          
          setFinancialSummary(financialData);
          setPopularServicesData(servicesByType);
          setVehicleMakesData(vehiclesByMake);
          dashboardCache.update('data', financialData);
        }
      } else {
        console.warn("Failed to fetch clients, using empty array");
        setRepairStatusData([]);
        setPaymentStatusData([]);
        
        // If all data failed, set empty financial summary
        if (!statsRes.status === 'fulfilled' || !statsRes.value.success) {
          setFinancialSummary(null);
        }
      }
      
    } catch (error) {
      handleApiError(error, "fetching dashboard data");
      // Set null data on complete failure but don't show error to user
      setFinancialSummary(null);
      setRecentTransactions([]);
      setUpcomingAppointments([]);
      setRepairStatusData([]);
      setPaymentStatusData([]);
      setPopularServicesData([]);
      setVehicleMakesData([]);
      setAppointmentAvailability(null);
      // Don't set error state for dashboard data failures
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
      clearTimeout(loadingTimeout);
    }
  }, [token, timeRange, loading]);

  // Effect to fetch data when component mounts or token changes
  useEffect(() => {
    console.log("Dashboard useEffect triggered:", {
      token: !!token,
      tokenLength: token ? token.length : 0,
      dataInitialized,
      user: user ? { id: user.id, email: user.email, role: user.role } : null
    });
    
    if (token && !dataInitialized) {
      setDataInitialized(true);
      fetchDashboardData();
    } else if (!token) {
      console.warn("No token available - user may not be logged in");
      setError("Please log in to view dashboard data");
    }
  }, [token, dataInitialized]);

  // Effect to re-fetch data when time range changes or refresh is triggered
  useEffect(() => {
    if (dataInitialized && token && refreshTrigger > 0) {
      fetchDashboardData(true); // Force refresh
    }
  }, [refreshTrigger, dataInitialized, token]);

  // Listen for payment updates from Clients page
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      console.log('Payment update received, refreshing dashboard data');
      dashboardCache.clear(); // Clear cache to force fresh data
      setRefreshTrigger(prev => prev + 1);
    };

    const handleClientUpdate = (event) => {
      console.log('Client update received, refreshing dashboard data');
      dashboardCache.clear(); // Clear cache to force fresh data
      setRefreshTrigger(prev => prev + 1);
    };

    const handleInvoiceUpdate = (event) => {
      console.log('Invoice update received, refreshing dashboard data');
      dashboardCache.clear(); // Clear cache to force fresh data
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('payment-updated', handlePaymentUpdate);
    window.addEventListener('client-updated', handleClientUpdate);
    window.addEventListener('invoice-updated', handleInvoiceUpdate);
    
    return () => {
      window.removeEventListener('payment-updated', handlePaymentUpdate);
      window.removeEventListener('client-updated', handleClientUpdate);
      window.removeEventListener('invoice-updated', handleInvoiceUpdate);
    };
  }, []);

  // Periodic refresh for payment data to ensure sync (reduced frequency)
  useEffect(() => {
    if (!dataInitialized || !token) return;

    const interval = setInterval(() => {
      // Only refresh if data is stale and not currently loading
      if (!loading && !dashboardCache.isValid()) {
        console.log('Periodic payment data refresh');
        setRefreshTrigger(prev => prev + 1);
      }
    }, 60000); // Refresh every 60 seconds instead of 30

    return () => clearInterval(interval);
  }, [dataInitialized, token, loading]);

  // Handle appointment updates
  const handleAppointmentUpdate = useCallback((appointmentId, newStatus) => {
    // Update local state
    setUpcomingAppointments(prev => 
      prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt)
    );
    
    // Clear cache to force refresh on next load
    dashboardCache.clear();
    
    // Trigger refresh
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle manual refresh with cache clearing
  const handleManualRefresh = useCallback(() => {
    console.log('Manual refresh triggered - clearing cache and fetching fresh data');
    dashboardCache.clear();
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Income vs Expenses Chart - Replace with Repair Status Distribution
  const renderRepairStatusChart = () => {
    console.log("Rendering repair status chart with data:", repairStatusData);
    // Always show the chart, even with empty data
    const validClients = repairStatusData ? repairStatusData.filter(c => c && c.repairStatus) : [];
    console.log("Valid clients for repair status:", validClients);

    const statusData = [
      { name: 'Waiting', value: validClients.filter(c => c.repairStatus === 'waiting').length, color: '#ff9800', icon: '⏳' },
      { name: 'In Progress', value: validClients.filter(c => c.repairStatus === 'in_progress').length, color: '#2196f3', icon: '🔧' },
      { name: 'Completed', value: validClients.filter(c => c.repairStatus === 'completed').length, color: '#4caf50', icon: '✅' },
      { name: 'Delivered', value: validClients.filter(c => c.repairStatus === 'delivered').length, color: '#9c27b0', icon: '🚗' },
      { name: 'Cancelled', value: validClients.filter(c => c.repairStatus === 'cancelled').length, color: '#f44336', icon: '❌' }
    ].filter(item => item.value > 0);
    console.log("Status data for chart:", statusData);

    const totalRepairs = statusData.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Wrench size={24} style={{ color: '#2196f3' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Repair Status Distribution
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Current status of all vehicle repairs
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {totalRepairs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Repairs
              </Typography>
            </Box>
          }
        />
        <CardContent>
          {statusData.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <Wrench size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No repairs recorded yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Repair statuses will appear here as clients are added
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}\n${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const percentage = ((data.value / totalRepairs) * 100).toFixed(1);
                      return (
                        <Box sx={{ 
                          bgcolor: 'background.paper', 
                          p: 2, 
                          border: '1px solid #ccc',
                          borderRadius: 2,
                          boxShadow: 3,
                          minWidth: 200
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h4">{data.payload.icon}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: data.color }}>
                              {data.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: data.color, 
                              borderRadius: '50%' 
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {data.value} vehicles
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {percentage}% of total repairs
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  // Payment Status Chart
  const renderPaymentStatusChart = () => {
    console.log("Rendering payment status chart with data:", paymentStatusData);
    // Always show the chart, even with empty data
    const validPayments = paymentStatusData ? paymentStatusData.filter(c => c && c.paymentStatus) : [];
    console.log("Valid payments for payment status:", validPayments);

    // Calculate payment amounts with proper field mapping
    const paidAmount = validPayments
      .filter(c => c.paymentStatus === 'paid')
      .reduce((sum, c) => {
        // For paid services, use the actual payment amount
        const paymentAmount = c.partialPaymentAmount || c.totalAmount || c.estimatedCost || 0;
        console.log(`Paid client ${c.clientName}: paymentAmount = ${paymentAmount}`);
        return sum + paymentAmount;
      }, 0);
    
    const partialAmount = validPayments
      .filter(c => c.paymentStatus === 'partial')
      .reduce((sum, c) => {
        // For partial payments, use the partial payment amount
        const paymentAmount = c.partialPaymentAmount || 0;
        console.log(`Partial client ${c.clientName}: paymentAmount = ${paymentAmount}`);
        return sum + paymentAmount;
      }, 0);
    
    const unpaidAmount = validPayments
      .filter(c => c.paymentStatus === 'not_paid')
      .reduce((sum, c) => {
        // For unpaid services, use the estimated cost
        const paymentAmount = c.estimatedCost || c.totalAmount || 0;
        console.log(`Unpaid client ${c.clientName}: paymentAmount = ${paymentAmount}`);
        return sum + paymentAmount;
      }, 0);

    console.log("Payment calculations:", {
      paidAmount,
      partialAmount,
      unpaidAmount,
      total: paidAmount + partialAmount + unpaidAmount
    });

    const paymentData = [
      { 
        name: 'Paid', 
        value: validPayments.filter(c => c.paymentStatus === 'paid').length, 
        amount: paidAmount,
        color: '#4caf50', 
        icon: '💰' 
      },
      { 
        name: 'Not Paid', 
        value: validPayments.filter(c => c.paymentStatus === 'not_paid').length, 
        amount: unpaidAmount,
        color: '#f44336', 
        icon: '⚠️' 
      },
      { 
        name: 'Partial', 
        value: validPayments.filter(c => c.paymentStatus === 'partial').length, 
        amount: partialAmount,
        color: '#ff9800', 
        icon: '💳' 
      }
    ].filter(item => item.value > 0);

    const totalPayments = paymentData.reduce((sum, item) => sum + item.value, 0);
    const totalAmount = paymentData.reduce((sum, item) => sum + item.amount, 0);

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DollarSign size={24} style={{ color: '#4caf50' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Payment Status Overview
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Current payment status and amounts of all services
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                D{totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalPayments} Services
              </Typography>
            </Box>
          }
        />
        <CardContent>
          {paymentData.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <DollarSign size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No payment data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment statuses will appear here as clients are added
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}\n${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const percentage = ((data.value / totalPayments) * 100).toFixed(1);
                      return (
                        <Box sx={{ 
                          bgcolor: 'background.paper', 
                          p: 2, 
                          border: '1px solid #ccc',
                          borderRadius: 2,
                          boxShadow: 3,
                          minWidth: 200
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h4">{data.payload.icon}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: data.color }}>
                              {data.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: data.color, 
                              borderRadius: '50%' 
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {data.value} services
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {percentage}% of total services
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            D{data.payload.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  // Monthly Revenue Trend
  const renderMonthlyRevenueChart = () => {
    // Always show the chart, even with empty data
    if (!financialSummary?.monthlyFinancials || financialSummary.monthlyFinancials.length === 0) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Revenue Trend
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Revenue performance over the selected time period
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <TrendingUp size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No revenue data available for this period
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revenue data will appear here as invoices and payments are recorded
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setTimeRange('year')}
                startIcon={<RefreshCw size={16} />}
              >
                View Annual Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Check if all values are zero
    const hasData = financialSummary.monthlyFinancials.some(item => item.income > 0);
    if (!hasData) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Revenue Trend
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Revenue performance over the selected time period
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <TrendingUp size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No revenue recorded in this period
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try selecting a different time range or check if invoices have been created
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ mb: 1 }}>
              Monthly Revenue Trend
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Revenue performance over the selected time period ({timeRange})
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {formatters.currency(financialSummary.monthlyFinancials.reduce((sum, item) => sum + item.income, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={financialSummary.monthlyFinancials}
              margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatters.chartDate}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatters.currency(value)}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const { value, color } = payload[0] || {};
                    return (
                      <Box sx={{ 
                        bgcolor: 'background.paper', 
                        p: 2, 
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        boxShadow: 3
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {label} Revenue
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: color, 
                            mr: 1, 
                            borderRadius: '50%' 
                          }} />
                          <Typography variant="body2">
                            {value}: {formatters.currency(value)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                name="Revenue" 
                stroke="#2dce89" 
                strokeWidth={3}
                dot={{ fill: '#2dce89', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Popular Services Chart
  const renderPopularServicesChart = () => {
    if (!popularServicesData || popularServicesData.length === 0) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Wrench size={24} style={{ color: '#11cdef' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Popular Services
                </Typography>
              </Box>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Most requested repair services by revenue and frequency
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <Wrench size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No service data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Service data will appear here as invoices are created with service items
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300 }}>
                Tip: Create invoices with detailed service descriptions to see service analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300, fontStyle: 'italic' }}>
                If you see old data after removing records, try the "Clear Cache" button above
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Check if all values are zero
    const hasData = popularServicesData.some(item => item.value > 0);
    if (!hasData) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Wrench size={24} style={{ color: '#11cdef' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Popular Services
                </Typography>
              </Box>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Most requested repair services by revenue and frequency
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <Wrench size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No services with revenue recorded
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Services appear here when invoices have pricing information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300, fontStyle: 'italic' }}>
                If you see old data after removing records, try the "Clear Cache" button above
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Fixed height for better visibility
    const chartHeight = 400;

    // Enhanced colors for services with better contrast
    const serviceColors = [
      '#2dce89', '#11cdef', '#fb6340', '#f5365c', 
      '#5603ad', '#2152ff', '#23d160', '#ff9f43',
      '#e74c3c', '#3498db', '#9b59b6', '#f39c12'
    ];

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Wrench size={24} style={{ color: '#11cdef' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Popular Services
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Most requested repair services by revenue and frequency
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {formatters.currency(popularServicesData.reduce((sum, item) => sum + item.value, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={popularServicesData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatters.currency(value)}
                tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={140}
                tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const { value, color } = payload[0] || {};
                    return (
                      <Box sx={{ 
                        bgcolor: 'background.paper', 
                        p: 2, 
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        boxShadow: 3
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: color, 
                            mr: 1, 
                            borderRadius: '50%' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {value} new services
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#fb6340" 
                radius={[4, 4, 0, 0]}
                background={{ fill: '#f8f9fa' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Vehicle Makes Distribution
  const renderVehicleMakesChart = () => {
    if (!vehicleMakesData || vehicleMakesData.length === 0) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Truck size={24} style={{ color: '#9c27b0' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Vehicle Makes Distribution
                </Typography>
              </Box>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Most common vehicle makes in service
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <Truck size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No vehicle data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vehicle makes will appear here as clients are added
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    const totalVehicles = vehicleMakesData.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Truck size={24} style={{ color: '#9c27b0' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Vehicle Makes Distribution
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Most common vehicle makes in service
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {totalVehicles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Vehicles
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={vehicleMakesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}\n${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {vehicleMakesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const percentage = ((data.value / totalVehicles) * 100).toFixed(1);
                    return (
                      <Box sx={{ 
                        bgcolor: 'background.paper', 
                        p: 2, 
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        boxShadow: 3,
                        minWidth: 200
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Truck size={20} style={{ color: data.color }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: data.color }}>
                            {data.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: data.color, 
                            borderRadius: '50%' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {data.value} vehicles
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {percentage}% of total vehicles
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Daily Workload Chart
  const renderDailyWorkloadChart = () => {
    if (!repairStatusData || repairStatusData.length === 0) {
      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={24} style={{ color: '#fb6340' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Daily Workload
                </Typography>
              </Box>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                New services per day (last 7 days)
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 300,
              gap: 2
            }}>
              <Calendar size={48} color="#ccc" />
              <Typography variant="body1" color="text.secondary">
                No workload data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Daily workload will appear here as clients are added
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Group clients by creation date
    const dailyCounts = {};
    repairStatusData.forEach(client => {
      const date = new Date(client.createdAt).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const workloadData = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days

    const totalWorkload = workloadData.reduce((sum, item) => sum + item.count, 0);

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={24} style={{ color: '#fb6340' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Daily Workload
              </Typography>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              New services per day (last 7 days)
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {totalWorkload}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total (7 days)
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={workloadData}
              margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={60}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const { value, color } = payload[0] || {};
                    const avgWorkload = totalWorkload / workloadData.length;
                    const isAboveAverage = value > avgWorkload;
                    return (
                      <Box sx={{ 
                        bgcolor: 'background.paper', 
                        p: 2, 
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        boxShadow: 3
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: color, 
                            mr: 1, 
                            borderRadius: '50%' 
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {value} new services
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {isAboveAverage ? 'Above' : 'Below'} average ({avgWorkload.toFixed(1)})
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#fb6340" 
                radius={[4, 4, 0, 0]}
                background={{ fill: '#f8f9fa' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Financial Summary Cards
  const renderFinancialSummaryCards = () => {
    if (!financialSummary && loading) {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      Total Garage Revenue
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color: '#2dce89' }}>
                      Loading...
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#2dce8920', color: '#2dce89' }}>
                    <DollarSign size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      Net Profit
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color: '#11cdef' }}>
                      Loading...
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#11cdef20', color: '#11cdef' }}>
                    <TrendingUp size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      Average Service Value
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold", color: '#fb6340' }}>
                      Loading...
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#fb634020', color: '#fb6340' }}>
                    <Tag size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Garage Revenue"
            value={financialSummary?.totalIncome || 0}
            icon={DollarSign}
            trend={{ direction: 'up', value: 12 }}
            color='#2dce89'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Net Profit"
            value={financialSummary?.netProfit || 0}
            icon={TrendingUp}
            trend={{ direction: 'up', value: 15 }}
            color='#11cdef'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Service Value"
            value={financialSummary?.averageServiceValue || 0}
            icon={Tag}
            trend={{ direction: 'up', value: 5 }}
            color='#fb6340'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
      </Grid>
    );
  };

  // Recent Transactions Table
  const renderRecentTransactionsTable = () => {
    if (!recentTransactions || recentTransactions.length === 0) {
      return (
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileText size={20} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Recent Transactions</Typography>
              </Box>
            }
          />
          <CardContent>
            <Alert severity="info">No recent transactions available</Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FileText size={20} style={{ marginRight: '8px' }} />
              <Typography variant="h6">Recent Transactions</Typography>
            </Box>
          }
          action={
            <Button
              color="primary"
              variant="outlined"
              size="small"
              href="/admin/invoices"
            >
              View All
            </Button>
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id || transaction._id}>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatters.date(transaction.date || transaction.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.customerInfo?.name || 'Unknown'}
                      </Typography>
                      {transaction.vehicleInfo && (
                        <Typography variant="caption" color="text.secondary">
                          {typeof transaction.vehicleInfo === 'string' 
                            ? transaction.vehicleInfo 
                            : transaction.vehicleInfo.year && transaction.vehicleInfo.make && transaction.vehicleInfo.model
                              ? `${transaction.vehicleInfo.year} ${transaction.vehicleInfo.make} ${transaction.vehicleInfo.model}`
                              : 'Vehicle info available'
                          }
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.category || transaction.type || 'income'}
                        size="small"
                        color={transaction.type === 'income' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.description || 'Service transaction'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatters.currency(transaction.amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Upcoming Appointments Component
  const renderUpcomingAppointments = () => {
    if (!upcomingAppointments || upcomingAppointments.length === 0) {
      return (
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Calendar size={20} style={{ marginRight: '8px' }} />
                <Typography variant="h6">Upcoming Appointments</Typography>
              </Box>
            }
          />
          <CardContent>
            <Alert severity="info">No upcoming appointments scheduled</Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Calendar size={20} style={{ marginRight: '8px' }} />
              <Typography variant="h6">Upcoming Appointments</Typography>
            </Box>
          }
          action={
            <Button
              color="primary"
              variant="outlined"
              size="small"
              href="/admin/appointments"
            >
              View Calendar
            </Button>
          }
        />
        <CardContent>
          <List>
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <ListItem
                key={appointment.id || appointment._id}
                sx={{ 
                  borderLeft: 3, 
                  borderColor: appointment.status === 'confirmed' ? 'success.main' : 'warning.main',
                  mb: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: appointment.status === 'confirmed' ? 'success.light' : 'warning.light' }}>
                    <Clock size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {appointment.customer || appointment.clientName || 'Unknown Customer'}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.service || appointment.type || 'Service'} - {appointment.vehicle || 'Vehicle not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatters.dateTime(appointment.time || appointment.date)}
                      </Typography>
                      {appointment.phoneNumber && (
                        <Typography variant="body2" color="text.secondary">
                          📞 {appointment.phoneNumber}
                        </Typography>
                      )}
                    </>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Chip
                    label={appointment.status || 'scheduled'}
                    size="small"
                    color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                  />
                  {appointment.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 100, textAlign: 'right' }}>
                      {appointment.description.length > 50 ? 
                        `${appointment.description.substring(0, 50)}...` : 
                        appointment.description
                      }
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  // Enhanced render method with loading and error states
  const renderDashboardContent = () => {
    console.log("Rendering dashboard content with:", {
      loading,
      financialSummary,
      error,
      repairStatusData: repairStatusData?.length,
      paymentStatusData: paymentStatusData?.length
    });
    
    if (loading && !financialSummary && !dataInitialized) {
      return (
        <Box sx={{ width: '100%', mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      );
    }
    
    // Only show critical errors (auth issues), not data loading issues
    if (error && (error.includes('login') || error.includes('auth') || error.includes('token'))) {
      return (
        <Alert 
          severity="error" 
          sx={{ mt: 4 }}
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
    
    // Always render the dashboard content, even with empty data
    return (
      <>
        {renderFinancialSummaryCards()}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderRepairStatusChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderPaymentStatusChart()}
          </Grid>
          <Grid item xs={12} md={8}>
            {renderMonthlyRevenueChart()}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderVehicleMakesChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderPopularServicesChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderDailyWorkloadChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderRecentTransactionsTable()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderUpcomingAppointments()}
          </Grid>
        </Grid>
        
        {/* Add a refresh indicator */}
        {loading && (
          <Box sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 2
          }}>
            <CircularProgress size={20} />
            <Typography variant="caption">Refreshing...</Typography>
          </Box>
        )}
      </>
    );
  };

  // Main render
  return (
    <>
      <Container
        maxWidth={false}
        sx={{
          minHeight: "100vh",
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f5f5f5",
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <Wrench size={24} />
            </Avatar>
            <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
              Auto Garage Dashboard
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="time-range-select-label">Time Range</InputLabel>
              <Select
                labelId="time-range-select-label"
                id="time-range-select"
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
                size="small"
              >
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<RefreshCw />}
              onClick={handleManualRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            
            <Tooltip title="Clear cached dashboard data. Use this if you've removed data from the database but still see old data in the dashboard.">
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Trash2 />}
                onClick={() => {
                  console.log('Clearing dashboard cache manually');
                  dashboardCache.clear();
                  setPopularServicesData([]);
                  setFinancialSummary(null);
                  setRecentTransactions([]);
                  setUpcomingAppointments([]);
                  setRepairStatusData([]);
                  setPaymentStatusData([]);
                  setVehicleMakesData([]);
                  setDailyWorkloadData([]);
                  setAppointmentAvailability(null);
                  toast.success('Dashboard cache cleared successfully');
                  
                  // Force a fresh data fetch after clearing cache
                  setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                  }, 100);
                }}
                disabled={loading}
              >
                Clear Cache
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Add tabs to switch between dashboard and calendar */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Dashboard Overview" />
            <Tab label="Appointment Calendar" />
          </Tabs>
        </Box>
        
        {/* Show different content based on active tab */}
        {activeTab === 0 && renderDashboardContent()}
        {activeTab === 1 && (
          <AppointmentCalendarErrorBoundary>
            <React.Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Loading appointment calendar...
                </Typography>
              </Box>
            }>
              <AppointmentCalendar 
                clients={repairStatusData} 
                invoices={paymentStatusData}
                isFullPage={true}
                onError={handleApiError}
                onAppointmentUpdate={handleAppointmentUpdate}
              />
            </React.Suspense>
          </AppointmentCalendarErrorBoundary>
        )}
      </Container>
    </>
  );
};

export default Dashboard;