import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { invoicesAPI, clientsAPI } from '../../api';
import { formatCurrency, formatPercentage, formatDate } from '../../utility/formatters';
import Header from "components/Headers/Header.js";

const validateExportData = (data) => {
  const { dateRange, customDateRange, reportType, filters } = data;
  
  // Validate required fields
  if (!dateRange || !reportType) {
    throw new Error('Missing required export parameters');
  }

  // Validate date range
  if (dateRange === 'custom') {
    if (!customDateRange?.[0] || !customDateRange?.[1]) {
      throw new Error('Custom date range requires both start and end dates');
    }
    if (new Date(customDateRange[0]) > new Date(customDateRange[1])) {
      throw new Error('Start date must be before end date');
    }
  }

  // Validate filters
  if (filters?.status && !['all', 'paid', 'pending', 'overdue'].includes(filters.status)) {
    throw new Error('Invalid status filter');
  }

  return {
    dateRange,
    customDateRange: customDateRange?.map(date => date ? format(date, 'yyyy-MM-dd') : null),
    reportType,
    filters: {
      status: filters?.status || 'all',
      search: filters?.search || ''
    }
  };
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState([null, null]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    averageInvoiceAmount: 0,
    collectionRate: 0,
    monthlyTrend: [],
    topClients: [],
    paymentMethods: {},
    serviceCategories: {},
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, customDateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data in parallel with proper error handling
      const [invoicesResponse, clientsResponse] = await Promise.all([
        invoicesAPI.getAll().catch(err => {
          console.error('Error fetching invoices:', err);
          throw new Error('Failed to fetch invoices. Please try again.');
        }),
        clientsAPI.getAll().catch(err => {
          console.error('Error fetching clients:', err);
          throw new Error('Failed to fetch clients. Please try again.');
        })
      ]);

      if (!invoicesResponse?.data || !clientsResponse?.data) {
        throw new Error('Invalid response from server');
      }

      const filteredInvoices = filterInvoicesByDateRange(invoicesResponse.data, dateRange);
      
      if (filteredInvoices.length === 0) {
        setError('No data available for the selected date range');
      } else {
        setInvoices(filteredInvoices);
        setClients(clientsResponse.data);
        calculateSummary(filteredInvoices, clientsResponse.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data. Please try again.');
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoicesByDateRange = (invoices, range) => {
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

    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  };

  const calculateSummary = (filteredInvoices, allClients) => {
    const summary = {
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalInvoices: filteredInvoices.length,
      paidInvoices: 0,
      overdueInvoices: 0,
      averageInvoiceAmount: 0,
      collectionRate: 0,
      monthlyTrend: [],
      topClients: [],
      paymentMethods: {},
      serviceCategories: {},
    };

    // Calculate basic metrics
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
    });

    // Calculate derived metrics
    summary.averageInvoiceAmount = summary.totalRevenue / (summary.totalInvoices || 1);
    summary.collectionRate = (summary.totalPaid / summary.totalRevenue) * 100;

    // Calculate monthly trend
    const monthlyData = {};
    filteredInvoices.forEach(invoice => {
      const month = format(new Date(invoice.createdAt), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, count: 0 };
      }
      monthlyData[month].revenue += invoice.amount;
      monthlyData[month].count++;
    });
    summary.monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      count: data.count
    }));

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

    setSummary(summary);
  };

  const handleExport = async (format, reportType = 'all') => {
    try {
      setIsExporting(true);
      setExportError(null);

      const exportData = {
        dateRange,
        customDateRange,
        reportType,
        filters: {
          status: filterStatus,
          search: searchTerm
        }
      };

      // Validate export data
      const validatedData = validateExportData(exportData);

      if (format === 'pdf') {
        await invoicesAPI.exportToPdf(validatedData);
      } else if (format === 'excel') {
        await invoicesAPI.exportToExcel(validatedData);
      }
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || `Failed to export ${format.toUpperCase()}. Please try again.`;
      setExportError(errorMessage);
      console.error(`Error exporting ${format}:`, err);
    } finally {
      setIsExporting(false);
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
          title="Collection Rate"
          value={formatPercentage(summary.collectionRate)}
          subtitle={`${summary.paidInvoices} paid invoices`}
          icon={CheckCircleIcon}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(summary.totalOutstanding)}
          subtitle={`${summary.totalInvoices - summary.paidInvoices} unpaid invoices`}
          icon={WarningIcon}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <SummaryCard
          title="Average Invoice"
          value={formatCurrency(summary.averageInvoiceAmount)}
          subtitle={`${summary.overdueInvoices} overdue invoices`}
          icon={AccountBalanceIcon}
          color="error"
        />
      </Grid>

      {/* Monthly Trend */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Revenue Trend
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Average</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.monthlyTrend.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell align="right">{formatCurrency(month.revenue)}</TableCell>
                      <TableCell align="right">{month.count}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(month.revenue / month.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Clients */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Clients
            </Typography>
            <List>
              {summary.topClients.map((client) => (
                <ListItem key={client.id}>
                  <ListItemText
                    primary={client.name}
                    secondary={formatCurrency(client.revenue)}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Methods Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                    <TableRow key={method}>
                      <TableCell>{method}</TableCell>
                      <TableCell align="right">{formatCurrency(amount)}</TableCell>
                      <TableCell align="right">
                        {formatPercentage((amount / summary.totalRevenue) * 100)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Service Categories */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Service Categories
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(summary.serviceCategories).map(([category, revenue]) => (
                    <TableRow key={category}>
                      <TableCell>{category}</TableCell>
                      <TableCell align="right">{formatCurrency(revenue)}</TableCell>
                      <TableCell align="right">
                        {formatPercentage((revenue / summary.totalRevenue) * 100)}
                      </TableCell>
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

  const renderInvoices = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Invoice Details
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              placeholder="Search invoices..."
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
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices
                .filter(invoice => {
                  const matchesSearch = 
                    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
                  return matchesSearch && matchesStatus;
                })
                .map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.serviceCategory}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'overdue' ? 'error' :
                          'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{invoice.paymentMethod || 'N/A'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <>
        <Header />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Header />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Financial Reports
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
            <Button
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={20} /> : <PdfIcon />}
              onClick={() => handleExport('pdf', activeTab)}
              disabled={loading || isExporting || invoices.length === 0}
              sx={{ mr: 1 }}
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={20} /> : <ExcelIcon />}
              onClick={() => handleExport('excel', activeTab)}
              disabled={loading || isExporting || invoices.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
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

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No data available for the selected date range. Please try a different date range.
          </Alert>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                aria-label="report tabs"
              >
                <Tab
                  icon={<TrendingUpIcon />}
                  label="Overview"
                  value="overview"
                />
                <Tab
                  icon={<ReceiptIcon />}
                  label="Invoices"
                  value="invoices"
                />
              </Tabs>
            </Box>

            {activeTab === 'overview' ? renderOverview() : renderInvoices()}
          </>
        )}
      </Box>
    </>
  );
};

export default Reports;
