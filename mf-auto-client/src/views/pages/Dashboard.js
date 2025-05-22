import React, { useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import axios from "axios";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  Truck,
  FileText,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  Phone,
  Mail,
  User,
  Tag,
  Info,
  Settings,
  LogOut,
  Menu,
  Bell,
  Star,
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  MoreHorizontal,
  Grid as GridIcon,
  List,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Zap,
  Battery,
  Wifi,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  Moon,
  ArrowUp,
  ArrowDown
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
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";

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

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const CAR_COLORS = {
  "Toyota": "#EB0A1E",
  "Honda": "#0F68A0",
  "Ford": "#003478",
  "Chevrolet": "#D1B962",
  "Nissan": "#C3002F",
  "BMW": "#0066B1",
  "Audi": "#000000",
  "Mercedes": "#333333"
};

// Create a data cache service
const dashboardCache = {
  data: null,
  timestamp: null,
  transactions: null,
  appointments: null,
  clients: null,
  invoices: null,
  
  // Cache for 5 minutes
  isValid() {
    return this.timestamp && (Date.now() - this.timestamp < 5 * 60 * 1000);
  },
  
  // Update cache
  update(key, data) {
    this[key] = data;
    this.timestamp = Date.now();
  },
  
  // Clear cache
  clear() {
    this.data = null;
    this.timestamp = null;
    this.transactions = null;
    this.appointments = null;
    this.clients = null;
    this.invoices = null;
  }
};

// Fallback data for development or when API fails
const fallbackData = {
  financialSummary: {
    totalIncome: 25000,
    totalExpenses: 15000,
    netProfit: 10000,
    averageServiceValue: 450
  },
  monthlyFinancials: [
    { month: "Jan", income: 5000, expenses: 3000, profit: 2000 },
    { month: "Feb", income: 6000, expenses: 4000, profit: 2000 },
    { month: "Mar", income: 7000, expenses: 4000, profit: 3000 },
    { month: "Apr", income: 7000, expenses: 4000, profit: 3000 }
  ],
  servicesByType: [
    { name: "Oil Change", value: 5000 },
    { name: "Brake", value: 7000 },
    { name: "Tire", value: 4000 },
    { name: "Engine", value: 9000 }
  ],
  vehiclesByMake: [
    { name: "Toyota", value: 25 },
    { name: "Honda", value: 15 },
    { name: "Ford", value: 10 },
    { name: "BMW", value: 5 }
  ],
  appointmentAvailability: {
    total: 50,
    booked: 35,
    utilization: 70
  }
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend = null, color = "primary.main", formatters, timeRange }) => {
  const IconComponent = icon;
  
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {typeof value === 'number' ? formatters.currency(value) : value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.direction === 'up' ? (
                  <ArrowUp size={16} color="green" />
                ) : (
                  <ArrowDown size={16} color="red" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5, color: trend.direction === 'up' ? 'success.main' : 'error.main' }}>
                  {trend.value}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  vs last {timeRange}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            borderRadius: '50%',
            bgcolor: `${color}20`
          }}>
            <IconComponent size={24} color={color} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { token, userRole } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [monthlyFinancials, setMonthlyFinancials] = useState([]);
  const [servicesByType, setServicesByType] = useState([]);
  const [vehiclesByMake, setVehiclesByMake] = useState([]);
  const [appointmentAvailability, setAppointmentAvailability] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [componentsLoaded, setComponentsLoaded] = useState({
    stats: false,
    transactions: false,
    appointments: false
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [activeBudgetPeriod, setActiveBudgetPeriod] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [expandedCategory, setExpandedCategory] = useState(null);

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
    const errorMessage = error.response?.data?.message || error.message || `An error occurred while ${context}`;
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  // API request with built-in error handling and retry logic
  const apiRequest = useCallback(async (endpoint, options = {}, retryCount = 0) => {
    try {
      const response = await axios({
        url: `${process.env.REACT_APP_API_URL}/api/${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        ...options
      });
      return { success: true, data: response.data };
    } catch (error) {
      if (retryCount < 3) {
        console.warn(`Retrying ${endpoint} request (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return apiRequest(endpoint, options, retryCount + 1);
      }
      return { 
        success: false, 
        error: error.response?.data?.message || "An error occurred" 
      };
    }
  }, [token]);

  // Parallel data fetching for dashboard with improved error handling
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    // Check if we have valid cached data
    if (dashboardCache.isValid()) {
      console.log("Using cached dashboard data");
      setFinancialSummary(dashboardCache.data);
      setRecentTransactions(dashboardCache.transactions || []);
      setUpcomingAppointments(dashboardCache.appointments || []);
      setClients(dashboardCache.clients || []);
      setInvoices(dashboardCache.invoices || []);
      setLoading(false);
      setComponentsLoaded({
        stats: true,
        transactions: true,
        appointments: true
      });
      return;
    }
    
    try {
      // Fetch all data in parallel with Promise.all
      const [
        statsRes,
        transactionsRes,
        appointmentsRes,
        clientsRes,
        invoicesRes
      ] = await Promise.all([
        apiRequest(`dashboard/stats?timeRange=${timeRange}`),
        apiRequest('dashboard/transactions'),
        apiRequest('dashboard/appointments'),
        apiRequest('clients'),
        apiRequest('invoices')
      ]);
      
      // Process stats results
      if (statsRes.success) {
        const data = statsRes.data;
        setFinancialSummary(data);
        dashboardCache.update('data', data);
        setComponentsLoaded(prev => ({ ...prev, stats: true }));
      } else {
        handleApiError(new Error(statsRes.error), "fetching dashboard stats");
      }
      
      // Process transactions results
      if (transactionsRes.success) {
        const data = transactionsRes.data;
        setRecentTransactions(data);
        dashboardCache.update('transactions', data);
        setComponentsLoaded(prev => ({ ...prev, transactions: true }));
      } else {
        handleApiError(new Error(transactionsRes.error), "fetching recent transactions");
      }
      
      // Process appointments results
      if (appointmentsRes.success) {
        const data = appointmentsRes.data;
        setUpcomingAppointments(data);
        dashboardCache.update('appointments', data);
        setComponentsLoaded(prev => ({ ...prev, appointments: true }));
      } else {
        handleApiError(new Error(appointmentsRes.error), "fetching upcoming appointments");
      }
      
      // Process clients results
      if (clientsRes.success) {
        const data = clientsRes.data;
        setClients(data);
        dashboardCache.update('clients', data);
      } else {
        handleApiError(new Error(clientsRes.error), "fetching clients");
      }
      
      // Process invoices results
      if (invoicesRes.success) {
        const data = invoicesRes.data;
        setInvoices(data);
        dashboardCache.update('invoices', data);
      } else {
        handleApiError(new Error(invoicesRes.error), "fetching invoices");
      }
    } catch (error) {
      handleApiError(error, "fetching dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token, timeRange, apiRequest, handleApiError]);

  // Effect to fetch data when component mounts or token changes
  useEffect(() => {
    if (token && !dataInitialized) {
      setDataInitialized(true);
      fetchDashboardData();
    }
  }, [token, dataInitialized, fetchDashboardData]);

  // Effect to re-fetch data when time range changes or refresh is triggered
  useEffect(() => {
    if (dataInitialized && token) {
      fetchDashboardData();
    }
  }, [timeRange, refreshTrigger, dataInitialized, token, fetchDashboardData]);

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

  // Income vs Expenses Chart
  const renderIncomeExpensesChart = () => {
    if (!financialSummary?.monthlyFinancials) return null;

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ mb: 1 }}>
              Garage Income vs Expenses
            </Typography>
          }
          subheader={
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">
                Total Income: {formatters.currency(financialSummary.financialSummary.totalIncome)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses: {formatters.currency(financialSummary.financialSummary.totalExpenses)}
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
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
                tickFormatter={(value) => `D${value}`}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
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
                        {payload.map((entry, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: entry.color, 
                              mr: 1, 
                              borderRadius: '50%' 
                            }} />
                            <Typography variant="body2">
                              {entry.name}: {formatters.currency(entry.value)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#2dce89" />
              <Bar dataKey="expenses" name="Expenses" fill="#f5365c" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Profit Chart
  const renderProfitChart = () => {
    if (!financialSummary?.monthlyFinancials) return null;

    return (
      <Card sx={{ p: 2, height: "100%" }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ mb: 1 }}>
              Net Profit Trend
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Net Profit: {formatters.currency(financialSummary.financialSummary.netProfit)}
            </Typography>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
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
                tickFormatter={(value) => `D${value}`}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const profit = payload[0].value;
                    const isPositive = profit >= 0;
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
                            bgcolor: payload[0].color, 
                            mr: 1, 
                            borderRadius: '50%' 
                          }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isPositive ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            Profit: {formatters.currency(profit)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {isPositive ? 'Net Gain' : 'Net Loss'}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#11cdef"
                fill="#11cdef"
                fillOpacity={0.1}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
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
            <Alert severity="info">No recent transactions</Alert>
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
              href="/admin/transactions"
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
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatters.date(transaction.date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        size="small"
                        color={transaction.type === 'income' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatters.currency(transaction.amount)}
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
            <Alert severity="info">No upcoming appointments</Alert>
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
                key={appointment.id}
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
                      {appointment.customer}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.service} - {appointment.vehicle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatters.dateTime(appointment.time)}
                      </Typography>
                    </>
                  }
                />
                <Chip
                  label={appointment.status}
                  size="small"
                  color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  // Financial Summary Cards
  const renderFinancialSummaryCards = () => {
    if (!financialSummary) return null;
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Garage Revenue"
            value={financialSummary.financialSummary.totalIncome}
            icon={DollarSign}
            trend={{ direction: 'up', value: 12 }}
            color='#2dce89'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Garage Expenses"
            value={financialSummary.financialSummary.totalExpenses}
            icon={TrendingDown}
            trend={{ direction: 'down', value: 8 }}
            color='#f5365c'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Net Profit"
            value={financialSummary.financialSummary.netProfit}
            icon={TrendingUp}
            trend={{ direction: 'up', value: 15 }}
            color='#11cdef'
            formatters={formatters}
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Service Value"
            value={financialSummary.financialSummary.averageServiceValue}
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

  // Enhanced render method with loading and error states
  const renderDashboardContent = () => {
    if (loading && !financialSummary) {
      return (
        <Box sx={{ width: '100%', mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      );
    }
    
    if (error) {
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
    
    return (
      <>
        {renderFinancialSummaryCards()}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {renderIncomeExpensesChart()}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderProfitChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderRecentTransactionsTable()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderUpcomingAppointments()}
          </Grid>
        </Grid>
      </>
    );
  };

  // Main render
  return (
    <>
      <Header />
      <Container
        maxWidth={false}
        sx={{
          minHeight: "calc(100vh - 64px)",
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
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              disabled={loading}
            >
              Refresh
            </Button>
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
                clients={clients} 
                invoices={invoices}
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