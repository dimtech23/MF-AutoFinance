import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Printer, 
  TrendingUp, 
  // ChevronDown,
  // ChevronUp,
  FileText,
  // DollarSign,
  Activity,
  PieChart as PieChartIcon,
  // Users,
  // Tool
} from "react-feather";

import {
  Container,
  Typography,
  Box,
  Grid,
  // CircularProgress,
  Alert,
  Card,
  CardHeader,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  // Chip,
  TextField,
  InputAdornment,
  // IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  // Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  MenuItem,
  // Accordion,
  // AccordionSummary,
  // AccordionDetails,
  Select as MUISelect,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar
} from "@mui/material";

import {
  BarChart,
  Bar,
  // LineChart,
  // Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

// Color scheme
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Mock categories
const expenseCategories = [
  { value: "fuel", label: "Fuel" },
  { value: "repairs", label: "Repairs & Maintenance" },
  { value: "parts", label: "Parts & Inventory" },
  { value: "tools", label: "Tools & Equipment" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent/Mortgage" },
  { value: "insurance", label: "Insurance" },
  { value: "salaries", label: "Salaries & Wages" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "other", label: "Other" },
];

const incomeCategories = [
  { value: "repairs", label: "Repair Services" },
  { value: "partsales", label: "Parts Sales" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "maintenance", label: "Maintenance Services" },
  { value: "other", label: "Other Income" },
];

// Helper function to generate sample monthly data
const generateMonthlyData = (months = 12) => {
  const data = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  for (let i = months - 1; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentYear - Math.floor((i - currentMonth) / 12);
    const monthDate = new Date(year, month, 1);
    
    // Generate random income and expenses with some seasonal patterns
    const baseIncome = 15000 + Math.floor(Math.random() * 5000);
    const baseExpenses = 10000 + Math.floor(Math.random() * 3000);
    
    // Add some seasonality - more business in summer months, less in winter
    const seasonalFactor = 1 + (Math.sin((month / 12) * Math.PI * 2) * 0.2);
    
    data.push({
      date: format(monthDate, "yyyy-MM"),
      month: format(monthDate, "MMM yyyy"),
      income: Math.floor(baseIncome * seasonalFactor),
      expenses: Math.floor(baseExpenses * seasonalFactor),
      profit: Math.floor((baseIncome - baseExpenses) * seasonalFactor)
    });
  }
  
  return data;
};

// Helper function to generate sample category breakdown
const generateCategoryData = (type = 'expense', monthlyTotal = 12000) => {
  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  
  // Assign random amounts to each category, ensuring they sum to totalAmount
  let remaining = monthlyTotal;
  const result = [];
  
  categories.forEach((category, index) => {
    if (index === categories.length - 1) {
      // Last category gets whatever is left
      result.push({
        name: category.label,
        value: remaining
      });
    } else {
      // Other categories get a random portion of what's left
      const portionPct = Math.random() * 0.5 + 0.05; // Between 5% and 55%
      const amount = Math.floor(remaining * portionPct);
      result.push({
        name: category.label,
        value: amount
      });
      remaining -= amount;
    }
  });
  
  return result;
};

// Generate balance sheet data
const generateBalanceSheetData = () => {
  return {
    assets: [
      { name: 'Cash & Equivalents', value: 42500 },
      { name: 'Accounts Receivable', value: 18750 },
      { name: 'Inventory', value: 35000 },
      { name: 'Property & Equipment', value: 125000 },
      { name: 'Other Assets', value: 8750 }
    ],
    liabilities: [
      { name: 'Accounts Payable', value: 12500 },
      { name: 'Short-term Loans', value: 25000 },
      { name: 'Long-term Debt', value: 75000 },
      { name: 'Other Liabilities', value: 7500 }
    ],
    equity: [
      { name: 'Owner Equity', value: 85000 },
      { name: 'Retained Earnings', value: 25000 }
    ]
  };
};

const Reports = () => {
  // const { token, userRole } = useContext(UserContext);
  const [ setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [reportType, setReportType] = useState('income-statement');
  const [dateRange, setDateRange] = useState([startOfMonth(subMonths(new Date(), 2)), endOfMonth(new Date())]);
  const [startDate, endDate] = dateRange;
  const [reportData, setReportData] = useState(null);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  // const [expandedIncomeSummary, setExpandedIncomeSummary] = useState(true);
  // const [expandedExpenseSummary, setExpandedExpenseSummary] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // Sample data for the reports
  const [ setMonthlyData] = useState([]);
  const [setExpensesData] = useState([]);
  const [ setIncomeData] = useState([]);
  const [ setBalanceSheetData] = useState({});
  
  useEffect(() => {
    // Load sample data
    const loadSampleData = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800)); // Reduced delay for presentations
        
        // Generate sample data - always generate full 12 months
        const monthly = generateMonthlyData(12);
        
        // Always include all data for presentation purposes
        // Don't filter by date range so we always have data to show
        const filteredMonthly = monthly;
        
        // Calculate monthly averages
        const avgIncome = filteredMonthly.reduce((sum, month) => sum + month.income, 0) / filteredMonthly.length;
        const avgExpenses = filteredMonthly.reduce((sum, month) => sum + month.expenses, 0) / filteredMonthly.length;
        
        const expenses = generateCategoryData('expense', avgExpenses);
        const income = generateCategoryData('income', avgIncome);
        const balanceSheet = generateBalanceSheetData();
        
        // Prepare report data with guaranteed values
        const report = {
          title: 'Financial Report',
          dateRange: {
            start: startDate || startOfMonth(subMonths(new Date(), 12)),
            end: endDate || endOfMonth(new Date())
          },
          summary: {
            totalIncome: filteredMonthly.reduce((sum, month) => sum + month.income, 0),
            totalExpenses: filteredMonthly.reduce((sum, month) => sum + month.expenses, 0),
            netProfit: filteredMonthly.reduce((sum, month) => sum + month.profit, 0),
            profitMargin: (filteredMonthly.reduce((sum, month) => sum + month.profit, 0) / 
                          filteredMonthly.reduce((sum, month) => sum + month.income, 0) * 100).toFixed(1)
          },
          monthly: filteredMonthly,
          expenseCategories: expenses,
          incomeCategories: income,
          balanceSheet: balanceSheet
        };
        
        setMonthlyData(filteredMonthly);
        setExpensesData(expenses);
        setIncomeData(income);
        setBalanceSheetData(balanceSheet);
        setReportData(report);
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSampleData();
  }, [startDate, endDate, reportType]);

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
    
    // Set appropriate tab based on report type
    switch(event.target.value) {
      case 'income-statement':
        setTabValue(0);
        break;
      case 'cash-flow':
        setTabValue(1);
        break;
      case 'balance-sheet':
        setTabValue(2);
        break;
      default:
        setTabValue(0);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Set appropriate report type based on tab
    switch(newValue) {
      case 0:
        setReportType('income-statement');
        break;
      case 1:
        setReportType('cash-flow');
        break;
      case 2:
        setReportType('balance-sheet');
        break;
      default:
        setReportType('income-statement');
    }
  };

  const handleDateRangeChange = (update) => {
    setDateRange(update);
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  const handleExportPDF = () => {
    // Simulated PDF export functionality
    console.log('Exporting PDF...');
    setTimeout(() => {
      alert('PDF Report exported successfully!');
      handleExportMenuClose();
    }, 1500);
  };

  const handleExportExcel = () => {
    // Simulated Excel export functionality
    console.log('Exporting Excel...');
    setTimeout(() => {
      alert('Excel Report exported successfully!');
      handleExportMenuClose();
    }, 1500);
  };

  const handlePrintReport = () => {
    setShowPrintDialog(true);
  };

  const closePrintDialog = () => {
    setShowPrintDialog(false);
  };

  const simulatePrint = () => {
    setShowPrintDialog(false);
    setTimeout(() => {
      alert('Report sent to printer!');
    }, 1000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GMD',
      minimumFractionDigits: 2
    }).format(amount).replace(/GMD/g, "D"); 
  };

  // Income Statement Report
  const renderIncomeStatement = () => {
    if (!reportData || !reportData.monthly || reportData.monthly.length === 0) return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data available for the selected date range. Please adjust your filters.
      </Alert>
    );

    // Calculate quarterly data
    // const quarterlyData = reportData.monthly.reduce((quarters, month) => {
    //   const date = new Date(month.date + '-01');
    //   const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      
    //   if (!quarters[quarter]) {
    //     quarters[quarter] = {
    //       quarter,
    //       income: 0,
    //       expenses: 0,
    //       profit: 0
    //     };
    //   }
      
    //   quarters[quarter].income += month.income;
    //   quarters[quarter].expenses += month.expenses;
    //   quarters[quarter].profit += month.profit;
      
    //   return quarters;
    // }, {});
    
    // const quarterlyDataArray = Object.values(quarterlyData);
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Income Statement Summary" 
              subheader={`${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'info.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'info.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Income</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.totalIncome)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'error.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'error.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Expenses</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.totalExpenses)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'success.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'success.contrastText'
                    }}
                  >
                    <Typography variant="h6">Net Profit</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.netProfit)}</Typography>
                    <Typography variant="subtitle1">({reportData.summary.profitMargin}% margin)</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Monthly Income vs Expenses" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={reportData.monthly}
                  margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `D${value / 1000}k`} />
                  <RechartsTooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar name="Income" dataKey="income" fill="#8884d8" />
                  <Bar name="Expenses" dataKey="expenses" fill="#82ca9d" />
                  <Bar name="Profit" dataKey="profit" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Income by Category" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.incomeCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.incomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.incomeCategories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: COLORS[index % COLORS.length],
                              mr: 1 
                            }} />
                            {category.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(category.value)}</TableCell>
                        <TableCell align="right">
                          {((category.value / reportData.summary.totalIncome) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(reportData.summary.totalIncome)}
                      </TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Expenses by Category" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.expenseCategories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: COLORS[index % COLORS.length],
                              mr: 1 
                            }} />
                            {category.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(category.value)}</TableCell>
                        <TableCell align="right">
                          {((category.value / reportData.summary.totalExpenses) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(reportData.summary.totalExpenses)}
                      </TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Cash Flow Report
  const renderCashFlowReport = () => {
    if (!reportData || !reportData.monthly || reportData.monthly.length === 0) return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data available for the selected date range. Please adjust your filters.
      </Alert>
    );
    
    // Transform monthly data for cash flow
    const cashFlowData = reportData.monthly.map(month => ({
      ...month,
      cashInflow: month.income,
      cashOutflow: month.expenses,
      netCashFlow: month.profit
    }));
    
    // Calculate cumulative cash flow
    let cumulative = 0;
    const cumulativeCashFlow = cashFlowData.map(month => {
      cumulative += month.netCashFlow;
      return {
        ...month,
        cumulativeCashFlow: cumulative
      };
    });
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Cash Flow Summary" 
              subheader={`${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'info.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'info.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Cash Inflow</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.totalIncome)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'error.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'error.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Cash Outflow</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.totalExpenses)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'success.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'success.contrastText'
                    }}
                  >
                    <Typography variant="h6">Net Cash Flow</Typography>
                    <Typography variant="h4">{formatCurrency(reportData.summary.netProfit)}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Monthly Cash Flow" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={cashFlowData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `D${value / 1000}k`} />
                  <RechartsTooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar name="Cash Inflow" dataKey="cashInflow" fill="#4CAF50" />
                  <Bar name="Cash Outflow" dataKey="cashOutflow" fill="#F44336" />
                  <Bar name="Net Cash Flow" dataKey="netCashFlow" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Cumulative Cash Flow" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={cumulativeCashFlow}
                  margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `D${value / 1000}k`} />
                  <RechartsTooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    name="Cumulative Cash Flow" 
                    dataKey="cumulativeCashFlow" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Cash Flow by Category" />
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Cash Inflows</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.incomeCategories.map((category) => (
                      <TableRow key={category.name}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="right">{formatCurrency(category.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Inflows</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(reportData.summary.totalIncome)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>Cash Outflows</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.expenseCategories.map((category) => (
                      <TableRow key={category.name}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="right">{formatCurrency(category.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Outflows</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(reportData.summary.totalExpenses)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Cash Flow Analysis" />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Cash Flow Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Net Cash Flow:</Typography>
                      <Typography variant="h6" sx={{ 
                        color: reportData.summary.netProfit >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {formatCurrency(reportData.summary.netProfit)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Cash Flow Ratio:</Typography>
                      <Typography variant="h6">
                        {(reportData.summary.totalIncome / reportData.summary.totalExpenses).toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Cash Flow Margin:</Typography>
                      <Typography variant="h6">
                        {(reportData.summary.netProfit / reportData.summary.totalIncome * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom>Cash Flow Trend Analysis</Typography>
                <Typography variant="body2" paragraph>
                  Cash flow has been {reportData.summary.netProfit >= 0 ? 'positive' : 'negative'} during the selected period. 
                  {reportData.summary.netProfit >= 0 
                    ? ' This indicates healthy business operations with sufficient cash generation to cover all expenses.'
                    : ' This indicates potential challenges in cash management that should be addressed promptly.'}
                </Typography>
                <Typography variant="body2">
                  The cash flow ratio of {(reportData.summary.totalIncome / reportData.summary.totalExpenses).toFixed(2)} 
                  {(reportData.summary.totalIncome / reportData.summary.totalExpenses) >= 1.2 
                    ? ' shows strong liquidity and operational efficiency.'
                    : (reportData.summary.totalIncome / reportData.summary.totalExpenses) >= 1.0
                      ? ' is adequate but leaves little room for unexpected expenses.'
                      : ' indicates potential cash flow problems that need immediate attention.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Balance Sheet Report
  const renderBalanceSheet = () => {
    if (!reportData || !reportData.balanceSheet) return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No balance sheet data available for the selected date range.
      </Alert>
    );
    
    const { assets, liabilities, equity } = reportData.balanceSheet;
    
    const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.value, 0);
    
    const liabilitiesAndEquity = [
      ...liabilities.map(item => ({ ...item, type: 'Liability' })),
      ...equity.map(item => ({ ...item, type: 'Equity' }))
    ];
    
    const balanceSheetPieData = [
      { name: 'Assets', value: totalAssets },
      { name: 'Liabilities', value: totalLiabilities },
      { name: 'Equity', value: totalEquity }
    ];
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Balance Sheet Summary" 
              subheader={`As of ${format(endDate, 'MMM d, yyyy')}`}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'primary.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Assets</Typography>
                    <Typography variant="h4">{formatCurrency(totalAssets)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'warning.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'warning.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Liabilities</Typography>
                    <Typography variant="h4">{formatCurrency(totalLiabilities)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      bgcolor: 'info.light', 
                      p: 3, 
                      borderRadius: 2, 
                      textAlign: 'center',
                      color: 'info.contrastText'
                    }}
                  >
                    <Typography variant="h6">Total Equity</Typography>
                    <Typography variant="h4">{formatCurrency(totalEquity)}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Balance Sheet Composition" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={balanceSheetPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#3f51b5" />
                    <Cell fill="#f44336" />
                    <Cell fill="#4caf50" />
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Key Financial Ratios" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Debt to Equity Ratio</TableCell>
                      <TableCell align="right">
                        {(totalLiabilities / totalEquity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Current Ratio</TableCell>
                      <TableCell align="right">
                        {(assets.filter(a => ['Cash & Equivalents', 'Accounts Receivable', 'Inventory'].includes(a.name))
                          .reduce((sum, item) => sum + item.value, 0) / 
                         liabilities.filter(l => ['Accounts Payable', 'Short-term Loans'].includes(l.name))
                          .reduce((sum, item) => sum + item.value, 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Working Capital</TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          assets.filter(a => ['Cash & Equivalents', 'Accounts Receivable', 'Inventory'].includes(a.name))
                            .reduce((sum, item) => sum + item.value, 0) - 
                          liabilities.filter(l => ['Accounts Payable', 'Short-term Loans'].includes(l.name))
                            .reduce((sum, item) => sum + item.value, 0)
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Asset to Equity Ratio</TableCell>
                      <TableCell align="right">
                        {(totalAssets / totalEquity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Debt Ratio</TableCell>
                      <TableCell align="right">
                        {(totalLiabilities / totalAssets).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Assets Breakdown" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.name}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell align="right">{formatCurrency(asset.value)}</TableCell>
                        <TableCell align="right">
                          {((asset.value / totalAssets) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Assets</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(totalAssets)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        100.0%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Liabilities & Equity Breakdown" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {liabilitiesAndEquity.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                        <TableCell align="right">
                          {((item.value / (totalLiabilities + totalEquity)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total Liabilities & Equity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(totalLiabilities + totalEquity)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        100.0%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Header />
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <FileText size={24} />
            </Avatar>
            <Typography variant="h4">
              Financial Reports
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<Printer />}
              onClick={handlePrintReport}
            >
              Print Report
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Download />}
              onClick={handleExportMenuOpen}
            >
              Export Report
            </Button>
          </Box>
        </Box>
        
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Date Range
              </Typography>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateRangeChange}
                customInput={
                  <TextField 
                    fullWidth 
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Calendar size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Report Type
              </Typography>
              <FormControl fullWidth size="small">
                <MUISelect
                  value={reportType}
                  onChange={handleReportTypeChange}
                >
                  <MenuItem value="income-statement">Income Statement</MenuItem>
                  <MenuItem value="cash-flow">Cash Flow Statement</MenuItem>
                  <MenuItem value="balance-sheet">Balance Sheet</MenuItem>
                </MUISelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, mt: 3.5 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Filter />}
                  onClick={() => {
                    setDateRange([startOfMonth(subMonths(new Date(), 2)), endOfMonth(new Date())]);
                    setReportType('income-statement');
                    setTabValue(0);
                  }}
                >
                  Reset Filters
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshCw />}
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1000);
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Report Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            aria-label="report types tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<TrendingUp />} 
              iconPosition="start" 
              label="Income Statement" 
            />
            <Tab 
              icon={<Activity />} 
              iconPosition="start" 
              label="Cash Flow" 
            />
            <Tab 
              icon={<PieChartIcon />}
              iconPosition="start"  
              label="Balance Sheet" 
            />
          </Tabs>
        </Paper>

        {/* Render the appropriate report based on tab/report type */}
        <Box sx={{ mb: 4 }}>
          {tabValue === 0 && renderIncomeStatement()}
          {tabValue === 1 && renderCashFlowReport()}
          {tabValue === 2 && renderBalanceSheet()}
        </Box>
      </Container>
      
      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchorEl}
        open={Boolean(exportMenuAnchorEl)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon>
            <FileText size={18} />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <FileText size={18} />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Print Dialog */}
      <Dialog
        open={showPrintDialog}
        onClose={closePrintDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Print Report</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select report options and send to printer.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Paper Size</InputLabel>
              <MUISelect
                label="Paper Size"
                defaultValue="letter"
              >
                <MenuItem value="letter">Letter</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
                <MenuItem value="a4">A4</MenuItem>
              </MUISelect>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Quality</InputLabel>
              <MUISelect
                label="Quality"
                defaultValue="high"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </MUISelect>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePrintDialog}>Cancel</Button>
          <Button variant="contained" onClick={simulatePrint}>Print</Button>
        </DialogActions>
      </Dialog>
      </>
  );
};

export default Reports;
