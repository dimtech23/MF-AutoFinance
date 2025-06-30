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
  TablePagination,
  Skeleton,
  Fade,
} from "@mui/material";
import {
  Edit,
  Trash2,
  Info,
  CheckCircle,
  DollarSign,
  Clock,
  Tool,
  XCircle,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  MoreVertical,
  Phone,
  MessageSquare,
  Users,
  Activity,
} from "react-feather";

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

// Simple status constants - matching the old working version
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
    nextLabel: "Mark Delivered"
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
    nextLabel: "Mark as Paid"
  },
  PAID: {
    value: "paid",
    label: "Paid",
    color: "success",
    icon: CheckCircle,
    isFinal: true
  },
  PARTIAL: {
    value: "partial",
    label: "Partial Payment",
    color: "warning",
    icon: DollarSign,
    nextStatus: "paid",
    nextLabel: "Complete Payment"
  }
};

// Simple status config getter
const getStatusConfig = (status, type) => {
  if (!status) return null;
  const statusMap = type === 'repair' ? REPAIR_STATUSES : PAYMENT_STATUSES;
  
  // Try to find the status by value first
  const statusEntry = Object.values(statusMap).find(s => s.value === status);
  if (statusEntry) return statusEntry;
  
  // Fallback to uppercase key matching
  const statusKey = status.toUpperCase();
  return statusMap[statusKey] || null;
};

