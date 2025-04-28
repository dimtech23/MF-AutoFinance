import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import AppointmentCalendar from "components/Calendar/AppointmentCalendar.js";
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
import axios from "axios";

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

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const Dashboard = () => {
  const { userName, userRole, token } = useContext(UserContext);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Sample data - Replace with API calls when backend is ready
  const sampleData = {
    financialSummary: {
      totalIncome: 24890,
      totalExpenses: 17356,
      netProfit: 7534,
      pendingInvoices: 8,
      pendingAmount: 3490,
      accountBalance: 32450,
      averageServiceValue: 285,
      serviceCount: 74,
      partsRevenue: 6240
    },
    monthlyFinancials: [
      { month: 'Jan', income: 4000, expenses: 2400, profit: 1600 },
      { month: 'Feb', income: 3000, expenses: 1398, profit: 1602 },
      { month: 'Mar', income: 5000, expenses: 3800, profit: 1200 },
      { month: 'Apr', income: 2780, expenses: 3908, profit: -1128 },
      { month: 'May', income: 1890, expenses: 4800, profit: -2910 },
      { month: 'Jun', income: 2390, expenses: 3800, profit: -1410 },
      { month: 'Jul', income: 3490, expenses: 4300, profit: -810 },
      { month: 'Aug', income: 4000, expenses: 2400, profit: 1600 },
      { month: 'Sep', income: 3000, expenses: 1398, profit: 1602 },
      { month: 'Oct', income: 2000, expenses: 2800, profit: -800 },
      { month: 'Nov', income: 2780, expenses: 3908, profit: -1128 },
      { month: 'Dec', income: 3890, expenses: 2800, profit: 1090 },
    ],
    expensesByCategory: [
      { name: 'Mechanic Wages', value: 8500 },
      { name: 'Auto Parts', value: 3200 },
      { name: 'Rent & Utilities', value: 2100 },
      { name: 'Tools & Equipment', value: 1800 },
      { name: 'Marketing', value: 950 },
      { name: 'Other', value: 806 },
    ],
    servicesByType: [
      { name: 'Repair Services', value: 12500 },
      { name: 'Maintenance', value: 8200 },
      { name: 'Diagnostics', value: 2100 },
      { name: 'Body Work', value: 1300 },
      { name: 'Tire Services', value: 790 }
    ],
    vehiclesByMake: [
      { name: 'Toyota', value: 28 },
      { name: 'Honda', value: 24 },
      { name: 'Ford', value: 18 },
      { name: 'Chevrolet', value: 12 },
      { name: 'Nissan', value: 10 },
      { name: 'BMW', value: 6 },
      { name: 'Audi', value: 4 },
      { name: 'Mercedes', value: 3 },
    ],
    servicesByCategory: [
      { name: 'Oil Change', value: 42 },
      { name: 'Brake Repair', value: 28 },
      { name: 'Engine Repair', value: 14 },
      { name: 'Transmission', value: 10 },
      { name: 'Electrical', value: 22 },
      { name: 'A/C Service', value: 15 },
      { name: 'Suspension', value: 8 },
    ],
    recentTransactions: [
      { id: 1, date: '2025-04-15', type: 'income', category: 'Repair Services', serviceType: 'engine_repair', description: 'Engine repair - Honda Civic', amount: 450.00, customerInfo: { name: 'John Smith' }, vehicleInfo: { make: 'Honda', model: 'Civic', year: 2018 } },
      { id: 2, date: '2025-04-14', type: 'expense', category: 'Auto Parts', description: 'Brake pads wholesale order', amount: 1250.00 },
      { id: 3, date: '2025-04-13', type: 'income', category: 'Diagnostics', serviceType: 'diagnostics', description: 'Electrical system diagnosis', amount: 120.00, customerInfo: { name: 'Sarah Brown' }, vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2020 } },
      { id: 4, date: '2025-04-12', type: 'expense', category: 'Mechanic Wages', description: 'Weekly mechanic wages', amount: 2100.00 },
      { id: 5, date: '2025-04-11', type: 'income', category: 'Parts Sales', description: 'Radiator replacement parts', amount: 350.00, customerInfo: { name: 'David Williams' } },
    ],
    weeklyTrend: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      income: [1200, 900, 1500, 1800, 2200, 1600, 800],
      expenses: [800, 600, 900, 1200, 1500, 700, 500]
    },
    appointmentAvailability: {
      total: 32,
      booked: 24,
      utilization: 75
    },
    inventoryAlerts: [
      { id: 1, part: "Oil Filters", status: "low", currentStock: 5, minRequired: 10 },
      { id: 2, part: "Brake Pads (Front)", status: "low", currentStock: 3, minRequired: 8 },
      { id: 3, part: "Wiper Blades", status: "low", currentStock: 4, minRequired: 12 }
    ],
    upcomingAppointments: [
      { id: 1, time: '2025-04-18 09:00', customer: 'Michael Davis', vehicle: '2019 Ford F-150', service: 'Oil Change', status: 'confirmed' },
      { id: 2, time: '2025-04-18 11:30', customer: 'Jennifer Miller', vehicle: '2022 Toyota RAV4', service: 'Brake Inspection', status: 'confirmed' },
      { id: 3, time: '2025-04-18 14:00', customer: 'Robert Wilson', vehicle: '2020 Honda Civic', service: 'A/C Service', status: 'pending' },
      { id: 4, time: '2025-04-19 10:15', customer: 'Jessica Moore', vehicle: '2017 BMW 3 Series', service: 'Engine Diagnostics', status: 'confirmed' }
    ]
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchClients();
    fetchInvoices();
  }, [token, timeRange]);


  const fetchInvoices = async () => {
    // Simulating API call with sample data
    setTimeout(() => {
      const sampleInvoices = Array(15).fill().map((_, index) => ({
        id: index + 1,
        invoiceNumber: `INV-${2025}-${1000 + index}`,
        // ...other invoice properties
      }));
      setInvoices(sampleInvoices);
    }, 600);
  };

  const fetchClients = async () => {
    // Simulating API call with sample data
    setTimeout(() => {
      const sampleClients = Array(20).fill().map((_, index) => {
        const makes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Audi", "Mercedes"];
        const models = {
          "Toyota": ["Camry", "Corolla", "RAV4", "Highlander"],
          "Honda": ["Accord", "Civic", "CR-V", "Pilot"],
          "Ford": ["F-150", "Escape", "Explorer", "Mustang"],
          "Chevrolet": ["Silverado", "Equinox", "Malibu", "Tahoe"],
          "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"],
          "BMW": ["3 Series", "5 Series", "X3", "X5"],
          "Audi": ["A4", "A6", "Q5", "Q7"],
          "Mercedes": ["C-Class", "E-Class", "GLC", "GLE"]
        };
        const make = makes[Math.floor(Math.random() * makes.length)];
        const model = models[make][Math.floor(Math.random() * models[make].length)];
        const year = 2010 + Math.floor(Math.random() * 14);
       
        const names = [
          "John Smith", "Mary Johnson", "David Williams", "Sarah Brown",
          "Michael Davis", "Jennifer Miller", "Robert Wilson", "Jessica Moore",
          "James Anderson", "Patricia Thomas", "Richard Jackson", "Linda White",
          "Thomas Harris", "Elizabeth Martin", "Charles Thompson", "Susan Garcia",
          "Mark Rodriguez", "Donna Lewis", "Joseph Lee", "Helen Walker"
        ];
       
        return {
          id: index + 1,
          clientName: names[index % names.length],
          phoneNumber: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: names[index % names.length].replace(' ', '.').toLowerCase() + '@example.com',
          carDetails: {
            make,
            model,
            year,
            licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
            color: ["Black", "White", "Silver", "Red", "Blue", "Gray"][Math.floor(Math.random() * 6)],
            vin: `${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          },
          issueDescription: [
            "Car making strange noise when braking",
            "Engine light is on",
            "Oil leaking under vehicle",
            "Car won't start",
            "Transmission slipping",
            "Steering wheel vibrates at high speeds",
            "Air conditioning not working",
            "Battery keeps dying"
          ][Math.floor(Math.random() * 8)],
          repairStatus: ["waiting", "in_progress", "completed", "delivered"][Math.floor(Math.random() * 4)]
        };
      });
     
      setClients(sampleClients);
    }, 500);
  };
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // In production, this would be an API call
      // For now, using sample data with a timeout to simulate API call
      setTimeout(() => {
        setDashboardStats(sampleData);
        setRecentTransactions(sampleData.recentTransactions);
        setUpcomingAppointments(sampleData.upcomingAppointments);
        setInventoryAlerts(sampleData.inventoryAlerts);
        setLoading(false);
      }, 800);
      
      // Uncomment when API is ready:
      /*
      const response = await axios.get(
        `${baseURL}/dashboard/stats?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      setDashboardStats(response.data);
      
      // Fetch recent transactions
      const transactionsResponse = await axios.get(
        `${baseURL}/transactions/recent`,
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
        `${baseURL}/appointments/upcoming`,
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
        `${baseURL}/inventory/alerts`,
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
      */
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard data. Please try again later.");
      setLoading(false);
    }
  };

  const formatChartDate = (dateStr) => {
    if (!dateStr) return "";
    
    // For the sample data, just return the month
    return dateStr;
    
    // When using real dates:
    /*
    try {
      const date = new Date(dateStr);

      switch (timeRange) {
        case "week":
          return date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          });
        case "month":
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        case "year":
          return date.toLocaleDateString("en-US", {
            month: "short",
          });
        default:
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
      }
    } catch (error) {
      return dateStr;
    }
    */
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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
  
  const renderDashboardOverview = () => {
    if (!dashboardStats) return null;
    
    return (
      <>
        {/* Financial Summary Cards */}
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

        {/* Services & Vehicles Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            {renderCategoryPieChart(
              dashboardStats.servicesByType, 
              "Service Revenue Breakdown"
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderVehiclesPieChart(
              dashboardStats.vehiclesByMake,
              "Vehicles Serviced by Make"
            )}
          </Grid>
        </Grid>

        {/* Inventory & Appointments Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            {renderServicePerformanceCard()}
          </Grid>
          <Grid item xs={12} md={8}>
            {renderInventoryAlerts()}
          </Grid>
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
    if (!data) return null;

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
    if (!data) return null;

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

  const renderInventoryAlerts = () => {
    if (!inventoryAlerts || !inventoryAlerts.length) return null;

    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={20} style={{ marginRight: '8px' }} />
              <Typography variant="h6">Inventory Alerts</Typography>
            </Box>
          }
          action={
            <Button
              color="primary"
              variant="outlined"
              size="small"
              href="/inventory"
            >
              View Inventory
            </Button>
          }
        />
        <CardContent>
          <List>
            {inventoryAlerts.map((alert) => (
              <ListItem
                key={alert.id}
                sx={{ 
                  borderLeft: 3, 
                  borderColor: 'error.main',
                  mb: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <AlertTriangle size={20} color="#f5365c" />
                </ListItemIcon>
                <ListItemText
                  primary={alert.part}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        Current Stock: {alert.currentStock}
                      </Typography>
                      <Typography variant="body2" component="span" color="error">
                        (Min: {alert.minRequired})
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button variant="outlined" size="small" color="primary">
                    Order
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

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