import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext.js";
import { clientAPI } from "../../api";
import Header from "components/Headers/Header.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { 
  Filter, 
  Download, 
  Check,
  X,
  Search,
  Calendar,
  FileText,
  Clock,
  User,
  Truck,
  DollarSign,
  Tag,
  AlertCircle
} from "lucide-react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select as MUISelect,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tabs,
  Tab
} from "@mui/material";

// Activity categories
const activityCategories = [
  { value: "status_change", label: "Status Change" },
  { value: "payment", label: "Payment" },
  { value: "delivery", label: "Vehicle Delivery" },
  { value: "document", label: "Document Update" },
  { value: "appointment", label: "Appointment" },
  { value: "note", label: "Note Added" },
  { value: "other", label: "Other Activity" }
];

// Status options
const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" }
];

const ClientActivityHistory = () => {
  const { token } = useContext(UserContext);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalClients: 0,
    activeClients: 0,
    pendingDeliveries: 0,
    pendingPayments: 0,
    recentActivities: 0
  });
  
  // Report period
  const [reportPeriod, setReportPeriod] = useState('month');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');

  // Fetch activities when component mounts or when filters change
  useEffect(() => {
    const fetchClientHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build query parameters
        const params = {};
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        if (activityType !== 'all') params.type = activityType;
        if (statusFilter) params.status = statusFilter.value;
        if (selectedCategory) params.category = selectedCategory.value;
        
        // Get client history using the API
        const response = await clientAPI.getHistory(params);
        if (response && response.data) {
          // Process the activities data
          const processedActivities = response.data.map(activity => ({
            ...activity,
            date: activity.date || activity.createdAt,
            type: activity.type || 'other',
            status: activity.status || 'pending',
            category: activity.category || 'other',
            description: activity.description || '',
            clientName: activity.clientName || '',
            vehicleInfo: activity.vehicleInfo || null,
            createdBy: activity.createdBy || 'System',
            amount: activity.amount || 0,
            documents: activity.documents || [],
            notes: activity.notes || ''
          }));

          setActivities(processedActivities);
          setFilteredActivities(processedActivities);
          
          // Update summary stats
          const summaryResponse = await clientAPI.getSummary();
          if (summaryResponse && summaryResponse.data) {
            setSummaryStats(summaryResponse.data);
          }
        } else {
          throw new Error("No data received from server");
        }
      } catch (error) {
        console.error("Error fetching client history:", error);
        setError(error.response?.data?.message || "Failed to load client history");
        toast.error(error.response?.data?.message || "Failed to load client history");
        setActivities([]);
        setFilteredActivities([]);
        setSummaryStats({
          totalClients: 0,
          activeClients: 0,
          pendingDeliveries: 0,
          pendingPayments: 0,
          recentActivities: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchClientHistory();
    }
  }, [token, reportPeriod, startDate, endDate, activityType, statusFilter, selectedCategory]);

  // Apply search filter when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredActivities(activities);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = activities.filter(a => 
      a.description.toLowerCase().includes(term) || 
      (a.category && a.category.toLowerCase().includes(term)) || 
      (a.clientName && a.clientName.toLowerCase().includes(term)) ||
      (a.vehicleInfo && a.vehicleInfo.make && a.vehicleInfo.make.toLowerCase().includes(term)) ||
      (a.vehicleInfo && a.vehicleInfo.model && a.vehicleInfo.model.toLowerCase().includes(term))
    );
    
    setFilteredActivities(filtered);
    setPage(0);
  }, [searchTerm, activities]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Set filters based on tab
    if (newValue === 'all') {
      setActivityType('all');
      setStatusFilter(null);
    } else if (newValue === 'status') {
      setActivityType('status_change');
      setStatusFilter(null);
    } else if (newValue === 'payments') {
      setActivityType('payment');
      setStatusFilter(null);
    } else if (newValue === 'deliveries') {
      setActivityType('delivery');
      setStatusFilter(null);
    } else if (newValue === 'documents') {
      setActivityType('document');
      setStatusFilter(null);
    } else if (newValue === 'appointments') {
      setActivityType('appointment');
      setStatusFilter(null);
    }
    
    setPage(0);
  };

  const openActivityDetails = (activity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  const closeActivityDetails = () => {
    setDetailOpen(false);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToCSV = async () => {
    try {
      const params = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        type: activityType !== 'all' ? activityType : null,
        status: statusFilter ? statusFilter.value : null,
        category: selectedCategory ? selectedCategory.value : null
      };

      const response = await clientAPI.exportHistory(params);
      
      // Create download link
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `client_activity_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Client activity history exported successfully");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export client activity history");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GMD",
      minimumFractionDigits: 2,
    }).format(amount).replace(/GMD/g, "D");
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'status_change': return <Tag size={16} />;
      case 'payment': return <DollarSign size={16} />;
      case 'delivery': return <Truck size={16} />;
      case 'document': return <FileText size={16} />;
      case 'appointment': return <Calendar size={16} />;
      case 'note': return <AlertCircle size={16} />;
      default: return <User size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "success";
      case "pending": return "warning";
      case "in_progress": return "info";
      case "delivered": return "success";
      case "completed": return "success";
      case "cancelled": return "error";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getActivityTypeLabel = (type) => {
    return activityCategories.find(c => c.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <Box 
          sx={{ 
            p: 3,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 }
          }}
        >
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Box 
          sx={{ 
            p: 3,
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            gap: 2
          }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setError(null);
                const event = new Event('retry-fetch');
                window.dispatchEvent(event);
              }}
            >
              Retry
            </Button>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Header />
      <Box 
        sx={{ 
          p: 3,
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, md: 3 }
        }}
      >
        {/* Header Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            flexShrink: 0,
            mb: { xs: 2, md: 3 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                mr: 2,
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 }
              }}
            >
              <User size={24} />
            </Avatar>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              Client Activity History
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 150 },
                mb: { xs: 1, sm: 0 }
              }}
            >
              <MUISelect
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                displayEmpty
                fullWidth
              >
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </MUISelect>
            </FormControl>
            
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Download />}
              onClick={exportToCSV}
              sx={{ 
                whiteSpace: 'nowrap',
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          {/* Summary Cards */}
          <Grid 
            container 
            spacing={{ xs: 1, md: 3 }} 
            sx={{ flexShrink: 0 }}
          >
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  },
                  borderRadius: 2,
                  boxShadow: 2
                }}
              >
                <CardContent>
                  <Typography 
                    color="text.primary" 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Total Clients
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    color="text.primary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {summaryStats.totalClients}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Active: {summaryStats.activeClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid',
                  borderColor: 'warning.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  },
                  borderRadius: 2,
                  boxShadow: 2
                }}
              >
                <CardContent>
                  <Typography 
                    color="text.primary" 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Pending Deliveries
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    color="text.primary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {summaryStats.pendingDeliveries}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Vehicles to be delivered
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid',
                  borderColor: 'info.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  },
                  borderRadius: 2,
                  boxShadow: 2
                }}
              >
                <CardContent>
                  <Typography 
                    color="text.primary" 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Pending Payments
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    color="text.primary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {summaryStats.pendingPayments}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Awaiting payment
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  bgcolor: 'background.paper',
                  borderLeft: '4px solid',
                  borderColor: 'success.main',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  },
                  borderRadius: 2,
                  boxShadow: 2
                }}
              >
                <CardContent>
                  <Typography 
                    color="text.primary" 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Recent Activities
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    color="text.primary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {summaryStats.recentActivities}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Section */}
          <Card 
            sx={{ 
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 2,
              boxShadow: 2,
              borderLeft: '4px solid',
              borderColor: 'info.main'
            }}
          >
            <Grid 
              container 
              spacing={{ xs: 1, sm: 2 }} 
              alignItems="center"
            >
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search activities..."
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
              <Grid item xs={12} sm={6} md={3}>
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
              <Grid item xs={12} sm={6} md={3}>
                <Select
                  placeholder="Filter by category"
                  isClearable
                  value={selectedCategory}
                  onChange={(option) => setSelectedCategory(option)}
                  options={activityCategories}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px'
                    })
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}
                >
                  <Button 
                    variant="outlined" 
                    startIcon={<Filter />}
                    onClick={() => {
                      setSearchTerm('');
                      setDateRange([null, null]);
                      setSelectedCategory(null);
                      setActivityType('all');
                      setStatusFilter(null);
                      setActiveTab('all');
                    }}
                    fullWidth
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Download />}
                    onClick={exportToCSV}
                    fullWidth
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Tabs Section */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box 
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px'
                }
              }}
            >
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                aria-label="activity tabs"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: { xs: 48, sm: 64 },
                  '& .MuiTab-root': {
                    minHeight: { xs: 48, sm: 64 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              >
                <Tab label="All Activities" value="all" />
                <Tab label="Status Changes" value="status" />
                <Tab label="Payments" value="payments" />
                <Tab label="Deliveries" value="deliveries" />
                <Tab label="Documents" value="documents" />
                <Tab label="Appointments" value="appointments" />
              </Tabs>
            </Box>
            
            {/* Table Section */}
            <Card 
              sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: 2,
                borderLeft: '4px solid',
                borderColor: 'success.main',
                overflow: 'hidden'
              }}
            >
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table 
                  aria-label="client activity history table"
                  sx={{
                    '& .MuiTableCell-root': {
                      whiteSpace: 'nowrap',
                      px: { xs: 1, sm: 2 },
                      py: { xs: 1, sm: 1.5 }
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Vehicle</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 3 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              No activities found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Try adjusting your search or filter criteria
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivities
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((activity) => (
                          <TableRow 
                            key={activity.id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <TableCell>
                              {format(new Date(activity.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getActivityIcon(activity.type)}
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    display: { xs: 'none', sm: 'block' }
                                  }}
                                >
                                  {getActivityTypeLabel(activity.type)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {activity.clientName}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              {activity.vehicleInfo ? (
                                <Typography variant="body2">
                                  {activity.vehicleInfo.year} {activity.vehicleInfo.make} {activity.vehicleInfo.model}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                maxWidth: { xs: 120, sm: 200 },
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <Tooltip title={activity.description}>
                                <Typography variant="body2">
                                  {activity.description}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)} 
                                color={getStatusColor(activity.status)}
                                size="small"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="text"
                                size="small"
                                color="primary"
                                onClick={() => openActivityDetails(activity)}
                                sx={{ 
                                  minWidth: { xs: 'auto', sm: '80px' },
                                  px: { xs: 1, sm: 2 }
                                }}
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
                count={filteredActivities.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  '.MuiTablePagination-select': {
                    minWidth: { xs: 'auto', sm: '80px' }
                  },
                  '.MuiTablePagination-displayedRows': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Card>
          </Box>
          
          {/* Activity Detail Dialog */}
          <Dialog 
            open={detailOpen} 
            onClose={closeActivityDetails}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: 3
              }
            }}
          >
            {selectedActivity && (
              <>
                <DialogTitle>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between', 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 1
                    }}
                  >
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      Activity Details
                    </Typography>
                    <Chip 
                      label={selectedActivity.status.charAt(0).toUpperCase() + selectedActivity.status.slice(1)} 
                      color={getStatusColor(selectedActivity.status)}
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Card 
                        sx={{ 
                          mb: 3,
                          boxShadow: 2,
                          borderRadius: 2
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                Activity Type
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {getActivityIcon(selectedActivity.type)}
                                <Typography 
                                  variant="body1"
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                  {getActivityTypeLabel(selectedActivity.type)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                Date
                              </Typography>
                              <Typography 
                                variant="body1" 
                                gutterBottom
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                {format(new Date(selectedActivity.date), "MMMM d, yyyy")}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                Client
                              </Typography>
                              <Typography 
                                variant="body1" 
                                gutterBottom
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                {selectedActivity.clientName}
                              </Typography>
                            </Grid>
                            {selectedActivity.vehicleInfo && (
                              <Grid item xs={12} sm={6}>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  Vehicle
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  gutterBottom
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                  {selectedActivity.vehicleInfo.year} {selectedActivity.vehicleInfo.make} {selectedActivity.vehicleInfo.model}
                                  {selectedActivity.vehicleInfo.licensePlate && ` (${selectedActivity.vehicleInfo.licensePlate})`}
                                </Typography>
                              </Grid>
                            )}
                            {selectedActivity.amount > 0 && (
                              <Grid item xs={12} sm={6}>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  Amount
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  gutterBottom 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                  }}
                                >
                                  {formatCurrency(selectedActivity.amount)}
                                </Typography>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                Description
                              </Typography>
                              <Typography 
                                variant="body1" 
                                gutterBottom
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                {selectedActivity.description}
                              </Typography>
                            </Grid>
                            
                            {selectedActivity.documents && selectedActivity.documents.length > 0 && (
                              <Grid item xs={12}>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  Documents
                                </Typography>
                                <List dense>
                                  {selectedActivity.documents.map((doc, index) => (
                                    <ListItem 
                                      key={index}
                                      sx={{ 
                                        px: { xs: 1, sm: 2 },
                                        py: { xs: 0.5, sm: 1 }
                                      }}
                                    >
                                      <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32 }}>
                                          <FileText size={16} />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={
                                          <Typography 
                                            variant="body2"
                                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                          >
                                            {doc.name}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography 
                                            variant="caption"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                          >
                                            {doc.type}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Grid>
                            )}
                            
                            {selectedActivity.notes && (
                              <Grid item xs={12}>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  Notes
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  gutterBottom
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                  {selectedActivity.notes}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions
                  sx={{ 
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 }
                  }}
                >
                  <Button 
                    onClick={closeActivityDetails}
                    sx={{ 
                      minWidth: { xs: 'auto', sm: '80px' }
                    }}
                  >
                    Close
                  </Button>
                  {selectedActivity.documents && selectedActivity.documents.length > 0 && (
                    <Button 
                      variant="outlined"
                      color="primary"
                      startIcon={<Download />}
                      sx={{ 
                        minWidth: { xs: 'auto', sm: '160px' }
                      }}
                    >
                      Download Documents
                    </Button>
                  )}
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </Box>
    </>
  );
};

export default ClientActivityHistory; 