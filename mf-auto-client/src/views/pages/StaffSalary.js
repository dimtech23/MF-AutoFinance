import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import { expensesAPI } from "../../api.js";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel
} from "@mui/material";
import {
  Add, 
  Edit, 
  Delete, 
  Search, 
  FilterList, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  Category,
  Business,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  Save,
  Cancel,
  CheckCircle,
  Warning,
  Error,
  Info
} from "@mui/icons-material";
import { RefreshCw, DollarSign } from "lucide-react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Default expense categories
const EXPENSE_CATEGORIES = [
  { value: 'auto_parts', label: 'Auto Parts', icon: '🔧' },
  { value: 'oil_and_lubricants', label: 'Oil & Lubricants', icon: '🛢️' },
  { value: 'tools_and_equipment', label: 'Tools & Equipment', icon: '🔨' },
  { value: 'office_supplies', label: 'Office Supplies', icon: '📄' },
  { value: 'utilities', label: 'Utilities', icon: '⚡' },
  { value: 'rent', label: 'Rent', icon: '🏢' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'staff_salary', label: 'Staff Salary', icon: '👥' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📦' }
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' }
];

const StaffSalary = () => {
  const { user, token } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editExpenseIndex, setEditExpenseIndex] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    date: new Date(),
    supplier: "",
    invoiceNumber: "",
    paymentMethod: "cash",
    notes: "",
    tags: []
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });

  // Staff salary states (existing functionality)
  const [staffList, setStaffList] = useState([
    { id: 1, name: "John Doe", baseSalary: 1000, overtimeHours: 5, overtimeRate: 20 },
    { id: 2, name: "Jane Smith", baseSalary: 1200, overtimeHours: 2, overtimeRate: 25 },
  ]);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editStaffIndex, setEditStaffIndex] = useState(null);
  const [staffForm, setStaffForm] = useState({ 
    name: "", 
    baseSalary: "", 
    overtimeHours: "", 
    overtimeRate: "" 
  });

  // Load expenses on component mount
  useEffect(() => {
    if (token) {
      fetchExpenses();
    }
  }, [token]);

  // Filter expenses when filters change
  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter, statusFilter, dateRange]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesAPI.getAll({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      if (response.data && response.data.expenses) {
        setExpenses(response.data.expenses);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        toast.error('Expenses API endpoint not found. Please check if the server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view expenses.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check your internet connection.');
      } else {
        toast.error('Failed to load expenses. Please try again.');
      }
      
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleExpenseDialogOpen = (expense = null) => {
    if (expense) {
      setExpenseForm({
        title: expense.title || "",
        description: expense.description || "",
        amount: expense.amount || "",
        category: expense.category || "",
        date: new Date(expense.date) || new Date(),
        supplier: expense.supplier || "",
        invoiceNumber: expense.invoiceNumber || "",
        paymentMethod: expense.paymentMethod || "cash",
        notes: expense.notes || "",
        tags: expense.tags || []
      });
      setEditExpenseIndex(expense._id || expense.id);
    } else {
      setExpenseForm({
        title: "",
        description: "",
        amount: "",
        category: "",
        date: new Date(),
        supplier: "",
        invoiceNumber: "",
        paymentMethod: "cash",
        notes: "",
        tags: []
      });
      setEditExpenseIndex(null);
    }
    setExpenseDialogOpen(true);
  };

  const handleExpenseDialogClose = () => {
    setExpenseDialogOpen(false);
    setEditExpenseIndex(null);
  };

  const handleExpenseFormChange = (field, value) => {
    setExpenseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpenseSave = async () => {
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editExpenseIndex) {
        // Update existing expense
        const response = await expensesAPI.update(editExpenseIndex, expenseForm);
        toast.success('Expense updated successfully');
        
        // Update with server response data
        const updatedExpense = response.data;
        setExpenses(prev => prev.map(exp => 
          exp._id === editExpenseIndex ? updatedExpense : exp
        ));
      } else {
        // Create new expense
        const response = await expensesAPI.create(expenseForm);
        toast.success('Expense added successfully');
        
        // Add the new expense from server response
        const newExpense = response.data;
        setExpenses(prev => [newExpense, ...prev]);
      }
      
      handleExpenseDialogClose();
      
      // Dispatch event to notify dashboard of expense update
      window.dispatchEvent(new CustomEvent('expense-updated'));
    } catch (error) {
      console.error('Error saving expense:', error);
      
      // Provide specific error messages
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid expense data');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to manage expenses.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check your internet connection.');
      } else {
        toast.error('Failed to save expense. Please try again.');
      }
    }
  };

  const handleExpenseDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesAPI.delete(expenseId);
        toast.success('Expense deleted successfully');
        
        // Remove from local state
        setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        
        // Dispatch event to notify dashboard of expense update
        window.dispatchEvent(new CustomEvent('expense-updated'));
      } catch (error) {
        console.error('Error deleting expense:', error);
        
        // Provide specific error messages
        if (error.response?.status === 404) {
          toast.error('Expense not found. It may have been already deleted.');
          // Remove from local state anyway
          setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        } else if (error.response?.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to delete expenses.');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to server. Please check your internet connection.');
        } else {
          toast.error('Failed to delete expense. Please try again.');
        }
      }
    }
  };

  const handleExpenseStatusUpdate = async (expenseId, newStatus) => {
    try {
      const response = await expensesAPI.updateStatus(expenseId, newStatus);
      toast.success(`Expense ${newStatus} successfully`);
      
      // Update with server response data
      const updatedExpense = response.data;
      setExpenses(prev => prev.map(exp => 
        exp._id === expenseId ? updatedExpense : exp
      ));
      
      // Dispatch event to notify dashboard of expense update
      window.dispatchEvent(new CustomEvent('expense-updated'));
    } catch (error) {
      console.error('Error updating expense status:', error);
      
      // Provide specific error messages
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid status value');
      } else if (error.response?.status === 404) {
        toast.error('Expense not found. It may have been deleted.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to update expense status.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check your internet connection.');
      } else {
        toast.error('Failed to update expense status. Please try again.');
      }
    }
  };

  // Staff salary functions (existing)
  const handleStaffDialogOpen = (staff = null) => {
    if (staff) {
      setStaffForm(staff);
      setEditStaffIndex(staff.id);
    } else {
      setStaffForm({ name: "", baseSalary: "", overtimeHours: "", overtimeRate: "" });
      setEditStaffIndex(null);
    }
    setStaffDialogOpen(true);
  };

  const handleStaffDialogClose = () => {
    setStaffDialogOpen(false);
    setEditStaffIndex(null);
  };

  const handleStaffFormChange = (field, value) => {
    setStaffForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStaffSave = () => {
    if (!staffForm.name || !staffForm.baseSalary) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newStaff = {
      ...staffForm,
      baseSalary: Number(staffForm.baseSalary),
      overtimeHours: Number(staffForm.overtimeHours) || 0,
      overtimeRate: Number(staffForm.overtimeRate) || 0,
      id: editStaffIndex || Date.now()
    };

    if (editStaffIndex) {
      setStaffList(prev => prev.map(staff => 
        staff.id === editStaffIndex ? newStaff : staff
      ));
    } else {
      setStaffList(prev => [...prev, newStaff]);
    }

    handleStaffDialogClose();
    toast.success('Staff salary saved successfully');
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalStaffSalary = staffList.reduce((sum, staff) => {
    const overtimePay = staff.overtimeHours * staff.overtimeRate;
    return sum + staff.baseSalary + overtimePay;
  }, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : '📦';
  };

  const getPaymentMethodIcon = (method) => {
    const pm = PAYMENT_METHODS.find(p => p.value === method);
    return pm ? pm.icon : '💵';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GMD",
      minimumFractionDigits: 2,
    }).format(amount).replace(/GMD/g, "D");
  };

  const renderExpensesTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Expenses Management</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleExpenseDialogOpen()}
          >
            Add Expense
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              selected={dateRange.startDate}
              onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
              customInput={<TextField size="small" fullWidth label="Start Date" />}
              dateFormat="MMM dd, yyyy"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              selected={dateRange.endDate}
              onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
              customInput={<TextField size="small" fullWidth label="End Date" />}
              dateFormat="MMM dd, yyyy"
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              onClick={fetchExpenses}
              disabled={loading}
              startIcon={<RefreshCw />}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense._id || expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {expense.title}
                      </Typography>
                      {expense.description && (
                        <Typography variant="caption" color="text.secondary">
                          {expense.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<span>{getCategoryIcon(expense.category)}</span>}
                        label={EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.supplier || 'N/A'}
                      </Typography>
                      {expense.invoiceNumber && (
                        <Typography variant="caption" color="text.secondary">
                          Invoice: {expense.invoiceNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {formatCurrency(expense.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<span>{getPaymentMethodIcon(expense.paymentMethod)}</span>}
                        label={PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.label || expense.paymentMethod}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.status}
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleExpenseDialogOpen(expense)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleExpenseDelete(expense._id || expense.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {expense.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleExpenseStatusUpdate(expense._id || expense.id, 'approved')}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleExpenseStatusUpdate(expense._id || expense.id, 'rejected')}
                              >
                                <Error fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredExpenses.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No expenses found. Add your first expense to get started.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderStaffSalaryTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Staff Salary & Overtime</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleStaffDialogOpen()}
          >
            Add Staff Salary
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Base Salary (D)</TableCell>
                <TableCell>Overtime Hours</TableCell>
                <TableCell>Overtime Rate (D/hr)</TableCell>
                <TableCell>Overtime Pay (D)</TableCell>
                <TableCell>Total Pay (D)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffList.map((staff, idx) => {
                const overtimePay = staff.overtimeHours * staff.overtimeRate;
                const totalPay = staff.baseSalary + overtimePay;
                return (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell>{formatCurrency(staff.baseSalary)}</TableCell>
                    <TableCell>{staff.overtimeHours}</TableCell>
                    <TableCell>{formatCurrency(staff.overtimeRate)}</TableCell>
                    <TableCell>{formatCurrency(overtimePay)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {formatCurrency(totalPay)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleStaffDialogOpen(staff)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Staff Salary & Expenses Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track staff salaries, overtime, and garage expenses including parts, supplies, and operational costs.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DollarSign color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(totalExpenses)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Staff Salaries
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(totalStaffSalary)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Category color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {expenses.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Staff Members
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {staffList.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Expenses Management" />
          <Tab label="Staff Salary & Overtime" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderExpensesTable()}
      {activeTab === 1 && renderStaffSalaryTable()}

      {/* Expense Dialog */}
      <Dialog open={expenseDialogOpen} onClose={handleExpenseDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editExpenseIndex ? "Edit Expense" : "Add New Expense"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expense Title *"
                value={expenseForm.title}
                onChange={(e) => handleExpenseFormChange('title', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={expenseForm.category}
                  onChange={(e) => handleExpenseFormChange('category', e.target.value)}
                  label="Category *"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount (D) *"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => handleExpenseFormChange('amount', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">D</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                selected={expenseForm.date}
                onChange={(date) => handleExpenseFormChange('date', date)}
                customInput={<TextField fullWidth label="Date" />}
                dateFormat="MMM dd, yyyy"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={expenseForm.supplier}
                onChange={(e) => handleExpenseFormChange('supplier', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={expenseForm.invoiceNumber}
                onChange={(e) => handleExpenseFormChange('invoiceNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => handleExpenseFormChange('paymentMethod', e.target.value)}
                  label="Payment Method"
                >
                  {PAYMENT_METHODS.map(pm => (
                    <MenuItem key={pm.value} value={pm.value}>
                      {pm.icon} {pm.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={expenseForm.description}
                onChange={(e) => handleExpenseFormChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={expenseForm.notes}
                onChange={(e) => handleExpenseFormChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExpenseDialogClose}>Cancel</Button>
          <Button onClick={handleExpenseSave} variant="contained">
            {editExpenseIndex ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff Salary Dialog */}
      <Dialog open={staffDialogOpen} onClose={handleStaffDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editStaffIndex ? "Edit Staff Salary" : "Add Staff Salary"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name *"
                value={staffForm.name}
                onChange={(e) => handleStaffFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Base Salary (D) *"
                type="number"
                value={staffForm.baseSalary}
                onChange={(e) => handleStaffFormChange('baseSalary', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">D</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Overtime Hours"
                type="number"
                value={staffForm.overtimeHours}
                onChange={(e) => handleStaffFormChange('overtimeHours', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Overtime Rate (D/hr)"
                type="number"
                value={staffForm.overtimeRate}
                onChange={(e) => handleStaffFormChange('overtimeRate', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">D</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStaffDialogClose}>Cancel</Button>
          <Button onClick={handleStaffSave} variant="contained">
            {editStaffIndex ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffSalary; 