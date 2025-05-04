import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import Header from "components/Headers/Header.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { 
  DollarSign, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Check,
  X,
  Search,
  Calendar,
  FileText,
  Clock,
  RefreshCw,
  Info,
  User,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  AlertCircle
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select as MUISelect,
  Divider,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Car garage specific categories
const expenseCategories = [
  { value: "parts", label: "Auto Parts" },
  { value: "shop_supplies", label: "Shop Supplies" },
  { value: "tools", label: "Tools & Equipment" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent/Mortgage" },
  { value: "insurance", label: "Garage Insurance" },
  { value: "salaries", label: "Mechanic Wages" },
  { value: "marketing", label: "Marketing" },
  { value: "training", label: "Training & Certifications" },
  { value: "towing", label: "Towing Services" },
  { value: "software", label: "Diagnostic Software" },
  { value: "other", label: "Other Expenses" },
];

const incomeCategories = [
  { value: "repairs", label: "Repair Services" },
  { value: "maintenance", label: "Maintenance Services" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "parts_sales", label: "Parts Sales" },
  { value: "inspection", label: "Vehicle Inspections" },
  { value: "bodywork", label: "Body Work" },
  { value: "tires", label: "Tire Services" },
  { value: "towing", label: "Towing Services" },
  { value: "detailing", label: "Auto Detailing" },
  { value: "other", label: "Other Income" },
];

// Transaction status options
const transactionStatusOptions = [
  { value: "pending", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const TransactionHistory = () => {
  const { token, userName, userRole } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // History summary state
  const [summaryStats, setSummaryStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  
  // Report date range
  const [reportPeriod, setReportPeriod] = useState('month');
  
  // Monthly data for charts
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await axios.get(`${baseURL}/transaction-history`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        
        // Generate sample data
        const mockTransactions = generateSampleData();
        setTransactions(mockTransactions);
        setFilteredTransactions(mockTransactions);
        calculateSummaryStats(mockTransactions);
        generateMonthlyData(mockTransactions);
        
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        toast.error("Failed to load transaction history");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTransactionHistory();
    }
  }, [token]);

  // Generate sample data
  const generateSampleData = () => {
    return Array(80).fill().map((_, index) => {
      const isIncome = Math.random() > 0.6; // More expenses than income
      const category = isIncome ? 
        incomeCategories[Math.floor(Math.random() * incomeCategories.length)].value : 
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)].value;
        
      // Generate statuses with appropriate distribution
      let status;
      const rand = Math.random();
      if (rand < 0.1) {
        status = "pending";
      } else if (rand < 0.9) {
        status = "approved";
      } else {
        status = "rejected";
      }
      
      let description = "";
      if (isIncome) {
        description = `${incomeCategories.find(c => c.value === category)?.label} transaction #${index + 1}`;
      } else {
        description = `${expenseCategories.find(c => c.value === category)?.label} expense #${index + 1}`;
      }
      
      // Generate date within the last 6 months
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime()));
      
      return {
        id: index + 1,
        date: randomDate,
        type: isIncome ? "income" : "expense",
        amount: parseFloat((Math.random() * (isIncome ? 1200 : 800) + 50).toFixed(2)),
        category: category,
        description: description,
        reference: `REF-${Math.floor(Math.random() * 10000)}`,
        notes: Math.random() > 0.7 ? "Additional notes for this transaction." : "",
        createdBy: Math.random() > 0.7 ? "Michael Accountant" : "John Manager",
        status: status,
        approvedBy: status === "approved" ? "John Manager" : null,
        approvedAt: status === "approved" ? new Date(randomDate.getTime() + Math.random() * 86400000 * 2) : null, // 1-2 days after creation
        rejectionReason: status === "rejected" ? "Invoice documentation incomplete" : null,
        attachments: Math.random() > 0.7 ? [`receipt-${index + 1}.pdf`] : [],
        clientName: Math.random() > 0.6 ? generateClientName() : null,
        vehicleInfo: Math.random() > 0.6 ? generateVehicleInfo() : null,
        createdAt: randomDate,
      };
    });
  };
  
  // Helper to generate random client names
  const generateClientName = () => {
    const firstNames = ["John", "Mary", "James", "Patricia", "Robert", "Linda", "Michael", "Elizabeth", "William", "Susan"];
    const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };
  
  // Helper to generate random vehicle info
  const generateVehicleInfo = () => {
    const makes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes"];
    const models = {
      "Toyota": ["Camry", "Corolla", "RAV4", "Highlander"],
      "Honda": ["Civic", "Accord", "CR-V", "Pilot"],
      "Ford": ["F-150", "Escape", "Explorer", "Mustang"],
      "Chevrolet": ["Silverado", "Malibu", "Equinox", "Tahoe"],
      "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"],
      "BMW": ["3 Series", "5 Series", "X3", "X5"],
      "Mercedes": ["C-Class", "E-Class", "GLC", "GLE"]
    };
    
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[make][Math.floor(Math.random() * models[make].length)];
    const year = 2015 + Math.floor(Math.random() * 10);
    
    return {
      make,
      model,
      year,
      licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
    };
  };
  
  // Calculate summary statistics
  const calculateSummaryStats = (data) => {
    const totalIncome = data
      .filter(t => t.type === "income" && t.status === "approved")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = data
      .filter(t => t.type === "expense" && t.status === "approved")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingCount = data.filter(t => t.status === "pending").length;
    const approvedCount = data.filter(t => t.status === "approved").length;
    const rejectedCount = data.filter(t => t.status === "rejected").length;
    
    setSummaryStats({
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      pendingCount,
      approvedCount,
      rejectedCount
    });
  };
  
  // Generate monthly data for charts
  const generateMonthlyData = (data) => {
    // Group by month
    const months = {};
    
    data.forEach(transaction => {
      if (transaction.status !== "approved") return;
      
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          income: 0,
          expenses: 0
        };
      }
      
      if (transaction.type === "income") {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expenses += transaction.amount;
      }
    });
    
    // Convert to array and sort by date
    const monthlyData = Object.values(months)
      .map(month => ({
        ...month,
        balance: month.income - month.expenses,
        label: `${month.month} ${month.year}`
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return new Date(0, a.month, 0) - new Date(0, b.month, 0);
      });
    
    setMonthlyData(monthlyData);
  };

  // Apply filters when search term, filter type, date range, category, or status changes
  useEffect(() => {
    let result = [...transactions];
    
    // Filter by type
    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter.value);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) || 
        (t.category && t.category.toLowerCase().includes(term)) || 
        (t.reference && t.reference.toLowerCase().includes(term)) ||
        (t.clientName && t.clientName.toLowerCase().includes(term)) ||
        (t.vehicleInfo && t.vehicleInfo.make && t.vehicleInfo.make.toLowerCase().includes(term)) ||
        (t.vehicleInfo && t.vehicleInfo.model && t.vehicleInfo.model.toLowerCase().includes(term))
      );
    }
    
    // Filter by date range
    if (startDate && endDate) {
      result = result.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
      });
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory.value);
    }
    
    // Update filtered transactions
    setFilteredTransactions(result);
  }, [transactions, searchTerm, filterType, startDate, endDate, selectedCategory, statusFilter]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Set filters based on tab
    if (newValue === 'all') {
      setFilterType('all');
      setStatusFilter(null);
    } else if (newValue === 'income') {
      setFilterType('income');
      setStatusFilter(null);
    } else if (newValue === 'expense') {
      setFilterType('expense');
      setStatusFilter(null);
    } else if (newValue === 'pending') {
      setFilterType('all');
      setStatusFilter({ value: 'pending', label: 'Pending Approval' });
    } else if (newValue === 'approved') {
      setFilterType('all');
      setStatusFilter({ value: 'approved', label: 'Approved' });
    } else if (newValue === 'rejected') {
      setFilterType('all');
      setStatusFilter({ value: 'rejected', label: 'Rejected' });
    }
    
    // Reset pagination
    setPage(0);
  };

  const openTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailOpen(true);
  };

  const closeTransactionDetails = () => {
    setDetailOpen(false);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Date", "Type", "Category", "Description", "Amount", "Status", "Reference", "Client", "Vehicle"];
    const csvData = filteredTransactions.map(t => [
      t.id,
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      t.category,
      t.description,
      t.amount.toFixed(2),
      t.status,
      t.reference || "",
      t.clientName || "",
      t.vehicleInfo ? `${t.vehicleInfo.year} ${t.vehicleInfo.make} ${t.vehicleInfo.model}` : ""
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transaction_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    toast.success("Transaction history exported successfully");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GMD",
      minimumFractionDigits: 2,
    }).format(amount).replace(/GMD/g, "D"); // Replace GMD with D for Dalasi symbol
  };

  const getTransactionTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getCategoryLabel = (type, categoryValue) => {
    if (type === 'income') {
      return incomeCategories.find(c => c.value === categoryValue)?.label || categoryValue;
    } else {
      return expenseCategories.find(c => c.value === categoryValue)?.label || categoryValue;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "success";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <Check size={16} />;
      case "pending": return <Clock size={16} />;
      case "rejected": return <X size={16} />;
      default: return null;
    }
  };
  
  // Generate report period options
  const reportPeriodOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  if (isLoading) {
    return (
      <>
        <Header />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <FileText size={24} />
            </Avatar>
            <Typography variant="h4" component="h1">
              Transaction History
            </Typography>
          </Box>
          
          <Box>
            <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
              <MUISelect
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                displayEmpty
              >
                {reportPeriodOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </MUISelect>
            </FormControl>
            
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Download />}
              onClick={exportToCSV}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'success.light' }}>
              <CardContent>
                <Typography color="success.dark" variant="subtitle2" gutterBottom>
                  Total Income
                </Typography>
                <Typography variant="h5" component="div" color="success.dark" gutterBottom>
                  {formatCurrency(summaryStats.totalIncome)}
                </Typography>
                <Typography variant="body2" color="success.dark">
                  {reportPeriodOptions.find(o => o.value === reportPeriod)?.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'error.light' }}>
              <CardContent>
                <Typography color="error.dark" variant="subtitle2" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h5" component="div" color="error.dark" gutterBottom>
                  {formatCurrency(summaryStats.totalExpenses)}
                </Typography>
                <Typography variant="body2" color="error.dark">
                  {reportPeriodOptions.find(o => o.value === reportPeriod)?.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: summaryStats.netBalance >= 0 ? 'info.light' : 'warning.light' }}>
              <CardContent>
                <Typography color={summaryStats.netBalance >= 0 ? 'info.dark' : 'warning.dark'} variant="subtitle2" gutterBottom>
                  Net Balance
                </Typography>
                <Typography variant="h5" component="div" color={summaryStats.netBalance >= 0 ? 'info.dark' : 'warning.dark'} gutterBottom>
                  {formatCurrency(summaryStats.netBalance)}
                </Typography>
                <Typography variant="body2" color={summaryStats.netBalance >= 0 ? 'info.dark' : 'warning.dark'}>
                  {summaryStats.netBalance >= 0 ? 'Positive Balance' : 'Negative Balance'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Transaction Status
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', mr: 1 }}>
                      {summaryStats.approvedCount}
                    </Box>
                    Approved
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" sx={{ color: 'warning.main', fontWeight: 'bold', mr: 1 }}>
                      {summaryStats.pendingCount}
                    </Box>
                    Pending
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', mr: 1 }}>
                      {summaryStats.rejectedCount}
                    </Box>
                    Rejected
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', mb: 1 }}>
                  <Box 
                    sx={{ 
                      bgcolor: 'success.main', 
                      width: `${summaryStats.approvedCount / (summaryStats.approvedCount + summaryStats.pendingCount + summaryStats.rejectedCount) * 100}%`
                    }} 
                  />
                  <Box 
                    sx={{ 
                      bgcolor: 'warning.main', 
                      width: `${summaryStats.pendingCount / (summaryStats.approvedCount + summaryStats.pendingCount + summaryStats.rejectedCount) * 100}%`
                    }} 
                  />
                  <Box 
                    sx={{ 
                      bgcolor: 'error.main', 
                      width: `${summaryStats.rejectedCount / (summaryStats.approvedCount + summaryStats.pendingCount + summaryStats.rejectedCount) * 100}%`
                    }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total: {summaryStats.approvedCount + summaryStats.pendingCount + summaryStats.rejectedCount} transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
                customInput={
                  <TextField 
                    fullWidth 
                    size="small"
                    variant="outlined"
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
            <Grid item xs={12} md={3}>
              <Select
                placeholder="Filter by category"
                isClearable
                value={selectedCategory}
                onChange={(option) => setSelectedCategory(option)}
                options={[
                  { label: 'Income Categories', options: incomeCategories },
                  { label: 'Expense Categories', options: expenseCategories }
                ]}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Filter />}
                  onClick={() => {
                    setSearchTerm('');
                    setDateRange([null, null]);
                    setSelectedCategory(null);
                    setFilterType('all');
                    setStatusFilter(null);
                    setActiveTab('all');
                  }}
                >
                  Reset
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Download />}
                  onClick={exportToCSV}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="transaction tabs"
            >
              <Tab label="All Transactions" value="all" />
              <Tab label="Income" value="income" />
              <Tab label="Expenses" value="expense" />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Pending
                    {summaryStats.pendingCount > 0 && (
                      <Badge badgeContent={summaryStats.pendingCount} color="warning" sx={{ ml: 1 }} />
                    )}
                  </Box>
                } 
                value="pending" 
              />
              <Tab label="Approved" value="approved" />
              <Tab label="Rejected" value="rejected" />
            </Tabs>
          </Box>
          
          <Box sx={{ pt: 2 }}>
            <TableContainer component={Paper}>
              <Table aria-label="transaction history table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Client / Vehicle</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box sx={{ py: 3 }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            No transactions found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Try adjusting your search or filter criteria
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.type === 'income' ? 'Income' : 'Expense'} 
                              color={getTransactionTypeColor(transaction.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{getCategoryLabel(transaction.type, transaction.category)}</TableCell>
                          <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={transaction.description}>
                              <Typography variant="body2">
                                {transaction.description}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {transaction.clientName ? (
                              <Box>
                                <Typography variant="body2">{transaction.clientName}</Typography>
                                {transaction.vehicleInfo && (
                                  <Typography variant="caption" color="text.secondary">
                                    {transaction.vehicleInfo.year} {transaction.vehicleInfo.make} {transaction.vehicleInfo.model}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: transaction.type === 'income' ? 'success.main' : 'error.main' }}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getStatusIcon(transaction.status)}
                              label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)} 
                              color={getStatusColor(transaction.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="text"
                              size="small"
                              color="primary"
                              onClick={() => openTransactionDetails(transaction)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Box>
        
        {/* Transaction Detail Dialog */}
        <Dialog 
          open={detailOpen} 
          onClose={closeTransactionDetails}
          maxWidth="md"
          fullWidth
        >
          {selectedTransaction && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Transaction Details
                  </Typography>
                  <Chip 
                    icon={getStatusIcon(selectedTransaction.status)}
                    label={selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)} 
                    color={getStatusColor(selectedTransaction.status)}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Transaction Type</Typography>
                            <Typography variant="body1" gutterBottom>
                              <Chip 
                                label={selectedTransaction.type === 'income' ? 'Income' : 'Expense'} 
                                color={getTransactionTypeColor(selectedTransaction.type)}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                            <Typography variant="body1" gutterBottom sx={{ 
                              fontWeight: 'bold',
                              color: selectedTransaction.type === 'income' ? 'success.main' : 'error.main' 
                            }}>
                              {formatCurrency(selectedTransaction.amount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Date</Typography>
                            <Typography variant="body1" gutterBottom>
                              {format(new Date(selectedTransaction.date), "MMMM d, yyyy")}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Category</Typography>
                            <Typography variant="body1" gutterBottom>
                              {getCategoryLabel(selectedTransaction.type, selectedTransaction.category)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Reference/Invoice Number</Typography>
                            <Typography variant="body1" gutterBottom>
                              {selectedTransaction.reference || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1" gutterBottom>
                              {selectedTransaction.createdBy}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" gutterBottom>
                              {selectedTransaction.description}
                            </Typography>
                          </Grid>
                          
                          {selectedTransaction.clientName && (
                            <>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Client</Typography>
                                <Typography variant="body1" gutterBottom>
                                  {selectedTransaction.clientName}
                                </Typography>
                              </Grid>
                              {selectedTransaction.vehicleInfo && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                                  <Typography variant="body1" gutterBottom>
                                    {selectedTransaction.vehicleInfo.year} {selectedTransaction.vehicleInfo.make} {selectedTransaction.vehicleInfo.model}
                                    {selectedTransaction.vehicleInfo.licensePlate && ` (${selectedTransaction.vehicleInfo.licensePlate})`}
                                  </Typography>
                                </Grid>
                              )}
                            </>
                          )}
                          
                          {selectedTransaction.notes && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Notes</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedTransaction.notes}
                              </Typography>
                            </Grid>
                          )}
                          
                          {selectedTransaction.attachments && selectedTransaction.attachments.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Attachments</Typography>
                              <List dense>
                                {selectedTransaction.attachments.map((file, index) => (
                                  <ListItem key={index}>
                                    <ListItemAvatar>
                                      <Avatar>
                                        <FileText size={16} />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={file}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    {/* Approval information */}
                    {selectedTransaction.status !== "pending" && (
                      <Card>
                        <CardHeader 
                          title={selectedTransaction.status === "approved" ? "Approval Information" : "Rejection Information"} 
                          sx={{ pb: 0 }}
                        />
                        <CardContent>
                          <Grid container spacing={2}>
                            {selectedTransaction.status === "approved" && (
                              <>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">Approved By</Typography>
                                  <Typography variant="body1" gutterBottom>
                                    {selectedTransaction.approvedBy}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="text.secondary">Approved On</Typography>
                                  <Typography variant="body1" gutterBottom>
                                    {selectedTransaction.approvedAt ? format(new Date(selectedTransaction.approvedAt), "MMMM d, yyyy") : "N/A"}
                                  </Typography>
                                </Grid>
                              </>
                            )}
                            {selectedTransaction.status === "rejected" && (
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Rejection Reason</Typography>
                                <Typography variant="body1" gutterBottom>
                                  {selectedTransaction.rejectionReason || "No reason provided"}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeTransactionDetails}>Close</Button>
                {/* PDF Export button could be added here */}
                <Button 
                  variant="outlined"
                  color="primary"
                  startIcon={<Download />}
                >
                  Download PDF
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </>
  );
};

export default TransactionHistory;