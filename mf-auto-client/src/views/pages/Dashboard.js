import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import AppointmentCalendar from "components/Calendar/AppointmentCalendar.js";
import QuickActionsWidget from '../../components/QuickActionsWidget.js';
import axios from "axios";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  DollarSign, 
  Percent, 
  Tool, 
  Users, 
  Truck, 
  Clock,
  AlertTriangle,
  Activity
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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";


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

const Dashboard = () => {
  const { userName, userRole, token } = useContext(UserContext);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Utility functions
  const formatChartDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GMD",
      minimumFractionDigits: 2,
    }).format(amount).replace(/GMD/g, "D"); 
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Fetch data functions
  const fetchClients = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/clients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setClients(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/invoices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setInvoices(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  };
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/stats?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setDashboardStats(statsResponse.data);
      
      // Fetch recent transactions
      const transactionsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/transactions/recent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setRecentTransactions(transactionsResponse.data);
      
      // Fetch upcoming appointments
      const appointmentsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/appointments/upcoming`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setUpcomingAppointments(appointmentsResponse.data);
      
      // Fetch inventory alerts
      const inventoryResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/inventory/alerts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      
      setInventoryAlerts(inventoryResponse.data);
      
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      
      // If backend is not ready, use fallback data for development
      if (process.env.NODE_ENV === 'development') {
        loadFallbackData();
      } else {
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    }
  };

  // Fallback data for development
  const loadFallbackData = () => {
    console.warn("Using fallback data for dashboard");
    
    // Sample dashboard stats
    setDashboardStats({
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
    });
    
    // Sample transactions
    setRecentTransactions([
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
    ]);
    
    // Sample appointments
    setUpcomingAppointments([
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
    ]);
    
    // Sample inventory alerts
    setInventoryAlerts([
      {
        id: 1,
        part: 'Oil Filter',
        currentStock: 2,
        minRequired: 5
      },
      {
        id: 2,
        part: 'Brake Pads',
        currentStock: 1,
        minRequired: 4
      }
    ]);
    
    setLoading(false);
  };

  // Initialize data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch clients
        await fetchClients();
        
        // Fetch invoices
        await fetchInvoices();
        
        // Fetch dashboard stats
        await fetchDashboardStats();
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [token, timeRange]);

  // Custom tooltip for charts
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ bgcolor: "background.paper", boxShadow: 2, p: 1.5, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography 
              key={`item-${index}`} 
              variant="h6" 
              sx={{ color: entry.color, my: 0.5 }}
            >
              {entry.name}: {entry.name.includes('$') ? entry.value : formatCurrency(entry.value)}
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Render functions
  const renderIncomeExpensesChart = () => {
    if (!dashboardStats?.monthlyFinancials) return null;

    // Filter data based on timeRange
    const data = dashboardStats.monthlyFinancials;
    
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
                Total Income: {formatCurrency(dashboardStats.financialSummary.totalIncome)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses: {formatCurrency(dashboardStats.financialSummary.totalExpenses)}
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatChartDate}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <Tooltip content={customTooltip} />
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

  const renderProfitChart = () => {
    if (!dashboardStats?.monthlyFinancials) return null;

    const data = dashboardStats.monthlyFinancials;
    
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
              Net Profit: {formatCurrency(dashboardStats.financialSummary.netProfit)}
            </Typography>
          }
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatChartDate}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <Tooltip content={customTooltip} />
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

  const renderCategoryPieChart = (data, title, dataKey = "value") => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item[dataKey], 0);

    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={title}
          subheader={`Total: ${formatCurrency(total)}`}
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
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
                {data.map((item, index) => (
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
                    <TableCell align="right">{formatCurrency(item[dataKey])}</TableCell>
                    <TableCell align="right">{((item[dataKey] / total) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVehiclesPieChart = (data, title, dataKey = "value") => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item[dataKey], 0);

    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={title}
          subheader={`Total Vehicles Serviced: ${total}`}
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
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
                {data.map((item, index) => (
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
                    <TableCell align="right">{item[dataKey]}</TableCell>
                    <TableCell align="right">{((item[dataKey] / total) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderRecentTransactionsTable = () => {
    if (!recentTransactions || !recentTransactions.length) return null;

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
              href="/transactions"
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
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
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
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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

  const renderUpcomingAppointments = () => {
    if (!upcomingAppointments || !upcomingAppointments.length) return null;

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
              href="/appointments"
            >
              View Calendar
            </Button>
          }
        />
        <CardContent>
          <List>
            {upcomingAppointments.map((appointment) => (
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
                      <Typography variant="subtitle2">{formatDateTime(appointment.time)}</Typography>
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

  // const renderInventoryAlerts = () => {
  //   if (!inventoryAlerts || !inventoryAlerts.length) return null;

  //   return (
  //     <Card sx={{ height: "100%" }}>
  //       <CardHeader
  //         title={
  //           <Box sx={{ display: 'flex', alignItems: 'center' }}>
  //             <AlertTriangle size={20} style={{ marginRight: '8px' }} />
  //             <Typography variant="h6">Inventory Alerts</Typography>
  //           </Box>
  //         }
  //         action={
  //           <Button
  //             color="primary"
  //             variant="outlined"
  //             size="small"
  //             href="/inventory"
  //           >
  //             View Inventory
  //           </Button>
  //         }
  //       />
  //       <CardContent>
  //         <List>
  //           {inventoryAlerts.map((alert) => (
  //             <ListItem
  //               key={alert.id}
  //               sx={{ 
  //                 borderLeft: 3, 
  //                 borderColor: 'error.main',
  //                 mb: 1,
  //                 bgcolor: 'background.paper',
  //                 boxShadow: 1,
  //                 borderRadius: 1,
  //               }}
  //             >
  //               <ListItemIcon>
  //                 <AlertTriangle size={20} color="#f5365c" />
  //               </ListItemIcon>
  //               <ListItemText
  //                 primary={alert.part}
  //                 secondary={
  //                   <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
  //                     <Typography variant="body2" component="span" sx={{ mr: 1 }}>
  //                       Current Stock: {alert.currentStock}
  //                     </Typography>
  //                     <Typography variant="body2" component="span" color="error">
  //                       (Min: {alert.minRequired})
  //                     </Typography>
  //                   </Box>
  //                 }
  //               />
  //               <Box sx={{ display: 'flex', alignItems: 'center' }}>
  //                 <Button variant="outlined" size="small" color="primary">
  //                   Order
  //                 </Button>
  //               </Box>
  //             </ListItem>
  //           ))}
  //         </List>
  //       </CardContent>
  //     </Card>
  //   );
  // };

  const renderServicePerformanceCard = () => {
    if (!dashboardStats?.appointmentAvailability) return null;
    
    const { total, booked, utilization } = dashboardStats.appointmentAvailability;
    
    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Activity size={20} style={{ marginRight: '8px' }} />
              <Typography variant="h6">Service Bay Utilization</Typography>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Utilization Rate</Typography>
              <Typography variant="body2" fontWeight="bold">{utilization}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={utilization} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: utilization > 80 ? 'success.main' : utilization > 50 ? 'warning.main' : 'error.main',
                  borderRadius: 5,
                }
              }} 
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText', p: 2 }}>
                <Typography variant="body2" align="center">Total Capacity</Typography>
                <Typography variant="h4" align="center" fontWeight="bold">{total}</Typography>
                <Typography variant="caption" align="center" display="block">Service Slots</Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', p: 2 }}>
                <Typography variant="body2" align="center">Booked Services</Typography>
                <Typography variant="h4" align="center" fontWeight="bold">{booked}</Typography>
                <Typography variant="caption" align="center" display="block">Appointments</Typography>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderStatCard = (title, value, icon, trend = null, color = "primary.main") => {
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
                {typeof value === 'number' ? formatCurrency(value) : value}
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

  const renderDashboardOverview = () => {
    if (!dashboardStats) return null;
    
    return (
      <>
        {/* Financial Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              "Total Garage Revenue",
              dashboardStats.financialSummary.totalIncome,
              DollarSign,
              { direction: 'up', value: 12 },
              '#2dce89'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              "Garage Expenses",
              dashboardStats.financialSummary.totalExpenses,
              CreditCard,
              { direction: 'down', value: 5 },
              '#f5365c'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              "Net Garage Profit",
              dashboardStats.financialSummary.netProfit,
              TrendingUp,
              { direction: 'up', value: 22 },
              '#11cdef'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              "Average Service Value",
              dashboardStats.financialSummary.averageServiceValue,
              Tool,
              { direction: 'up', value: 7 },
              '#fb6340'
            )}
          </Grid>
        </Grid>

        {/* Main Chart Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            {renderIncomeExpensesChart()}
          </Grid>
          <Grid item xs={12} lg={4}>
            {renderProfitChart()}
          </Grid>
        </Grid>

         {/* Quick Actions */}
      {/* <Grid item xs={12} lg={3}>
        <QuickActionsWidget />
      </Grid> */}

        {/* Services & Vehicles Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={12}>
            {renderVehiclesPieChart(
              dashboardStats.vehiclesByMake,
              "Vehicles Serviced by Make"
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderCategoryPieChart(
              dashboardStats.servicesByType, 
              "Service Revenue Breakdown"
            )}
          </Grid>
        </Grid>

        {/* Inventory & Appointments Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            {renderServicePerformanceCard()}
          </Grid>
          {/* <Grid item xs={12} md={8}>
            {renderInventoryAlerts()}
          </Grid> */}
        </Grid>

        {/* Recent Transactions & Upcoming Appointments */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            {renderRecentTransactionsTable()}
          </Grid>
          <Grid item xs={12} md={5}>
            {renderUpcomingAppointments()}
          </Grid>
        </Grid>
      </>
    );
  };

  // Render loading state
  if (loading && !dashboardStats) {
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
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f5f5f5",
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard data...
          </Typography>
        </Container>
      </>
    );
  }

  // Render error state
  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth={false}>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        </Container>
      </>
    );
  }

  if (!dashboardStats) return null;

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
        {activeTab === 0 && renderDashboardOverview()}
        {activeTab === 1 && <AppointmentCalendar clients={clients} invoices={invoices} />}
      </Container>
    </>
  );
};

export default Dashboard;