import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Clock,
  User,
  Activity,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  DollarSign,
  Truck,
  Plus
} from 'react-feather';
import { format } from 'date-fns';

const getActionIcon = (action) => {
  switch (action) {
    case 'create':
      return <Plus size={16} />;
    case 'update':
      return <Edit size={16} />;
    case 'delete':
      return <Trash2 size={16} />;
    case 'restore':
      return <RotateCcw size={16} />;
    case 'status_change':
      return <Activity size={16} />;
    case 'payment_update':
      return <DollarSign size={16} />;
    case 'delivery':
      return <Truck size={16} />;
    default:
      return <Activity size={16} />;
  }
};

const getActionColor = (action) => {
  switch (action) {
    case 'create':
      return 'success';
    case 'update':
      return 'info';
    case 'delete':
      return 'error';
    case 'restore':
      return 'warning';
    case 'status_change':
      return 'primary';
    case 'payment_update':
      return 'success';
    case 'delivery':
      return 'primary';
    default:
      return 'default';
  }
};

const getActionLabel = (action) => {
  switch (action) {
    case 'create':
      return 'Created';
    case 'update':
      return 'Updated';
    case 'delete':
      return 'Deleted';
    case 'restore':
      return 'Restored';
    case 'status_change':
      return 'Status Changed';
    case 'payment_update':
      return 'Payment Updated';
    case 'delivery':
      return 'Delivered';
    default:
      return action;
  }
};

const AuditLogViewer = ({ open, onClose, clientId, clientName }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && clientId) {
      fetchAuditLogs();
    }
  }, [open, clientId]);

  const fetchAuditLogs = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/clients/${clientId}/audit-logs?limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderChanges = (changes) => {
    if (!changes || changes.length === 0) return null;
    
    return (
      <Box sx={{ mt: 1 }}>
        {changes.map((change, index) => (
          <Box key={index} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {change.field}: {String(change.oldValue || 'null')} → {String(change.newValue || 'null')}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    
    return (
      <Box sx={{ mt: 1 }}>
        {Object.entries(metadata).map(([key, value]) => (
          <Box key={key} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {key}: {String(value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Activity size={20} />
          <Typography variant="h6">
            Audit Logs - {clientName}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && auditLogs.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No audit logs found for this client.
          </Alert>
        )}
        
        {!loading && !error && auditLogs.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={getActionLabel(log.action)}>
                          <IconButton size="small" sx={{ color: `${getActionColor(log.action)}.main` }}>
                            {getActionIcon(log.action)}
                          </IconButton>
                        </Tooltip>
                        <Chip
                          label={getActionLabel(log.action)}
                          color={getActionColor(log.action)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.userRole}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={12} />
                        <Typography variant="body2">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {renderChanges(log.changes)}
                        {renderMetadata(log.metadata)}
                        {log.ipAddress && (
                          <Typography variant="caption" color="text.secondary">
                            IP: {log.ipAddress}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={fetchAuditLogs} 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLogViewer; 