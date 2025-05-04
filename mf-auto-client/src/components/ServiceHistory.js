// Create or update ServiceHistory.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import axios from 'axios';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Button, CircularProgress, Alert
} from '@mui/material';
import { Eye, FileText, ArrowLeft } from 'react-feather';

const ServiceHistory = ({ clientId, onViewDetails, onBack }) => {
  const { token } = useContext(UserContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchServiceHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${baseURL}/clients/${clientId}/service-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );
        
        setHistory(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching service history:', error);
        setError('Failed to load service history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchServiceHistory();
    }
  }, [clientId, token, baseURL]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusChip = (status) => {
    let color = 'default';
    switch (status) {
      case 'completed':
        color = 'success';
        break;
      case 'in_progress':
        color = 'info';
        break;
      case 'pending':
        color = 'warning';
        break;
      case 'cancelled':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={status.replace('_', ' ')}
        color={color}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Button 
          startIcon={<ArrowLeft />}
          onClick={onBack}
          sx={{ mb: 2 }}
        >
          Back to Client
        </Button>
        <Alert severity="info">No service history found for this client.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          startIcon={<ArrowLeft />}
          onClick={onBack}
        >
          Back to Client
        </Button>
        <Typography variant="h6">Service History</Typography>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Service Type</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{formatDate(service.date)}</TableCell>
                <TableCell>{service.serviceType}</TableCell>
                <TableCell>
                  {service.vehicleInfo}
                </TableCell>
                <TableCell>{service.technicianName}</TableCell>
                <TableCell align="right">
                  {service.totalCost.toLocaleString('en-US', {
                    style: 'currency', 
                    currency: 'GMD'
                  }).replace(/GMD/g, "D")}
                </TableCell>
                <TableCell>{getStatusChip(service.status)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onViewDetails(service.id)}
                    title="View Details"
                  >
                    <Eye size={18} />
                  </IconButton>
                  {service.invoiceId && (
                    <IconButton
                      size="small"
                      onClick={() => window.open(`/admin/invoices/${service.invoiceId}`, '_blank')}
                      title="View Invoice"
                    >
                      <FileText size={18} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ServiceHistory;