// Simple mobile view component
const MobileClientCard = memo(({ 
  client, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered,
  onNewService,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  onAuditLogs,
  formatDate
}) => {
  // Add null check to prevent errors when client is null
  if (!client) {
    return null;
  }

  const repairStatus = getStatusConfig(client.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(client.paymentStatus, 'payment');

  return (
    <Fade in={true} timeout={300}>
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
          },
          cursor: 'pointer',
        }}
        role="article"
        aria-label={`Client card for ${client.clientName}`}
        onClick={() => onView && onView(client)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {client.clientName?.[0] || "?"}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {client.clientName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.phoneNumber}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onView && onView(client);
                }}
                sx={{ 
                  bgcolor: 'primary.50',
                  '&:hover': { bgcolor: 'primary.100' }
                }}
              >
                <Eye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(client);
                }}
                sx={{ 
                  bgcolor: 'info.50',
                  '&:hover': { bgcolor: 'info.100' }
                }}
              >
                <Edit3 size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Service">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onNewService && onNewService(client);
                }}
                sx={{ 
                  bgcolor: 'success.50',
                  '&:hover': { bgcolor: 'success.100' }
                }}
              >
                <Plus size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Audit Logs">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAuditLogs && onAuditLogs(client);
                }}
                sx={{ 
                  bgcolor: 'warning.50',
                  '&:hover': { bgcolor: 'warning.100' }
                }}
              >
                <Activity size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Vehicle
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          {repairStatus && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={repairStatus.label}
                  color={repairStatus.color}
                  icon={<repairStatus.icon size={16} />}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {/* Quick status update button */}
                {!repairStatus.isFinal && repairStatus.value !== 'completed' && onQuickStatusUpdate && (
                  <Button
                    size="small"
                    variant="contained"
                    color={repairStatus.color}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickStatusUpdate(client.id || client._id, client.repairStatus);
                    }}
                    startIcon={<repairStatus.icon size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {repairStatus.nextLabel}
                  </Button>
                )}
                {/* Show delivery button only when repair is completed and payment is paid */}
                {repairStatus.value === 'completed' && paymentStatus?.value === 'paid' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkDelivered && onMarkDelivered(client);
                    }}
                    startIcon={<CheckCircle size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {/* Show payment reminder when completed but not paid */}
                {repairStatus.value === 'completed' && paymentStatus?.value !== 'paid' && (
                  <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                    Payment required before delivery
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          
          {paymentStatus && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Payment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={paymentStatus.label}
                  color={paymentStatus.color}
                  icon={<paymentStatus.icon size={16} />}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {/* Payment amount display */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total: D{client.totalAmount || client.estimatedCost || 0}
                  </Typography>
                  {client.partialPaymentAmount > 0 && (
                    <Typography variant="caption" color="success.main">
                      Paid: D{client.partialPaymentAmount}
                    </Typography>
                  )}
                  {client.partialPaymentAmount > 0 && (client.totalAmount || client.estimatedCost) > client.partialPaymentAmount && (
                    <Typography variant="caption" color="warning.main">
                      Balance: D{Math.max(0, (client.totalAmount || client.estimatedCost || 0) - client.partialPaymentAmount)}
                    </Typography>
                  )}
                </Box>
                {/* Quick payment update button */}
                {!paymentStatus.isFinal && onQuickPaymentUpdate && (
                  <Button
                    size="small"
                    variant="contained"
                    color={paymentStatus.color}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickPaymentUpdate(client.id || client._id, client.paymentStatus);
                    }}
                    startIcon={<paymentStatus.icon size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {paymentStatus.nextLabel}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(client.createdAt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {client.deliveryDate ? `Delivery: ${formatDate(client.deliveryDate)}` : 'No delivery date'}
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
});

// Simple desktop table row component
const DesktopTableRow = memo(({ 
  client, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered,
  onNewService,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  onAuditLogs,
  formatDate 
}) => {
  const clientId = client.id || client._id;
  const repairStatus = getStatusConfig(client.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(client.paymentStatus, 'payment');

  return (
    <TableRow hover>
      {/* Client Info Cell */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {client.clientName?.[0] || "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">
              {client.clientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {client.phoneNumber}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Vehicle Info Cell */}
      <TableCell>
        <Typography variant="body2">
          {client.carDetails?.year} {client.carDetails?.make} {client.carDetails?.model}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {client.carDetails?.licensePlate}
        </Typography>
      </TableCell>

      {/* Service Info Cell */}
      <TableCell>
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
      </TableCell>

      {/* Status Cell */}
      <TableCell>
        {repairStatus && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip
              label={repairStatus.label}
              color={repairStatus.color}
              icon={<repairStatus.icon size={16} />}
              size="small"
            />
            {/* Quick status update button - only show for non-completed statuses */}
            {!repairStatus.isFinal && repairStatus.value !== 'completed' && onQuickStatusUpdate && (
              <Button
                size="small"
                variant="contained"
                color={repairStatus.color}
                onClick={() => onQuickStatusUpdate(clientId, client.repairStatus)}
                startIcon={<repairStatus.icon size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                {repairStatus.nextLabel}
              </Button>
            )}
            {/* Show delivery button only when repair is completed and payment is paid */}
            {repairStatus.value === 'completed' && paymentStatus?.value === 'paid' && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => onMarkDelivered && onMarkDelivered(client)}
                startIcon={<CheckCircle size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                Mark as Delivered
              </Button>
            )}
            {/* Show payment reminder when completed but not paid */}
            {repairStatus.value === 'completed' && paymentStatus?.value !== 'paid' && (
              <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                Payment required before delivery
              </Typography>
            )}
          </Box>
        )}
      </TableCell>

      {/* Payment Cell */}
      <TableCell>
        {paymentStatus && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip
              label={paymentStatus.label}
              color={paymentStatus.color}
              icon={<paymentStatus.icon size={16} />}
              size="small"
            />
            {/* Payment amount display */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total: D{client.totalAmount || client.estimatedCost || 0}
              </Typography>
              {client.partialPaymentAmount > 0 && (
                <Typography variant="caption" color="success.main">
                  Paid: D{client.partialPaymentAmount}
                </Typography>
              )}
              {client.partialPaymentAmount > 0 && (client.totalAmount || client.estimatedCost) > client.partialPaymentAmount && (
                <Typography variant="caption" color="warning.main">
                  Balance: D{Math.max(0, (client.totalAmount || client.estimatedCost || 0) - client.partialPaymentAmount)}
                </Typography>
              )}
            </Box>
            {/* Quick payment update button */}
            {!paymentStatus.isFinal && onQuickPaymentUpdate && (
              <Button
                size="small"
                variant="contained"
                color={paymentStatus.color}
                onClick={() => onQuickPaymentUpdate(clientId, client.paymentStatus)}
                startIcon={<paymentStatus.icon size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                {paymentStatus.nextLabel}
              </Button>
            )}
          </Box>
        )}
      </TableCell>

      {/* Delivery Cell */}
      <TableCell>
        <Typography variant="body2">
          {formatDate(client.deliveryDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {client.deliveryDate ? `${Math.max(0, Math.ceil((new Date(client.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left` : 'No date set'}
        </Typography>
      </TableCell>

      {/* Actions Cell */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              onClick={() => onView && onView(client)}
            >
              <Info size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => onEdit && onEdit(client)}
            >
              <Edit size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="New Service">
            <IconButton 
              size="small" 
              onClick={() => onNewService && onNewService(client)}
            >
              <Plus size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move to Trash">
            <IconButton 
              size="small" 
              onClick={() => onDelete && onDelete(client)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Audit Logs">
            <IconButton 
              size="small" 
              onClick={() => onAuditLogs && onAuditLogs(client)}
            >
              <Activity size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

// Grouped client card component for mobile view
const GroupedClientCard = memo(({ 
  groupedClient, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered,
  onNewService,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  onAuditLogs,
  formatDate,
  getDisplayClient
}) => {
  // Safety check for undefined groupedClient
  if (!groupedClient) {
    return null;
  }

  const displayClient = getDisplayClient(groupedClient);
  
  // Safety check for displayClient
  if (!displayClient) {
    return null;
  }
  
  const repairStatus = getStatusConfig(displayClient.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(displayClient.paymentStatus, 'payment');

  // Safety check for baseInfo
  const baseInfo = groupedClient.baseInfo || {};
  const services = groupedClient.services || [];
  const activeService = groupedClient.activeService;
  const totalServices = groupedClient.totalServices || 0;
  const canAddNewService = groupedClient.canAddNewService || false;

  return (
    <Fade in={true} timeout={300}>
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
          },
          cursor: 'pointer',
        }}
        role="article"
        aria-label={`Client card for ${baseInfo.clientName || 'Unknown Client'}`}
        onClick={() => onView && onView(displayClient)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {baseInfo.clientName?.[0] || "?"}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {baseInfo.clientName || 'Unknown Client'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {baseInfo.phoneNumber || 'No phone'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalServices} service{totalServices !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onView && onView(displayClient);
                }}
                sx={{ 
                  bgcolor: 'primary.50',
                  '&:hover': { bgcolor: 'primary.100' }
                }}
              >
                <Eye size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(displayClient);
                }}
                sx={{ 
                  bgcolor: 'info.50',
                  '&:hover': { bgcolor: 'info.100' }
                }}
              >
                <Edit3 size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title={canAddNewService ? "New Service" : "Complete current service first"}>
              <span>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewService && onNewService(groupedClient);
                  }}
                  disabled={!canAddNewService}
                  sx={{ 
                    bgcolor: canAddNewService ? 'success.50' : 'grey.100',
                    '&:hover': { bgcolor: canAddNewService ? 'success.100' : 'grey.100' }
                  }}
                >
                  <Plus size={16} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Vehicle
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {baseInfo.carDetails?.year} {baseInfo.carDetails?.make} {baseInfo.carDetails?.model}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {baseInfo.carDetails?.licensePlate}
          </Typography>
        </Box>

        {/* Services Timeline */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Services ({totalServices})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {services.slice(0, 3).map((service, index) => (
              <Box 
                key={service.serviceId || index}
                sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: service === activeService ? 'primary.50' : 'grey.50',
                  border: service === activeService ? '1px solid' : '1px solid transparent',
                  borderColor: service === activeService ? 'primary.main' : 'transparent'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: service === activeService ? 600 : 400 }}>
                    {service.issueDescription || `Service ${index + 1}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={service.repairStatus.replace('_', ' ')}
                    color={getStatusConfig(service.repairStatus, 'repair')?.color || 'default'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(service.createdAt)} - D{service.totalAmount || 0}
                </Typography>
              </Box>
            ))}
            {services.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                +{services.length - 3} more services
              </Typography>
            )}
          </Box>
        </Box>

        {/* Current Status */}
        {activeService && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={repairStatus.label}
                  color={repairStatus.color}
                  icon={<repairStatus.icon size={16} />}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {/* Quick status update button */}
                {!repairStatus.isFinal && repairStatus.value !== 'completed' && onQuickStatusUpdate && (
                  <Button
                    size="small"
                    variant="contained"
                    color={repairStatus.color}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickStatusUpdate(activeService.serviceId, activeService.repairStatus);
                    }}
                    startIcon={<repairStatus.icon size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {repairStatus.nextLabel}
                  </Button>
                )}
                {/* Show delivery button only when repair is completed and payment is paid */}
                {repairStatus.value === 'completed' && paymentStatus?.value === 'paid' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkDelivered && onMarkDelivered(activeService);
                    }}
                    startIcon={<CheckCircle size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Payment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={paymentStatus.label}
                  color={paymentStatus.color}
                  icon={<paymentStatus.icon size={16} />}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                {/* Payment amount display */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total: D{displayClient.totalAmount || displayClient.estimatedCost || 0}
                  </Typography>
                  {displayClient.partialPaymentAmount > 0 && (
                    <Typography variant="caption" color="success.main">
                      Paid: D{displayClient.partialPaymentAmount}
                    </Typography>
                  )}
                  {displayClient.partialPaymentAmount > 0 && (displayClient.totalAmount || displayClient.estimatedCost) > displayClient.partialPaymentAmount && (
                    <Typography variant="caption" color="warning.main">
                      Balance: D{Math.max(0, (displayClient.totalAmount || displayClient.estimatedCost || 0) - displayClient.partialPaymentAmount)}
                    </Typography>
                  )}
                </Box>
                {/* Quick payment update button */}
                {!paymentStatus.isFinal && onQuickPaymentUpdate && (
                  <Button
                    size="small"
                    variant="contained"
                    color={paymentStatus.color}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickPaymentUpdate(activeService.serviceId, activeService.paymentStatus);
                    }}
                    startIcon={<paymentStatus.icon size={16} />}
                    sx={{ 
                      height: 28, 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {paymentStatus.nextLabel}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Latest: {formatDate(displayClient.createdAt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeService ? 'Active Service' : 'All Services Completed'}
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
});

// Desktop table row component for grouped clients
const GroupedDesktopTableRow = memo(({ 
  groupedClient, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered,
  onNewService,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  onAuditLogs,
  formatDate,
  getDisplayClient
}) => {
  // Safety check for undefined groupedClient
  if (!groupedClient) {
    return null;
  }

  const displayClient = getDisplayClient(groupedClient);
  
  // Safety check for displayClient
  if (!displayClient) {
    return null;
  }
  
  const repairStatus = getStatusConfig(displayClient.repairStatus, 'repair');
  const paymentStatus = getStatusConfig(displayClient.paymentStatus, 'payment');

  // Safety check for baseInfo
  const baseInfo = groupedClient.baseInfo || {};
  const services = groupedClient.services || [];
  const activeService = groupedClient.activeService;
  const totalServices = groupedClient.totalServices || 0;
  const canAddNewService = groupedClient.canAddNewService || false;

  return (
    <TableRow hover>
      {/* Client Info Cell */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {baseInfo.clientName?.[0] || "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">
              {baseInfo.clientName || 'Unknown Client'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {baseInfo.phoneNumber || 'No phone'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {totalServices} service{totalServices !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Vehicle Info Cell */}
      <TableCell>
        <Typography variant="body2">
          {baseInfo.carDetails?.year} {baseInfo.carDetails?.make} {baseInfo.carDetails?.model}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {baseInfo.carDetails?.licensePlate}
        </Typography>
      </TableCell>

      {/* Services Cell */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {services.slice(0, 2).map((service, index) => (
            <Box 
              key={service.serviceId || index}
              sx={{ 
                p: 0.5, 
                borderRadius: 0.5, 
                bgcolor: service === activeService ? 'primary.50' : 'grey.50',
                border: service === activeService ? '1px solid' : '1px solid transparent',
                borderColor: service === activeService ? 'primary.main' : 'transparent'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: service === activeService ? 600 : 400 }}>
                {service.issueDescription || `Service ${index + 1}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {formatDate(service.createdAt)} - D{service.totalAmount || 0}
              </Typography>
            </Box>
          ))}
          {services.length > 2 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              +{services.length - 2} more
            </Typography>
          )}
        </Box>
      </TableCell>

      {/* Status Cell */}
      <TableCell>
        {activeService && repairStatus && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip
              label={repairStatus.label}
              color={repairStatus.color}
              icon={<repairStatus.icon size={16} />}
              size="small"
            />
            {/* Quick status update button */}
            {!repairStatus.isFinal && repairStatus.value !== 'completed' && onQuickStatusUpdate && (
              <Button
                size="small"
                variant="contained"
                color={repairStatus.color}
                onClick={() => onQuickStatusUpdate(activeService.serviceId, activeService.repairStatus)}
                startIcon={<repairStatus.icon size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                {repairStatus.nextLabel}
              </Button>
            )}
            {/* Show delivery button only when repair is completed and payment is paid */}
            {repairStatus.value === 'completed' && paymentStatus?.value === 'paid' && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => onMarkDelivered && onMarkDelivered(activeService)}
                startIcon={<CheckCircle size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                Mark as Delivered
              </Button>
            )}
          </Box>
        )}
        {!activeService && (
          <Typography variant="caption" color="text.secondary">
            All Completed
          </Typography>
        )}
      </TableCell>

      {/* Payment Cell */}
      <TableCell>
        {activeService && paymentStatus && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip
              label={paymentStatus.label}
              color={paymentStatus.color}
              icon={<paymentStatus.icon size={16} />}
              size="small"
            />
            {/* Payment amount display */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total: D{displayClient.totalAmount || displayClient.estimatedCost || 0}
              </Typography>
              {displayClient.partialPaymentAmount > 0 && (
                <Typography variant="caption" color="success.main">
                  Paid: D{displayClient.partialPaymentAmount}
                </Typography>
              )}
              {displayClient.partialPaymentAmount > 0 && (displayClient.totalAmount || displayClient.estimatedCost) > displayClient.partialPaymentAmount && (
                <Typography variant="caption" color="warning.main">
                  Balance: D{Math.max(0, (displayClient.totalAmount || displayClient.estimatedCost || 0) - displayClient.partialPaymentAmount)}
                </Typography>
              )}
            </Box>
            {/* Quick payment update button */}
            {!paymentStatus.isFinal && onQuickPaymentUpdate && (
              <Button
                size="small"
                variant="contained"
                color={paymentStatus.color}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPaymentUpdate(activeService.serviceId, activeService.paymentStatus);
                }}
                startIcon={<paymentStatus.icon size={16} />}
                sx={{ height: 24, fontSize: '0.75rem' }}
              >
                {paymentStatus.nextLabel}
              </Button>
            )}
          </Box>
        )}
        {!activeService && (
          <Typography variant="caption" color="text.secondary">
            All Paid
          </Typography>
        )}
      </TableCell>

      {/* Delivery Cell */}
      <TableCell>
        {activeService ? (
          <>
            <Typography variant="body2">
              {formatDate(activeService.deliveryDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeService.deliveryDate ? `${Math.max(0, Math.ceil((new Date(activeService.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left` : 'No date set'}
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">
            All Delivered
          </Typography>
        )}
      </TableCell>

      {/* Actions Cell */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              onClick={() => onView && onView(displayClient)}
            >
              <Info size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => onEdit && onEdit(displayClient)}
            >
              <Edit size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title={canAddNewService ? "New Service" : "Complete current service first"}>
            <span>
              <IconButton 
                size="small" 
                onClick={() => onNewService && onNewService(groupedClient)}
                disabled={!canAddNewService}
              >
                <Plus size={16} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move to Trash">
            <IconButton 
              size="small" 
              onClick={() => onDelete && onDelete(displayClient)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Audit Logs">
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onAuditLogs && onAuditLogs(displayClient);
              }}
              sx={{ bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } }}
            >
              <Activity size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

// Main ClientsTable component
const ClientsTable = memo(({ 
  clients, 
  isLoading, 
  onView, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePayment, 
  onMarkDelivered,
  onNewService,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  onAuditLogs,
  formatDate,
  searchTerm = "",
  filterStatus = null,
  getDisplayClient
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle page change
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Check if we're dealing with grouped clients or individual clients
  const isGroupedClients = useMemo(() => {
    return clients.length > 0 && clients[0] && typeof clients[0] === 'object' && 'baseInfo' in clients[0];
  }, [clients]);

  // Get paginated clients
  const paginatedClients = useMemo(() => {
    const start = page * rowsPerPage;
    return clients.slice(start, start + rowsPerPage);
  }, [clients, page, rowsPerPage]);

  // Loading skeleton for mobile
  if (isLoading && isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3].map((item) => (
          <Paper key={item} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box>
                  <Skeleton variant="text" width={150} height={24} />
                  <Skeleton variant="text" width={100} height={16} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[1, 2, 3, 4].map((btn) => (
                  <Skeleton key={btn} variant="circular" width={32} height={32} />
                ))}
              </Box>
            </Box>
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {[1, 2].map((chip) => (
                <Skeleton key={chip} variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="text" width={100} height={14} />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  // Loading skeleton for desktop
  if (isLoading && !isMobile) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Client', 'Vehicle', 'Services', 'Status', 'Payment', 'Expected Delivery', 'Actions'].map((header) => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={header === 'Actions' ? 80 : 120} height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                  <TableCell key={cell}>
                    <Skeleton variant="text" width="100%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Empty state
  if (!isLoading && clients.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Users size={48} color="#ccc" />
          <Typography variant="h6" color="text.secondary">
            No clients found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Get started by adding your first client'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <TableErrorBoundary>
        <Box 
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          role="list"
          aria-label="Client list"
        >
          {paginatedClients.map((client, index) => {
            // Handle grouped clients
            if (isGroupedClients && getDisplayClient) {
              const displayClient = getDisplayClient(client);
              return (
                <GroupedClientCard
                  key={client?.baseInfo?.originalClientId || `grouped-client-${index}`}
                  groupedClient={client}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePayment={onUpdatePayment}
                  onMarkDelivered={onMarkDelivered}
                  onNewService={onNewService}
                  onQuickStatusUpdate={onQuickStatusUpdate}
                  onQuickPaymentUpdate={onQuickPaymentUpdate}
                  onAuditLogs={onAuditLogs}
                  formatDate={formatDate}
                  getDisplayClient={getDisplayClient}
                />
              );
            }
            
            // Handle individual clients
            return (
              <MobileClientCard
                key={client?.id || client?._id || `client-${index}`}
                client={client}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
                onUpdatePayment={onUpdatePayment}
                onMarkDelivered={onMarkDelivered}
                onNewService={onNewService}
                onQuickStatusUpdate={onQuickStatusUpdate}
                onQuickPaymentUpdate={onQuickPaymentUpdate}
                onAuditLogs={onAuditLogs}
                formatDate={formatDate}
              />
            );
          })}
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

  // Desktop view - simple table
  return (
    <TableErrorBoundary>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedClients.map((client, index) => {
              // Handle grouped clients
              if (isGroupedClients && getDisplayClient) {
                const displayClient = getDisplayClient(client);
                return (
                  <GroupedDesktopTableRow
                    key={client?.baseInfo?.originalClientId || `grouped-client-${index}`}
                    groupedClient={client}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePayment={onUpdatePayment}
                    onMarkDelivered={onMarkDelivered}
                    onNewService={onNewService}
                    onQuickStatusUpdate={onQuickStatusUpdate}
                    onQuickPaymentUpdate={onQuickPaymentUpdate}
                    onAuditLogs={onAuditLogs}
                    formatDate={formatDate}
                    getDisplayClient={getDisplayClient}
                  />
                );
              }
              
              // Handle individual clients
              return (
                <DesktopTableRow
                  key={client?.id || client?._id || `client-${index}`}
                  client={client}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePayment={onUpdatePayment}
                  onMarkDelivered={onMarkDelivered}
                  onNewService={onNewService}
                  onQuickStatusUpdate={onQuickStatusUpdate}
                  onQuickPaymentUpdate={onQuickPaymentUpdate}
                  onAuditLogs={onAuditLogs}
                  formatDate={formatDate}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={clients.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableErrorBoundary>
  );
});

export default memo(ClientsTable); 