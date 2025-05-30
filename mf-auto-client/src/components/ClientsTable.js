import React, { memo, useMemo, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Avatar,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import {
  Edit,
  Trash2,
  Info,
  CheckCircle,
  X,
  Clipboard,
  DollarSign,
  Camera,
  Clock,
  Tool,
  XCircle,
} from "react-feather";
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Error Boundary Component
class TableErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Table Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            Something went wrong loading the table.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </Paper>
      );
    }
    return this.props.children;
  }
}

// Status constants
const REPAIR_STATUSES = {
  WAITING: {
    value: "waiting",
    label: "Waiting",
    color: "warning",
    icon: Clock,
    nextStatus: "in_progress",
    nextLabel: "Start Repair"
  },
  IN_PROGRESS: {
    value: "in_progress",
    label: "In Progress",
    color: "info",
    icon: Tool,
    nextStatus: "completed",
    nextLabel: "Complete Repair"
  },
  COMPLETED: {
    value: "completed",
    label: "Completed",
    color: "success",
    icon: CheckCircle,
    nextStatus: "delivered",
    nextLabel: "Mark Delivered",
    requiresPayment: true
  },
  DELIVERED: {
    value: "delivered",
    label: "Delivered",
    color: "primary",
    icon: CheckCircle,
    isFinal: true
  }
};

const PAYMENT_STATUSES = {
  NOT_PAID: {
    value: "not_paid",
    label: "Not Paid",
    color: "error",
    icon: XCircle,
    nextStatus: "paid",
    nextLabel: "Mark as Paid",
    showUpdateButton: true
  },
  PAID: {
    value: "paid",
    label: "Paid",
    color: "success",
    icon: CheckCircle,
    isFinal: true,
    showUpdateButton: false
  },
  PARTIAL: {
    value: "partial",
    label: "Partial Payment",
    color: "warning",
    icon: DollarSign,
    nextStatus: "paid",
    nextLabel: "Complete Payment",
    showUpdateButton: true
  }
};

const getStatusConfig = (status, type) => {
  if (!status) return null;
  const statusMap = type === 'repair' ? REPAIR_STATUSES : PAYMENT_STATUSES;
  const statusKey = status.toUpperCase();
  return statusMap[statusKey] || null;
};

// Memoized status config getter
const useStatusConfig = () => {
  return useMemo(() => (status, type) => {
    if (!status) return null;
    const statusMap = type === 'repair' ? REPAIR_STATUSES : PAYMENT_STATUSES;
    const statusKey = status.toUpperCase();
    return statusMap[statusKey] || null;
  }, []);
};

