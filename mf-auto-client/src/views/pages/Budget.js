import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext";
import { budgetAPI } from "../../api";
import Header from "components/Headers/Header.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
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
  Divider,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  BarChart,
  Bar,
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
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const Budget = () => {
  const { token, userRole } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [activeBudgetPeriod, setActiveBudgetPeriod] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Dialog and confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    total: "",
    categories: [
      { id: 1, name: "Mechanics & Staff Wages", allocated: "", spent: 0 },
      { id: 2, name: "Auto Parts & Supplies", allocated: "", spent: 0 },
      { id: 3, name: "Garage Rent & Utilities", allocated: "", spent: 0 },
      { id: 4, name: "Diagnostic Equipment", allocated: "", spent: 0 },
      { id: 5, name: "Shop Marketing", allocated: "", spent: 0 },
      { id: 6, name: "Garage Insurance", allocated: "", spent: 0 },
      { id: 7, name: "Tools & Maintenance", allocated: "", spent: 0 },
      { id: 8, name: "Other Expenses", allocated: "", spent: 0 },
    ],
    notes: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const response = await budgetAPI.getAll();
        setBudgets(response.data);
        setFilteredBudgets(response.data);

        // Set active budget to first active one
        const activeBudget = response.data.find((b) => b.status === "active");
        if (activeBudget) {
          setActiveBudgetPeriod(activeBudget.id.toString());
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
        toast.error("Failed to load budgets");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBudgets();
    }
  }, [token]);

  useEffect(() => {
    // Filter budgets when search term or budget filter changes
    const filtered = budgets.filter((budget) => {
      // Filter by search term
      const matchesSearch =
        budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.notes.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus =
        budgetFilter === "all" || budget.status === budgetFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredBudgets(filtered);
  }, [budgets, searchTerm, budgetFilter]);

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      // Edit mode
      setFormData({
        id: budget.id,
        name: budget.name,
        startDate: new Date(budget.startDate),
        endDate: new Date(budget.endDate),
        total: budget.total.toString(),
        categories: budget.categories.map((category) => ({
          ...category,
          allocated: category.allocated.toString(),
        })),
        notes: budget.notes,
      });
      setIsEditMode(true);
    } else {
      // Add mode
      setFormData({
        id: null,
        name: "",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        total: "",
        categories: [
          { id: 1, name: "Mechanics & Staff Wages", allocated: "", spent: 0 },
          { id: 2, name: "Auto Parts & Supplies", allocated: "", spent: 0 },
          { id: 3, name: "Garage Rent & Utilities", allocated: "", spent: 0 },
          { id: 4, name: "Diagnostic Equipment", allocated: "", spent: 0 },
          { id: 5, name: "Shop Marketing", allocated: "", spent: 0 },
          { id: 6, name: "Garage Insurance", allocated: "", spent: 0 },
          { id: 7, name: "Tools & Maintenance", allocated: "", spent: 0 },
          { id: 8, name: "Other Expenses", allocated: "", spent: 0 },
        ],
        notes: "",
      });
      setIsEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      categories: updatedCategories,
    }));
  };

  const calculateTotalAllocated = () => {
    return formData.categories.reduce((acc, category) => {
      return acc + (parseFloat(category.allocated) || 0);
    }, 0);
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name) {
      toast.error("Please enter a budget name");
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return false;
    }

    if (formData.startDate > formData.endDate) {
      toast.error("Start date cannot be after end date");
      return false;
    }

    const totalAllocated = calculateTotalAllocated();
    const totalBudget = parseFloat(formData.total) || 0;

    if (totalBudget <= 0) {
      toast.error("Total budget must be greater than zero");
      return false;
    }

    if (Math.abs(totalAllocated - totalBudget) > 0.01) {
      toast.error(
        `Total allocated (${totalAllocated}) must equal total budget (${totalBudget})`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Process form data
    const processedData = {
      ...formData,
      total: parseFloat(formData.total),
      categories: formData.categories.map((category) => ({
        ...category,
        allocated: parseFloat(category.allocated) || 0,
      })),
    };

    try {
      if (isEditMode) {
        // Update existing budget
        const response = await budgetAPI.update(
          processedData.id,
          processedData
        );
        const updatedBudgets = budgets.map((budget) =>
          budget.id === processedData.id ? response.data : budget
        );
        setBudgets(updatedBudgets);
        toast.success("Garage budget updated successfully");
      } else {
        // Add new budget
        const response = await budgetAPI.create(processedData);
        setBudgets([response.data, ...budgets]);
        toast.success("Garage budget created successfully");
      }

      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error(error.response?.data?.message || "Failed to save budget");
    }
  };

  const handleOpenDeleteDialog = (budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      await budgetAPI.delete(budgetToDelete.id);
      const updatedBudgets = budgets.filter(
        (budget) => budget.id !== budgetToDelete.id
      );
      setBudgets(updatedBudgets);
      toast.success("Budget deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
      setDeleteDialogOpen(false);
    }
  };

  const determineBudgetStatus = (startDate, endDate) => {
    const now = new Date();
    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "active";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "primary";
      case "upcoming":
        return "primary";
      case "completed":
        return "default";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get the active budget for the overview
  const activeBudget = budgets.find((b) => b.status === "active") || budgets[0];

  const renderCategoryAllocationChart = (budget) => {
    if (!budget) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={budget.categories}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="allocated"
            nameKey="name"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {budget.categories.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBudgetSpendingChart = (budget) => {
    if (!budget) return null;

    const data = budget.categories.map((category) => ({
      name: category.name,
      allocated: category.allocated,
      spent: category.spent,
      remaining: category.allocated - category.spent,
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <RechartsTooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="allocated" name="Allocated" fill="#8884d8" />
          <Bar dataKey="spent" name="Spent" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderBudgetProgressTable = (budget) => {
    if (!budget) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Allocated</TableCell>
              <TableCell align="right">Spent</TableCell>
              <TableCell align="right">Remaining</TableCell>
              <TableCell align="right">% Used</TableCell>
              <TableCell>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budget.categories.map((category) => {
              const percentUsed =
                category.allocated > 0
                  ? (category.spent / category.allocated) * 100
                  : 0;

              let progressColor = "primary";
              if (percentUsed > 90) progressColor = "error";
              else if (percentUsed > 75) progressColor = "warning";

              return (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(category.allocated)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(category.spent)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(category.allocated - category.spent)}
                  </TableCell>
                  <TableCell align="right">{percentUsed.toFixed(1)}%</TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(percentUsed, 100)}
                      color={progressColor}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
              <TableCell sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(
                  budget.categories.reduce(
                    (sum, category) => sum + category.allocated,
                    0
                  )
                )}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(
                  budget.categories.reduce(
                    (sum, category) => sum + category.spent,
                    0
                  )
                )}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(
                  budget.categories.reduce(
                    (sum, category) => sum + category.allocated,
                    0
                  ) -
                    budget.categories.reduce(
                      (sum, category) => sum + category.spent,
                      0
                    )
                )}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {(
                  (budget.categories.reduce(
                    (sum, category) => sum + category.spent,
                    0
                  ) /
                    budget.categories.reduce(
                      (sum, category) => sum + category.allocated,
                      0
                    )) *
                  100
                ).toFixed(1)}
                %
              </TableCell>
              <TableCell>
                <LinearProgress
                  variant="determinate"
                  value={
                    (budget.categories.reduce(
                      (sum, category) => sum + category.spent,
                      0
                    ) /
                      budget.categories.reduce(
                        (sum, category) => sum + category.allocated,
                        0
                      )) *
                    100
                  }
                  color="primary"
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const exportBudgetToCSV = (budget) => {
    if (!budget) return;

    const headers = ["Category", "Allocated", "Spent", "Remaining", "% Used"];
    const rows = budget.categories.map((category) => {
      const remaining = category.allocated - category.spent;
      const percentUsed =
        category.allocated > 0
          ? (category.spent / category.allocated) * 100
          : 0;

      return [
        category.name,
        category.allocated.toFixed(2),
        category.spent.toFixed(2),
        remaining.toFixed(2),
        percentUsed.toFixed(1) + "%",
      ];
    });

    // Add total row
    const totalAllocated = budget.categories.reduce(
      (sum, category) => sum + category.allocated,
      0
    );
    const totalSpent = budget.categories.reduce(
      (sum, category) => sum + category.spent,
      0
    );
    const totalRemaining = totalAllocated - totalSpent;
    const totalPercentUsed =
      totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    rows.push([
      "TOTAL",
      totalAllocated.toFixed(2),
      totalSpent.toFixed(2),
      totalRemaining.toFixed(2),
      totalPercentUsed.toFixed(1) + "%",
    ]);

    // Convert to CSV
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${budget.name.replace(/\s+/g, "_")}_Budget.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container
        maxWidth={false}
        sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" component="h1">
            Garage Budget Management
          </Typography>
          {(userRole === "Admin" || userRole === "Accountant") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={() => handleOpenDialog()}
            >
              Create Budget
            </Button>
          )}
        </Box>

        {/* Tabs for different views */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="budget tabs"
          >
            <Tab label="Overview" />
            <Tab label="Budget List" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <>
            {/* Budget Overview */}
            {activeBudget ? (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Total Budget
                            </Typography>
                            <Typography variant="h5">
                              {formatCurrency(activeBudget.total)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "primary.light",
                              p: 2,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <DollarSign size={24} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Spent To Date
                            </Typography>
                            <Typography variant="h5">
                              {formatCurrency(
                                activeBudget.categories.reduce(
                                  (sum, category) => sum + category.spent,
                                  0
                                )
                              )}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "error.light",
                              p: 2,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <TrendingDown size={24} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography color="textSecondary" gutterBottom>
                              Remaining Budget
                            </Typography>
                            <Typography variant="h5">
                              {formatCurrency(
                                activeBudget.total -
                                  activeBudget.categories.reduce(
                                    (sum, category) => sum + category.spent,
                                    0
                                  )
                              )}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "success.light",
                              p: 2,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Activity size={24} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={5}>
                    <Card sx={{ height: "100%" }}>
                      <CardHeader
                        title="Budget Allocation"
                        subheader={`${activeBudget.name} (${format(
                          new Date(activeBudget.startDate),
                          "MMM d, yyyy"
                        )} - ${format(
                          new Date(activeBudget.endDate),
                          "MMM d, yyyy"
                        )})`}
                        action={
                          <Button
                            size="small"
                            startIcon={<Download size={16} />}
                            onClick={() => exportBudgetToCSV(activeBudget)}
                          >
                            Export
                          </Button>
                        }
                      />
                      <CardContent>
                        {renderCategoryAllocationChart(activeBudget)}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Card sx={{ height: "100%" }}>
                      <CardHeader
                        title="Allocated vs. Actual Spending"
                        subheader={`${activeBudget.name}`}
                      />
                      <CardContent>
                        {renderBudgetSpendingChart(activeBudget)}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <CardHeader
                        title="Garage Budget Progress by Category"
                        subheader={`${activeBudget.name}`}
                      />
                      <CardContent>
                        {renderBudgetProgressTable(activeBudget)}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No active garage budget found. Please create a new budget or
                activate an existing one.
              </Alert>
            )}
          </>
        )}

        {tabValue === 1 && (
          <>
            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search budgets..."
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
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant={
                        budgetFilter === "all" ? "contained" : "outlined"
                      }
                      onClick={() => setBudgetFilter("all")}
                      size="small"
                    >
                      All
                    </Button>
                    <Button
                      variant={
                        budgetFilter === "active" ? "contained" : "outlined"
                      }
                      onClick={() => setBudgetFilter("active")}
                      size="small"
                      color="primary"
                    >
                      Active
                    </Button>
                    <Button
                      variant={
                        budgetFilter === "upcoming" ? "contained" : "outlined"
                      }
                      onClick={() => setBudgetFilter("upcoming")}
                      size="small"
                      color="primary"
                    >
                      Upcoming
                    </Button>
                    <Button
                      variant={
                        budgetFilter === "completed" ? "contained" : "outlined"
                      }
                      onClick={() => setBudgetFilter("completed")}
                      size="small"
                      color="primary"
                    >
                      Completed
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Budgets List */}
            {filteredBudgets.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Budget Name</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Spent</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBudgets.map((budget) => {
                      const totalSpent = budget.categories.reduce(
                        (sum, category) => sum + category.spent,
                        0
                      );
                      const remaining = budget.total - totalSpent;

                      return (
                        <TableRow key={budget.id}>
                          <TableCell>{budget.name}</TableCell>
                          <TableCell>
                            {format(new Date(budget.startDate), "MMM d, yyyy")}{" "}
                            - {format(new Date(budget.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(budget.total)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(totalSpent)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(remaining)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                budget.status.charAt(0).toUpperCase() +
                                budget.status.slice(1)
                              }
                              color={
                                budget.status === "active"
                                  ? "primary"
                                  : budget.status === "upcoming"
                                  ? "primary"
                                  : "default"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{ display: "flex", justifyContent: "center" }}
                            >
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDialog(budget)}
                                >
                                  <Edit2 size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(budget)}
                                >
                                  <Trash2 size={18} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No garage budgets found matching your filters.
              </Alert>
            )}
          </>
        )}

        {/* Budget Form Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditMode ? "Edit Garage Budget" : "Create New Garage Budget"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Budget Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => handleFormChange("startDate", date)}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Start Date"
                  customInput={
                    <TextField label="Start Date" fullWidth required />
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => handleFormChange("endDate", date)}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="End Date"
                  customInput={
                    <TextField label="End Date" fullWidth required />
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Total Budget Amount"
                  fullWidth
                  required
                  type="number"
                  value={formData.total}
                  onChange={(e) => handleFormChange("total", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Garage Budget Categories
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Allocated Amount</TableCell>
                        {isEditMode && (
                          <TableCell align="right">Spent</TableCell>
                        )}
                        {isEditMode && (
                          <TableCell align="right">Remaining</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.categories.map((category, index) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={category.allocated}
                              onChange={(e) =>
                                handleCategoryChange(
                                  index,
                                  "allocated",
                                  e.target.value
                                )
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ width: 150 }}
                            />
                          </TableCell>
                          {isEditMode && (
                            <TableCell align="right">
                              {formatCurrency(category.spent)}
                            </TableCell>
                          )}
                          {isEditMode && (
                            <TableCell align="right">
                              {formatCurrency(
                                (parseFloat(category.allocated) || 0) -
                                  category.spent
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow
                        sx={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}
                      >
                        <TableCell sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          {formatCurrency(calculateTotalAllocated())}
                        </TableCell>
                        {isEditMode && (
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            {formatCurrency(
                              formData.categories.reduce(
                                (sum, cat) => sum + cat.spent,
                                0
                              )
                            )}
                          </TableCell>
                        )}
                        {isEditMode && (
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            {formatCurrency(
                              calculateTotalAllocated() -
                                formData.categories.reduce(
                                  (sum, cat) => sum + cat.spent,
                                  0
                                )
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {parseFloat(formData.total) > 0 &&
                  Math.abs(
                    calculateTotalAllocated() - parseFloat(formData.total)
                  ) > 0.01 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <AlertTriangle size={16} style={{ marginRight: 8 }} />
                      Total allocated amount (
                      {formatCurrency(calculateTotalAllocated())}) does not
                      match total budget (
                      {formatCurrency(parseFloat(formData.total) || 0)}).
                      <br />
                      Difference:{" "}
                      {formatCurrency(
                        Math.abs(
                          calculateTotalAllocated() - parseFloat(formData.total)
                        )
                      )}
                    </Alert>
                  )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  placeholder="Add any additional notes about this garage budget period"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {isEditMode ? "Update Budget" : "Create Budget"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the garage budget "
              {budgetToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteBudget} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default Budget;
