  import React, { useContext, useState, useEffect, useCallback } from "react";
  import { UserContext } from "../../Context/UserContext.js";
  import Header from "components/Headers/Header.js";
  import axios from "axios";
  import {
    CreditCard,
    TrendingUp,
    FileText,
    ArrowUp,
    ArrowDown,
    Calendar,
    DollarSign,
    Tool,
    Clock,
    Activity,
    RefreshCw
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
    List,
    ListItem,
    ListItemText,
    ListItemAvatar
  } from "@mui/material";
  import {
    BarChart,
    Bar,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
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

  const Dashboard = () => {
    const { token, isAuthenticated } = useContext(UserContext);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("month");
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [dataInitialized, setDataInitialized] = useState(false);
    const [componentsLoaded, setComponentsLoaded] = useState({
      stats: false,
      transactions: false,
      appointments: false
    });

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

    // API request with built-in error handling
    const apiRequest = async (endpoint, options = {}) => {
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
        return { 
          success: false, 
          error: error.response?.data?.message || "An error occurred" 
        };
      }
    };

    // Fetch clients data
    const fetchClients = useCallback(async () => {
      try {
        console.log("Fetching clients data...");
        
        if (!token) {
          console.log("Token not available yet, skipping clients fetch");
          return [];
        }
        
        const response = await apiRequest("clients");
        
        if (response.success) {
          console.log(`Fetched ${response.data.length} clients successfully`);
          setClients(response.data);
          dashboardCache.update('clients', response.data);
          return response.data;
        } else {
          console.error("Error fetching clients:", response.error);
          return [];
        }
      } catch (error) {
        console.error("Error in fetchClients:", error);
        return [];
      }
    }, [token]);

    // Fetch invoices data
    const fetchInvoices = useCallback(async () => {
      try {
        console.log("Fetching invoices data...");
        
        if (!token) {
          console.log("Token not available yet, skipping invoices fetch");
          return [];
        }
        
        const response = await apiRequest("invoices");
        
        if (response.success) {
          console.log(`Fetched ${response.data.length} invoices successfully`);
          setInvoices(response.data);
          dashboardCache.update('invoices', response.data);
          return response.data;
        } else {
          console.error("Error fetching invoices:", response.error);
          return [];
        }
      } catch (error) {
        console.error("Error in fetchInvoices:", error);
        return [];
      }
    }, [token]);

    // Parallel data fetching for dashboard
    const fetchDashboardData = useCallback(async () => {
      if (!token) return;
      
      setLoading(true);
      
      // Check if we have valid cached data
      if (dashboardCache.isValid()) {
        console.log("Using cached dashboard data");
        setDashboardStats(dashboardCache.data);
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
      
      // Fetch all data in parallel
      try {
        const statsRes = await apiRequest(`dashboard/stats?timeRange=${timeRange}`);
        const transactionsRes = await apiRequest('dashboard/transactions/recent');
        const appointmentsRes = await apiRequest('dashboard/appointments/upcoming');
        
        // Process stats results
        if (statsRes.success) {
          const data = statsRes.data;
          setDashboardStats(data);
          dashboardCache.update('data', data);
          setComponentsLoaded(prev => ({ ...prev, stats: true }));
        } else {
          console.warn("Using fallback data for dashboard stats");
          setDashboardStats(fallbackData);
          dashboardCache.update('data', fallbackData);
          setComponentsLoaded(prev => ({ ...prev, stats: true }));
        }
        
        // Process transactions results
        if (transactionsRes.success) {
          const data = transactionsRes.data;
          setRecentTransactions(data);
          dashboardCache.update('transactions', data);
          setComponentsLoaded(prev => ({ ...prev, transactions: true }));
        } else {
          // Use fallback transactions data
          const fallbackTransactions = [
            {
              id: 1,
              date: new Date().toISOString(),
              type: 'income',
              category: 'Service',
              description: 'Oil Change and Inspection',
              amount: 150,
              customerInfo: { name: 'John Doe' },
              vehicleInfo: { make: 'Toyota', model: 'Camry', year: '2018' }
            },
            {
              id: 2,
              date: new Date().toISOString(),
              type: 'expense',
              category: 'Parts',
              description: 'Purchased brake pads inventory',
              amount: 500,
              customerInfo: null,
              vehicleInfo: null
            }
          ];
          setRecentTransactions(fallbackTransactions);
          dashboardCache.update('transactions', fallbackTransactions);
          setComponentsLoaded(prev => ({ ...prev, transactions: true }));
        }
        
        // Process appointments results
        if (appointmentsRes.success) {
          const data = appointmentsRes.data;
          setUpcomingAppointments(data);
          dashboardCache.update('appointments', data);
          setComponentsLoaded(prev => ({ ...prev, appointments: true }));
        } else {
          // Use fallback appointments data
          const fallbackAppointments = [
            {
              id: 1,
              time: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString(),
              status: 'confirmed',
              customer: 'Jane Smith',
              service: 'Brake Service',
              vehicle: '2019 Honda Civic'
            },
            {
              id: 2,
              time: new Date(new Date().setHours(new Date().getHours() + 48)).toISOString(),
              status: 'pending',
              customer: 'Mike Johnson',
              service: 'Engine Diagnostic',
              vehicle: '2015 Ford F-150'
            }
          ];
          setUpcomingAppointments(fallbackAppointments);
          dashboardCache.update('appointments', fallbackAppointments);
          setComponentsLoaded(prev => ({ ...prev, appointments: true }));
        }
        
        // Also fetch clients and invoices if not already loaded
        if (!dashboardCache.clients) {
          await fetchClients();
        }
        
        if (!dashboardCache.invoices) {
          await fetchInvoices();
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
        
        // Use fallback data in case of error
        setDashboardStats(fallbackData);
      } finally {
        setLoading(false);
      }
    }, [token, timeRange, fetchClients, fetchInvoices]);
    
    // Fetch data when component mounts or token changes
    useEffect(() => {
      console.log("Dashboard component mounted or token changed");
      if (token && !dataInitialized) {
        console.log("Initializing dashboard data");
        setDataInitialized(true);
        fetchDashboardData();
      }
    }, [token, dataInitialized, fetchDashboardData]);
    
    // Re-fetch data when time range changes
    useEffect(() => {
      if (dataInitialized && token) {
        console.log(`Time range changed to ${timeRange}, fetching new data`);
        fetchDashboardData();
      }
    }, [timeRange, dataInitialized, token, fetchDashboardData]);
    
    // Handle tab change
    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };
    
    // Stat Card Component
    const StatCard = ({ title, value, icon, trend = null, color = "primary.main" }) => {
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
    
    // CHART COMPONENTS
    
    // Income vs Expenses Chart
    const renderIncomeExpensesChart = () => {
      if (!dashboardStats?.monthlyFinancials) return null;

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
                  Total Income: {formatters.currency(dashboardStats.financialSummary.totalIncome)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Expenses: {formatters.currency(dashboardStats.financialSummary.totalExpenses)}
                </Typography>
              </Box>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={dashboardStats.monthlyFinancials}
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
                <Tooltip
                  formatter={(value) => [formatters.currency(value), ""]}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar 
                  name="Income" 
                  dataKey="income" 
                  fill="#2dce89"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  name="Expenses" 
                  dataKey="expenses" 
                  fill="#f5365c"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    };

    // Monthly Profit Trend Chart
    const renderProfitChart = () => {
      if (!dashboardStats?.monthlyFinancials) return null;

      return (
        <Card sx={{ p: 2, height: "100%" }}>
          <CardHeader
            title={
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Profit Trend
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                Net Profit: {formatters.currency(dashboardStats.financialSummary.netProfit)}
              </Typography>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={dashboardStats.monthlyFinancials}
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
                <Tooltip
                  formatter={(value) => [formatters.currency(value), ""]}
                  labelFormatter={(label) => label}
                />
                <ReferenceLine y={0} stroke="#000" />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#11cdef"
                  fill="#11cdef"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    };

    // Service Revenue Breakdown Chart
    const renderServiceRevenueChart = () => {
      if (!dashboardStats?.servicesByType) return null;

      const total = dashboardStats.servicesByType.reduce((sum, item) => sum + item.value, 0);

      return (
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title="Service Revenue Breakdown"
            subheader={`Total: ${formatters.currency(total)}`}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardStats.servicesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardStats.servicesByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatters.currency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Add category breakdown below pie chart */}
            <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none' }}>
              <Table size="small" aria-label="category breakdown">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardStats.servicesByType.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: COLORS[index % COLORS.length],
                              mr: 1 
                            }} 
                          />
                          {item.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatters.currency(item.value)}</TableCell>
                      <TableCell align="right">{((item.value / total) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      );
    };

    // Vehicles Serviced by Make Chart
    const renderVehiclesChart = () => {
      if (!dashboardStats?.vehiclesByMake) return null;

      const total = dashboardStats.vehiclesByMake.reduce((sum, item) => sum + item.value, 0);

      return (
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title="Vehicles Serviced by Make"
            subheader={`Total Vehicles Serviced: ${total}`}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardStats.vehiclesByMake}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardStats.vehiclesByMake.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CAR_COLORS[entry.name] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Add vehicle breakdown below pie chart */}
            <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none' }}>
              <Table size="small" aria-label="vehicle breakdown">
                <TableHead>
                  <TableRow>
                    <TableCell>Make</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardStats.vehiclesByMake.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: CAR_COLORS[item.name] || COLORS[index % COLORS.length],
                              mr: 1 
                            }} 
                          />
                          {item.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{item.value}</TableCell>
                      <TableCell align="right">{((item.value / total) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      );
    };

    // Service Bay Utilization Card
    // const renderServicePerformanceCard = () => {
    //   if (!dashboardStats?.appointmentAvailability) return null;
      
    //   const { total, booked, utilization } = dashboardStats.appointmentAvailability;
      
    //   return (
    //     <Card sx={{ height: "100%" }}>
    //       <CardHeader
    //         title={
    //           <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //             <Activity size={20} style={{ marginRight: '8px' }} />
    //             <Typography variant="h6">Service Bay Utilization</Typography>
    //           </Box>
    //         }
    //       />
    //       <CardContent>
    //         <Box sx={{ mb: 3 }}>
    //           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
    //             <Typography variant="body2">Utilization Rate</Typography>
    //             <Typography variant="body2" fontWeight="bold">{utilization}%</Typography>
    //           </Box>
    //           <LinearProgress 
    //             variant="determinate" 
    //             value={utilization} 
    //             sx={{ 
    //               height: 10, 
    //               borderRadius: 5,
    //               bgcolor: 'grey.200',
    //               '& .MuiLinearProgress-bar': {
    //                 bgcolor: utilization > 80 ? 'success.main' : utilization > 50 ? 'warning.main' : 'error.main',
    //                 borderRadius: 5,
    //               }
    //             }} 
    //           />
    //         </Box>
            
    //         <Grid container spacing={2}>
    //           <Grid item xs={6}>
    //             <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText', p: 2 }}>
    //               <Typography variant="body2" align="center">Total Capacity</Typography>
    //               <Typography variant="h4" align="center" fontWeight="bold">{total}</Typography>
    //               <Typography variant="caption" align="center" display="block">Service Slots</Typography>
    //             </Card>
    //           </Grid>
    //           <Grid item xs={6}>
    //             <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', p: 2 }}>
    //               <Typography variant="body2" align="center">Booked Services</Typography>
    //               <Typography variant="h4" align="center" fontWeight="bold">{booked}</Typography>
    //               <Typography variant="caption" align="center" display="block">Appointments</Typography>
    //             </Card>
    //           </Grid>
    //         </Grid>
    //       </CardContent>
    //     </Card>
    //   );
    // };

    // Recent Transactions Table
    const renderRecentTransactionsTable = () => {
      if (!recentTransactions || recentTransactions.length === 0) return (
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
            <Alert severity="info">No recent transactions available</Alert>
          </CardContent>
        </Card>
      );

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
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Customer/Vehicle</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatters.date(transaction.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'income' ? 'Income' : 'Expense'}
                          color={transaction.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.customerInfo?.name && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {transaction.customerInfo.name}
                            </Typography>
                            {transaction.vehicleInfo && (
                              <Typography variant="caption" color="text.secondary">
                                {transaction.vehicleInfo.year} {transaction.vehicleInfo.make} {transaction.vehicleInfo.model}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: transaction.type === 'income' ? 'success.main' : 'error.main' }}>
                        {transaction.type === 'income' ? '+' : '-'}{formatters.currency(transaction.amount)}
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
      if (!upcomingAppointments || upcomingAppointments.length === 0) return (
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
            <Alert severity="info">No upcoming appointments</Alert>
          </CardContent>
        </Card>
      );

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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{formatters.dateTime(appointment.time)}</Typography>
                        <Chip 
                          size="small" 
                          label={appointment.status} 
                          color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {appointment.customer} - {appointment.service}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {appointment.vehicle}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    };

    // Render dashboard content
    const renderDashboardContent = () => {
      if (loading && !dashboardStats) {
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
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
            <Button color="inherit" size="small" onClick={fetchDashboardData} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        );
      }
      
      return (
        <>
          {/* Financial Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardStats ? (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Garage Revenue"
                    value={dashboardStats.financialSummary.totalIncome}
                    icon={DollarSign}
                    trend={{ direction: 'up', value: 12 }}
                    color='#2dce89'
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Garage Expenses"
                    value={dashboardStats.financialSummary.totalExpenses}
                    icon={CreditCard}
                    trend={{ direction: 'down', value: 5 }}
                    color='#f5365c'
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Net Garage Profit"
                    value={dashboardStats.financialSummary.netProfit}
                    icon={TrendingUp}
                    trend={{ direction: 'up', value: 22 }}
                    color='#11cdef'
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Average Service Value"
                    value={dashboardStats.financialSummary.averageServiceValue}
                    icon={Tool}
                    trend={{ direction: 'up', value: 7 }}
                    color='#fb6340'
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={3}><CircularProgress /></Grid>
                <Grid item xs={12} sm={6} md={3}><CircularProgress /></Grid>
                <Grid item xs={12} sm={6} md={3}><CircularProgress /></Grid>
                <Grid item xs={12} sm={6} md={3}><CircularProgress /></Grid>
              </>
            )}
          </Grid>
          
          {/* Main Chart Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              {componentsLoaded.stats ? renderIncomeExpensesChart() : <CircularProgress />}
            </Grid>
            <Grid item xs={12} lg={4}>
              {componentsLoaded.stats ? renderProfitChart() : <CircularProgress />}
            </Grid>
          </Grid>
          
          {/* Services & Vehicles Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              {componentsLoaded.stats ? renderVehiclesChart() : <CircularProgress />}
            </Grid>
            <Grid item xs={12} md={6}>
              {componentsLoaded.stats ? renderServiceRevenueChart() : <CircularProgress />}
            </Grid>
          </Grid>
          
          {/* Service Performance & Upcoming Appointments */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={12}>
              {upcomingAppointments && upcomingAppointments.length > 0 ? renderUpcomingAppointments() : (
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
                    <Alert severity="info">No upcoming appointments</Alert>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
          
          {/* Recent Transactions */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {recentTransactions && recentTransactions.length > 0 ? renderRecentTransactionsTable() : (
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
                    <Alert severity="info">No recent transactions available</Alert>
                  </CardContent>
                </Card>
              )}
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
                <Tool size={24} />
              </Avatar>
              <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                Auto Garage Dashboard
              </Typography>
            </Box>
            
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
                  onError={(error) => {
                    console.error("AppointmentCalendar error:", error);
                    setError(error.message || "Failed to load appointments");
                  }}
                  isFullPage={true}
                />
              </React.Suspense>
            </AppointmentCalendarErrorBoundary>
          )}
        </Container>
      </>
    );
  };

  export default Dashboard;