import React, { useState, useEffect, useCallback } from "react";
import { UserContext } from "../../Context/UserContext.js";
import { invoicesAPI, clientsAPI, appointmentAPI } from "../../api.js";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  FileText as PdfIcon,
  Table as ExcelIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  DollarSign as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ScheduleIcon,
  Car as CarIcon,
  BarChart3 as BarChartIcon,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency, formatPercentage } from '../../utility/formatters';
import { toast } from "react-toastify";
import { format, startOfDay, endOfDay, subDays, subMonths, subYears, startOfWeek } from "date-fns";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState([null, null]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [carFilter, setCarFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [viewMode, setViewMode] = useState('overview');
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    averageInvoiceAmount: 0,
    collectionRate: 0,
    totalCarsFixed: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    averageRepairTime: 0,
    monthlyTrend: [],
    topClients: [],
    topServices: [],
    paymentMethods: {},
    serviceCategories: {},
    carMakes: {},
    dailyStats: [],
    weeklyStats: [],
    monthlyStats: [],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState(null);

  // Extract unique car makes/models from invoices
  const carOptions = Array.from(new Set(invoices.map(inv => (inv.carMake && inv.carModel) ? `${inv.carMake} ${inv.carModel}` : null).filter(Boolean)));
  
  // Extract unique service categories
  const serviceOptions = Array.from(new Set(invoices.map(inv => inv.serviceCategory).filter(Boolean)));

  const filterDataByDateRange = useCallback((data, range, dateField) => {
    const now = new Date();
    let startDate, endDate;

    if (range === 'custom' && customDateRange[0] && customDateRange[1]) {
      startDate = startOfDay(customDateRange[0]);
      endDate = endOfDay(customDateRange[1]);
    } else {
      endDate = endOfDay(now);
      startDate = startOfDay(
        range === 'week' ? subDays(now, 7) :
        range === 'month' ? subMonths(now, 1) :
        range === 'quarter' ? subMonths(now, 3) :
        range === 'year' ? subYears(now, 1) :
        subMonths(now, 1)
      );
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [customDateRange]);

  const calculateSummary = useCallback((filteredInvoices, filteredAppointments, allClients) => {
    const summary = {
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalInvoices: filteredInvoices.length,
      paidInvoices: 0,
      overdueInvoices: 0,
      averageInvoiceAmount: 0,
      collectionRate: 0,
      totalCarsFixed: 0,
      totalAppointments: filteredAppointments.length,
      completedAppointments: 0,
      pendingAppointments: 0,
      averageRepairTime: 0,
      monthlyTrend: [],
      topClients: [],
      topServices: [],
      paymentMethods: {},
      serviceCategories: {},
      carMakes: {},
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
    };

    // Calculate invoice metrics
    filteredInvoices.forEach(invoice => {
      summary.totalRevenue += invoice.amount;
      if (invoice.status === 'paid') {
        summary.totalPaid += invoice.amount;
        summary.paidInvoices++;
      } else {
        summary.totalOutstanding += invoice.amount;
        if (new Date(invoice.dueDate) < new Date()) {
          summary.overdueInvoices++;
        }
      }

      // Track payment methods
      if (invoice.paymentMethod) {
        summary.paymentMethods[invoice.paymentMethod] = 
          (summary.paymentMethods[invoice.paymentMethod] || 0) + invoice.amount;
      }

      // Track service categories
      if (invoice.serviceCategory) {
        summary.serviceCategories[invoice.serviceCategory] = 
          (summary.serviceCategories[invoice.serviceCategory] || 0) + invoice.amount;
      }

      // Track car makes
      if (invoice.carMake) {
        summary.carMakes[invoice.carMake] = 
          (summary.carMakes[invoice.carMake] || 0) + 1;
      }
    });

    // Calculate appointment metrics
    filteredAppointments.forEach(appointment => {
      if (appointment.status === 'completed') {
        summary.completedAppointments++;
        summary.totalCarsFixed++;
      } else if (appointment.status === 'pending' || appointment.status === 'scheduled') {
        summary.pendingAppointments++;
      }
    });

    // Calculate derived metrics
    summary.averageInvoiceAmount = summary.totalRevenue / (summary.totalInvoices || 1);
    summary.collectionRate = (summary.totalPaid / summary.totalRevenue) * 100;

    // Calculate top services by revenue
    summary.topServices = Object.entries(summary.serviceCategories)
      .map(([service, revenue]) => ({ service, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate top clients
    const clientRevenue = {};
    filteredInvoices.forEach(invoice => {
      if (invoice.clientId) {
        clientRevenue[invoice.clientId] = (clientRevenue[invoice.clientId] || 0) + invoice.amount;
      }
    });
    summary.topClients = Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = allClients.find(c => c.id === clientId);
        return {
          id: clientId,
          name: client ? client.clientName : 'Unknown Client',
          revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate daily, weekly, monthly stats
    summary.dailyStats = calculateDailyStats(filteredInvoices, filteredAppointments);
    summary.weeklyStats = calculateWeeklyStats(filteredInvoices, filteredAppointments);
    summary.monthlyStats = calculateMonthlyStats(filteredInvoices, filteredAppointments);

    setSummary(summary);
  }, []);

  const calculateDailyStats = (invoices, appointments) => {
    const dailyData = {};
    
    // Group by day
    [...invoices, ...appointments].forEach(item => {
      const date = format(new Date(item.createdAt || item.date), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, invoices: 0, appointments: 0, carsFixed: 0 };
      }
      
      if (item.amount) {
        dailyData[date].revenue += item.amount;
        dailyData[date].invoices++;
      } else {
        dailyData[date].appointments++;
        if (item.status === 'completed') {
          dailyData[date].carsFixed++;
        }
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days
  };

  const calculateWeeklyStats = (invoices, appointments) => {
    const weeklyData = {};
    
    [...invoices, ...appointments].forEach(item => {
      const date = new Date(item.createdAt || item.date);
      const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
      
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { revenue: 0, invoices: 0, appointments: 0, carsFixed: 0 };
      }
      
      if (item.amount) {
        weeklyData[weekStart].revenue += item.amount;
        weeklyData[weekStart].invoices++;
      } else {
        weeklyData[weekStart].appointments++;
        if (item.status === 'completed') {
          weeklyData[weekStart].carsFixed++;
        }
      }
    });

    return Object.entries(weeklyData)
      .map(([weekStart, data]) => ({
        weekStart,
        ...data
      }))
      .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
      .slice(-4); // Last 4 weeks
  };

  const calculateMonthlyStats = (invoices, appointments) => {
    const monthlyData = {};
    
    [...invoices, ...appointments].forEach(item => {
      const month = format(new Date(item.createdAt || item.date), 'MMM yyyy');
      
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, invoices: 0, appointments: 0, carsFixed: 0 };
      }
      
      if (item.amount) {
        monthlyData[month].revenue += item.amount;
        monthlyData[month].invoices++;
      } else {
        monthlyData[month].appointments++;
        if (item.status === 'completed') {
          monthlyData[month].carsFixed++;
        }
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6); // Last 6 months
  };

  const handleExport = async (type, reportType) => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('Preparing export...');
      setExportError(null);

      const exportData = {
        dateRange: dateRange,
        customDateRange: dateRange === 'custom' ? customDateRange : null,
        reportType: reportType,
        filters: {
          status: filterStatus,
          search: searchTerm,
          car: carFilter,
          service: serviceFilter
        }
      };

      if (type === 'pdf') {
        setExportStatus('Generating PDF...');
        await invoicesAPI.exportToPdf(exportData, (progress) => {
          setExportProgress(progress);
          if (progress < 30) {
            setExportStatus('Preparing data...');
          } else if (progress < 60) {
            setExportStatus('Generating PDF...');
          } else if (progress < 90) {
            setExportStatus('Finalizing document...');
          } else {
            setExportStatus('Downloading...');
          }
        });
      } else {
        setExportStatus('Generating Excel file...');
        await invoicesAPI.exportExcel(exportData);
      }

      setExportStatus('Export completed successfully');
      toast.success(`${type.toUpperCase()} export completed successfully`);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error.message || 'Failed to export report');
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus(null);
    }
  };

  const SummaryCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: `${color}.main` }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon && React.createElement(icon, { sx: { mr: 1, color: `${color}.main` } })}
          <Typography color="textSecondary" variant="h6">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography color="textSecondary" variant="body2">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          subtitle={`${summary.totalInvoices} invoices`}
          icon={MoneyIcon}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Cars Fixed"
          value={summary.totalCarsFixed}
          subtitle={`${summary.completedAppointments} completed`}
          icon={CarIcon}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Collection Rate"
          value={formatPercentage(summary.collectionRate)}
          subtitle={`${summary.paidInvoices} paid invoices`}
          icon={CheckCircleIcon}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Pending Work"
          value={summary.pendingAppointments}
          subtitle={`${summary.totalAppointments} total appointments`}
          icon={ScheduleIcon}
          color="warning"
        />
      </Grid>

      {/* Top Services */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Services by Revenue
            </Typography>
            <List>
              {summary.topServices.map((service, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={service.service}
                    secondary={formatCurrency(service.revenue)}
                  />
                  <Chip 
                    label={`${((service.revenue / summary.totalRevenue) * 100).toFixed(1)}%`}
                    color="primary"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Clients */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Clients by Revenue
            </Typography>
            <List>
              {summary.topClients.map((client, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={client.name}
                    secondary={formatCurrency(client.revenue)}
                  />
                  <Chip 
                    label={`${((client.revenue / summary.totalRevenue) * 100).toFixed(1)}%`}
                    color="secondary"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Daily Stats */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Daily Performance (Last 7 Days)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Appointments</TableCell>
                    <TableCell align="right">Cars Fixed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.dailyStats.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{format(new Date(day.date), 'MMM dd')}</TableCell>
                      <TableCell align="right">{formatCurrency(day.revenue)}</TableCell>
                      <TableCell align="right">{day.invoices}</TableCell>
                      <TableCell align="right">{day.appointments}</TableCell>
                      <TableCell align="right">{day.carsFixed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDetailedStats = () => (
    <Grid container spacing={3}>
      {/* Weekly Stats */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Weekly Performance (Last 4 Weeks)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Week</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Cars Fixed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.weeklyStats.map((week) => (
                    <TableRow key={week.weekStart}>
                      <TableCell>{format(new Date(week.weekStart), 'MMM dd')}</TableCell>
                      <TableCell align="right">{formatCurrency(week.revenue)}</TableCell>
                      <TableCell align="right">{week.carsFixed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Stats */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Performance (Last 6 Months)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Cars Fixed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.monthlyStats.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell align="right">{formatCurrency(month.revenue)}</TableCell>
                      <TableCell align="right">{month.carsFixed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Methods */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            <List>
              {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                <ListItem key={method} divider>
                  <ListItemText
                    primary={method}
                    secondary={formatCurrency(amount)}
                  />
                  <Chip 
                    label={`${((amount / summary.totalRevenue) * 100).toFixed(1)}%`}
                    color="info"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Car Makes */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Most Common Car Makes
            </Typography>
            <List>
              {Object.entries(summary.carMakes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([make, count]) => (
                  <ListItem key={make} divider>
                    <ListItemText
                      primary={make}
                      secondary={`${count} vehicles`}
                    />
                    <Chip 
                      label={`${((count / summary.totalInvoices) * 100).toFixed(1)}%`}
                      color="secondary"
                      size="small"
                    />
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data in parallel with proper error handling
      const [invoicesResponse, clientsResponse, appointmentsResponse] = await Promise.all([
        invoicesAPI.getAll().catch(err => {
          console.error('Error fetching invoices:', err);
          throw new Error('Failed to fetch invoices. Please try again.');
        }),
        clientsAPI.getAll().catch(err => {
          console.error('Error fetching clients:', err);
          throw new Error('Failed to fetch clients. Please try again.');
        }),
        appointmentAPI.getAll().catch(err => {
          console.error('Error fetching appointments:', err);
          throw new Error('Failed to fetch appointments. Please try again.');
        })
      ]);

      if (!invoicesResponse?.data || !clientsResponse?.data || !appointmentsResponse?.data) {
        throw new Error('Invalid response from server');
      }

      const filteredInvoices = filterDataByDateRange(invoicesResponse.data, dateRange, 'createdAt');
      const filteredAppointments = filterDataByDateRange(appointmentsResponse.data, dateRange, 'date');
      
      if (filteredInvoices.length === 0 && filteredAppointments.length === 0) {
        setError('No data available for the selected date range');
      } else {
        setInvoices(filteredInvoices);
        setAppointments(filteredAppointments);
        calculateSummary(filteredInvoices, filteredAppointments, clientsResponse.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data. Please try again.');
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customDateRange, filterDataByDateRange, calculateSummary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add event listeners for real-time updates
  useEffect(() => {
    const handleClientUpdate = (event) => {
      console.log('Client update detected in Reports, refreshing data');
      fetchData();
    };

    const handlePaymentUpdate = (event) => {
      console.log('Payment update detected in Reports, refreshing data');
      fetchData();
    };

    const handleInvoiceUpdate = (event) => {
      console.log('Invoice update detected in Reports, refreshing data');
      fetchData();
    };

    window.addEventListener('client-updated', handleClientUpdate);
    window.addEventListener('payment-updated', handlePaymentUpdate);
    window.addEventListener('invoice-updated', handleInvoiceUpdate);
    
    return () => {
      window.removeEventListener('client-updated', handleClientUpdate);
      window.removeEventListener('payment-updated', handlePaymentUpdate);
      window.removeEventListener('invoice-updated', handleInvoiceUpdate);
    };
  }, []);

  if (loading) {
    return (
      <>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Garage Analytics & Reports
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
                disabled={loading || isExporting}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            {dateRange === 'custom' && (
              <DatePicker
                selectsRange={true}
                startDate={customDateRange[0]}
                endDate={customDateRange[1]}
                onChange={(update) => setCustomDateRange(update)}
                customInput={
                  <TextField
                    size="small"
                    placeholder="Select date range"
                    disabled={loading || isExporting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                }
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={isExporting ? <CircularProgress size={20} /> : <PdfIcon />}
                onClick={() => handleExport('pdf', viewMode)}
                disabled={loading || isExporting || invoices.length === 0}
                sx={{ mr: 1 }}
              >
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="contained"
                startIcon={isExporting ? <CircularProgress size={20} /> : <ExcelIcon />}
                onClick={() => handleExport('excel', viewMode)}
                disabled={loading || isExporting || invoices.length === 0}
              >
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </Box>
          </Box>
        </Box>

        {(error || exportError) && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => {
              setError(null);
              setExportError(null);
            }}
          >
            {error || exportError}
          </Alert>
        )}

        {isExporting && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={exportProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              {exportStatus}
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 && appointments.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No data available for the selected date range. Please try a different date range.
          </Alert>
        ) : (
          <>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Car</InputLabel>
                    <Select
                      value={carFilter}
                      label="Car"
                      onChange={e => setCarFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Cars</MenuItem>
                      {carOptions.map(car => (
                        <MenuItem key={car} value={car}>{car}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Service</InputLabel>
                    <Select
                      value={serviceFilter}
                      label="Service"
                      onChange={e => setServiceFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Services</MenuItem>
                      {serviceOptions.map(service => (
                        <MenuItem key={service} value={service}>{service}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>

            {/* View Mode Toggle */}
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newValue) => newValue && setViewMode(newValue)}
                aria-label="view mode"
              >
                <ToggleButton value="overview" aria-label="overview">
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Overview
                </ToggleButton>
                <ToggleButton value="detailed" aria-label="detailed">
                  <BarChartIcon sx={{ mr: 1 }} />
                  Detailed Stats
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {viewMode === 'overview' ? renderOverview() : renderDetailedStats()}
          </>
        )}
      </Box>
    </>
  );
};

export default Reports;