// Memoized mobile view component
const MobileClientCard = memo(({ 
  client, 
  onView, 
  onEdit, 
  onUpdateStatus, 
  onUpdatePayment, 
  formatDate,
  getStatusConfig 
}) => {
  const repairStatus = getStatusConfig(client.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(client.paymentStatus, 'payment');

  return (
    <Paper 
      sx={{ p: 2, mb: 2, borderRadius: 2 }}
      role="article"
      aria-label={`Client card for ${client.clientName}`}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 40, height: 40 }}>
            {client.clientName?.[0] || "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {client.clientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client.phoneNumber}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView && onView(client)}>
            <Info size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit && onEdit(client)}>
            <Edit size={16} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Vehicle
        </Typography>
        <Typography variant="body2">
          {client.carDetails?.year} {client.carDetails?.make} {client.carDetails?.model}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {client.carDetails?.licensePlate}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Service
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {client.procedures?.map((p, i) => (
            <Chip
              key={i}
              label={p.label || p}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {repairStatus && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip
              label={repairStatus.label}
              color={repairStatus.color}
              icon={<repairStatus.icon size={16} />}
              size="small"
              onClick={() => !repairStatus.isFinal && onUpdateStatus && onUpdateStatus(client.id || client._id, repairStatus.nextStatus)}
              sx={{ 
                cursor: repairStatus.isFinal ? 'default' : 'pointer',
                '&:hover': {
                  opacity: repairStatus.isFinal ? 1 : 0.8
                }
              }}
            />
            {!repairStatus.isFinal && (
              <Button
                size="small"
                variant="outlined"
                color={repairStatus.color}
                onClick={() => onUpdateStatus && onUpdateStatus(client.id || client._id, repairStatus.nextStatus)}
                startIcon={<repairStatus.icon size={16} />}
                sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
              >
                {repairStatus.nextLabel}
              </Button>
            )}
          </Box>
        )}

        {paymentStatus && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payment
            </Typography>
            <Chip
              label={paymentStatus.label}
              color={paymentStatus.color}
              icon={<paymentStatus.icon size={16} />}
              size="small"
              onClick={() => !paymentStatus.isFinal && onUpdatePayment && onUpdatePayment(client.id || client._id, paymentStatus.nextStatus)}
              sx={{ 
                cursor: paymentStatus.isFinal ? 'default' : 'pointer',
                '&:hover': {
                  opacity: paymentStatus.isFinal ? 1 : 0.8
                }
              }}
            />
            {!paymentStatus.isFinal && (
              <Button
                size="small"
                variant="outlined"
                color={paymentStatus.color}
                onClick={() => onUpdatePayment && onUpdatePayment(client.id || client._id, paymentStatus.nextStatus)}
                startIcon={<paymentStatus.icon size={16} />}
                sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
              >
                {paymentStatus.nextLabel}
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Expected Delivery
        </Typography>
        <Typography variant="body2">
          {formatDate(client.deliveryDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {client.deliveryDate ? `${Math.max(0, Math.ceil((new Date(client.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left` : 'No date set'}
        </Typography>
      </Box>
    </Paper>
  );
});

// Memoized table row component
const TableRowComponent = memo(({ 
  client, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered, 
  formatDate,
  getStatusConfig,
  loadingActions,
  handleAction,
  style 
}) => {
  const clientId = client.id || client._id;
  const repairStatus = getStatusConfig(client.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(client.paymentStatus, 'payment');
  const isLoading = loadingActions[clientId];

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
      role="row"
      aria-label={`Client row for ${client.clientName}`}
      style={style}
    >
      {/* Client Info Cell */}
      <Box sx={{ 
        width: '20%', 
        p: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflow: 'hidden'
      }}>
        <Avatar 
          sx={{ width: 32, height: 32, flexShrink: 0 }}
          aria-label={`Avatar for ${client.clientName}`}
        >
          {client.clientName?.[0] || "?"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {client.clientName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {client.phoneNumber}
          </Typography>
        </Box>
      </Box>

      {/* Vehicle Info Cell */}
      <Box sx={{ 
        width: '15%', 
        p: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <Typography variant="body2" noWrap>
          {client.carDetails?.year} {client.carDetails?.make} {client.carDetails?.model}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {client.carDetails?.licensePlate}
        </Typography>
      </Box>

      {/* Service Info Cell */}
      <Box sx={{ 
        width: '20%', 
        p: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        overflow: 'hidden'
      }}>
        {client.procedures?.map((p, i) => (
          <Chip
            key={i}
            label={p.label || p}
            size="small"
            variant="outlined"
            sx={{ height: 24, maxWidth: '100%' }}
            role="listitem"
          />
        ))}
      </Box>

      {/* Status Cell */}
      <Box sx={{ 
        width: '15%', 
        p: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'hidden'
      }}>
        {repairStatus && (
          <>
            <Chip
              label={repairStatus.label}
              color={repairStatus.color}
              icon={<repairStatus.icon size={16} />}
              size="small"
              onClick={() => !repairStatus.isFinal && onUpdateStatus && 
                handleAction(onUpdateStatus, clientId, repairStatus.nextStatus)}
              sx={{ 
                cursor: repairStatus.isFinal ? 'default' : 'pointer',
                '&:hover': {
                  opacity: repairStatus.isFinal ? 1 : 0.8
                }
              }}
              role="button"
              aria-label={`Repair status: ${repairStatus.label}`}
            />
            {!repairStatus.isFinal && (
              <Button
                size="small"
                variant="outlined"
                color={repairStatus.color}
                onClick={() => onUpdateStatus && 
                  handleAction(onUpdateStatus, clientId, repairStatus.nextStatus)}
                startIcon={isLoading ? <CircularProgress size={16} /> : <repairStatus.icon size={16} />}
                disabled={isLoading}
                sx={{ height: 24, fontSize: '0.75rem' }}
                aria-label={`Update status to ${repairStatus.nextLabel}`}
              >
                {repairStatus.nextLabel}
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Payment Cell */}
      <Box sx={{ 
        width: '15%', 
        p: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'hidden'
      }}>
        {paymentStatus && (
          <>
            <Chip
              label={paymentStatus.label}
              color={paymentStatus.color}
              icon={<paymentStatus.icon size={16} />}
              size="small"
              onClick={() => paymentStatus.showUpdateButton && onUpdatePayment && 
                handleAction(onUpdatePayment, clientId, paymentStatus.nextStatus)}
              sx={{ 
                cursor: paymentStatus.showUpdateButton ? 'pointer' : 'default',
                '&:hover': {
                  opacity: paymentStatus.showUpdateButton ? 0.8 : 1
                }
              }}
              role="button"
              aria-label={`Payment status: ${paymentStatus.label}`}
            />
            {paymentStatus.showUpdateButton && (
              <Button
                size="small"
                variant="outlined"
                color={paymentStatus.color}
                onClick={() => onUpdatePayment && 
                  handleAction(onUpdatePayment, clientId, paymentStatus.nextStatus)}
                startIcon={isLoading ? <CircularProgress size={16} /> : <paymentStatus.icon size={16} />}
                disabled={isLoading}
                sx={{ height: 24, fontSize: '0.75rem' }}
                aria-label={`Update payment to ${paymentStatus.nextLabel}`}
              >
                {paymentStatus.nextLabel}
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Delivery Cell */}
      <Box sx={{ 
        width: '10%', 
        p: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <Typography variant="body2" noWrap>
          {formatDate(client.deliveryDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {client.deliveryDate ? `${Math.max(0, Math.ceil((new Date(client.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left` : 'No date set'}
        </Typography>
      </Box>

      {/* Actions Cell */}
      <Box sx={{ 
        width: '5%', 
        p: '8px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1
      }}>
        <Tooltip title="View Details">
          <IconButton 
            size="small" 
            onClick={() => onView && onView(client)}
            aria-label="View client details"
          >
            <Info size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton 
            size="small" 
            onClick={() => onEdit && onEdit(client)}
            aria-label="Edit client"
          >
            <Edit size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton 
            size="small" 
            onClick={() => onDelete && onDelete(client)}
            aria-label="Delete client"
          >
            <Trash2 size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

// Main table component
const ClientsTable = ({
  clients = [],
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdatePayment,
  onMarkDelivered,
  formatDate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const getStatusConfig = useStatusConfig();
  const [loadingActions, setLoadingActions] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Memoized table headers
  const tableHeaders = useMemo(() => [
    { id: 'client', label: 'Client', align: 'left' },
    { id: 'vehicle', label: 'Vehicle', align: 'left' },
    { id: 'service', label: 'Service', align: 'left' },
    { id: 'status', label: 'Status', align: 'left' },
    { id: 'payment', label: 'Payment', align: 'left' },
    { id: 'delivery', label: 'Expected Delivery', align: 'left' },
    { id: 'actions', label: 'Actions', align: 'center' }
  ], []);

  // Handle action with loading state
  const handleAction = useCallback(async (action, clientId, ...args) => {
    setLoadingActions(prev => ({ ...prev, [clientId]: true }));
    try {
      await action(clientId, ...args);
    } finally {
      setLoadingActions(prev => ({ ...prev, [clientId]: false }));
    }
  }, []);

  // Handle page change
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Memoized paginated clients
  const paginatedClients = useMemo(() => {
    const start = page * rowsPerPage;
    return clients.slice(start, start + rowsPerPage);
  }, [clients, page, rowsPerPage]);

  // Memoized mobile view
  if (isMobile) {
    return (
      <TableErrorBoundary>
        <Box 
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          role="list"
          aria-label="Client list"
        >
          {paginatedClients.map(client => (
            <MobileClientCard
              key={client.id || client._id}
              client={client}
              onView={onView}
              onEdit={onEdit}
              onUpdateStatus={(id, status) => handleAction(onUpdateStatus, id, status)}
              onUpdatePayment={(id, status) => handleAction(onUpdatePayment, id, status)}
              formatDate={formatDate}
              getStatusConfig={getStatusConfig}
            />
          ))}
        </Box>
        <TablePagination
          component="div"
          count={clients.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableErrorBoundary>
    );
  }

  // Desktop view with virtualization
  return (
    <TableErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
        <TableContainer 
          component={Paper}
          sx={{
            flex: 1,
            overflow: 'hidden',
            '& .MuiTable-root': {
              minWidth: isTablet ? 800 : 1000,
              tableLayout: 'fixed'
            },
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '8px 16px'
            },
            '& .MuiTableCell-head': {
              backgroundColor: theme.palette.background.paper,
              fontWeight: 'bold',
              borderBottom: `2px solid ${theme.palette.divider}`
            }
          }}
          role="region"
          aria-label="Clients table"
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {tableHeaders.map(header => (
                  <TableCell 
                    key={header.id}
                    align={header.align}
                    role="columnheader"
                    sx={{
                      width: header.id === 'client' ? '20%' :
                             header.id === 'vehicle' ? '15%' :
                             header.id === 'service' ? '20%' :
                             header.id === 'status' ? '15%' :
                             header.id === 'payment' ? '15%' :
                             header.id === 'delivery' ? '10%' :
                             header.id === 'actions' ? '5%' : 'auto'
                    }}
                  >
                    {header.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
          <Box sx={{ height: 'calc(100% - 48px)', overflow: 'hidden' }}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  width={width}
                  itemCount={paginatedClients.length}
                  itemSize={64} // Slightly reduced row height
                  overscanCount={5}
                >
                  {({ index, style }) => (
                    <TableRowComponent
                      client={paginatedClients[index]}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUpdateStatus={onUpdateStatus}
                      onUpdatePayment={onUpdatePayment}
                      onMarkDelivered={onMarkDelivered}
                      formatDate={formatDate}
                      getStatusConfig={getStatusConfig}
                      loadingActions={loadingActions}
                      handleAction={handleAction}
                      style={{
                        ...style,
                        width: '100%',
                        display: 'flex'
                      }}
                    />
                  )}
                </List>
              )}
            </AutoSizer>
          </Box>
        </TableContainer>
        <TablePagination
          component="div"
          count={clients.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              margin: 0
            }
          }}
        />
      </Box>
    </TableErrorBoundary>
  );
};

// Memoize the entire component
export default memo(ClientsTable); 