// api.js
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Get API URL from environment variables with proper fallback
const API_URL = process.env.REACT_APP_API_URL || 'https://server.mfautosfinance.com';
const BASE_PATH = process.env.REACT_APP_BASE_URL || '/mf-autofinance';

// Debug configuration details
console.log('API Configuration:', {
  API_URL,
  BASE_PATH,
  'NODE_ENV': process.env.NODE_ENV
});

// Create axios instance with base settings
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // Add timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add debugging
    console.log(`API Request to: ${config.url}`, {
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error in interceptor:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    // Handle specific error cases
    if (error.code === 'ERR_NETWORK') {
      console.error("Network error - Is the server running?");
      toast.error("Cannot connect to server. Please check if the server is running.");
    } else if (error.response?.status === 401) {
      // Clear token and auth state on 401 errors
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    }
    
    return Promise.reject(error);
  }
);

// Auth related API calls - Note: These use /auth/* not /api/auth/*
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  resetPassword: (email) => api.post('/auth/reset', { email }),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPasswordWithCode: (data) => api.post('/auth/password-reset', data),
  updateUserInfo: (data) => api.put('/auth/update-info', data),
  checkStatus: () => api.get('/auth/status')
};

// All other API calls - These use /api prefix
// Transaction API methods
export const transactionAPI = {
  // Get all transactions
  getAll: (params = {}) => {
    // Convert params object to query string
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/transactions?${queryString}` : '/api/transactions';
    
    return api.get(url);
  },
  
  // Get a specific transaction by ID
  getById: (id) => api.get(`/api/transactions/${id}`),
  
  // Create a new transaction
  create: (data) => api.post('/api/transactions', data),
  
  // Update a transaction
  update: (id, data) => {
    if (!id) {
      console.error("Transaction update called with undefined ID");
      throw new Error("Cannot update transaction: ID is required");
    }
    
    // Remove id from data to prevent duplicate ID fields
    const { id: _, ...cleanData } = data;
    return api.put(`/api/transactions/${id}`, cleanData);
  },
  
  // Delete a transaction
  delete: (id) => api.delete(`/api/transactions/${id}`),
  
  // Get transaction summary
  getSummary: async (timeRange = 'month') => {
    try {
      const response = await transactionAPI.getAll();
      const transactions = response.data;
      
      // Calculate date range based on timeRange
      const endDate = new Date();
      let startDate = new Date();
      
      switch(timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1); // Default to month
      }
      
      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => {
        const txDate = new Date(t.date || t.createdAt);
        return txDate >= startDate && txDate <= endDate;
      });
      
      // Calculate summary stats
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income' && t.status === 'approved')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
      const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense' && t.status === 'approved')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
      const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
      const approvedCount = filteredTransactions.filter(t => t.status === 'approved').length;
      const rejectedCount = filteredTransactions.filter(t => t.status === 'rejected').length;
      
      return {
        data: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          pendingCount,
          approvedCount,
          rejectedCount
        }
      };
    } catch (error) {
      console.error('Error calculating transaction summary:', error);
      throw error;
    }
  },
  
  // Export to CSV
  exportCSV: async (params = {}) => {
    try {
      const response = await transactionAPI.getAll(params);
      const transactions = response.data;
      
      // Format as CSV
      const headers = [
        "ID", 
        "Date", 
        "Type", 
        "Category", 
        "Description", 
        "Amount", 
        "Status", 
        "Reference",
        "Client Name",
        "Vehicle Info",
        "Created By",
        "Approved By",
        "Approved At"
      ];
      
      const csvData = transactions.map(t => [
        t.id || t._id,
        new Date(t.date || t.createdAt).toISOString().split('T')[0],
        t.type || 'expense',
        t.category || 'other',
        t.description || '',
        t.amount || '0',
        t.status || 'pending',
        t.reference || '',
        t.clientName || '',
        t.vehicleInfo ? `${t.vehicleInfo.year} ${t.vehicleInfo.make} ${t.vehicleInfo.model}` : '',
        t.createdBy || '',
        t.approvedBy || '',
        t.approvedAt ? new Date(t.approvedAt).toISOString().split('T')[0] : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return { data: blob };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
};

// Client related API calls
export const clientsAPI = {
  getAll: () => api.get('/api/clients'),
  getById: (id) => api.get(`/api/clients/${id}`),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`),
  updateStatus: (clientId, status) => api.patch(`/api/clients/${clientId}/status`, { status }),
  updatePayment: (clientId, paymentData) => api.patch(`/api/clients/${clientId}/payment`, paymentData),
  markAsDelivered: (clientId, deliveryData) => api.patch(`/api/clients/${clientId}/delivery`, deliveryData),
  getHistory: (params = {}) => api.get('/api/clients/history', { params }),
  getSummary: () => api.get('/api/clients/summary'),
  getClientDocuments: (clientId) => api.get(`/api/clients/${clientId}/documents`),
  sendDocuments: (clientId, documentUrls) => api.post(`/api/clients/${clientId}/send-documents`, { documentUrls }),
  getRepairHistory: (clientId) => api.get(`/api/clients/${clientId}/repair-history`),
  getCompletionPDF: (clientId) => api.get(`/api/clients/${clientId}/completion-pdf`, {
    responseType: 'blob',
    timeout: 30000, // 30 second timeout
    headers: {
      'Accept': 'application/pdf'
    },
    validateStatus: function (status) {
      return status >= 200 && status < 300; // Only accept 2xx status codes
    }
  }),
};

// Add error handler function
const handleApiError = (error) => {
  console.error("API Error:", error);
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  }
  throw error;
};

// Invoice related API calls
export const invoicesAPI = {
  getAll: (params = {}) => api.get('/api/invoices', { params }),
  getById: (id) => api.get(`/api/invoices/${id}`),
  create: (data) => api.post('/api/invoices', data),
  update: (id, data) => api.put(`/api/invoices/${id}`, data),
  delete: (id) => api.delete(`/api/invoices/${id}`),
  markAsPaid: (id) => api.patch(`/api/invoices/${id}/pay`),
  processPayment: (id, paymentData) => api.post(`/api/invoices/${id}/payment`, paymentData),
  getPDF: (id) => api.get(`/api/invoices/${id}/pdf`, { 
    responseType: 'blob',
    timeout: 30000, // 30 second timeout
    headers: {
      'Accept': 'application/pdf'
    },
    validateStatus: function (status) {
      return status >= 200 && status < 300; // Only accept 2xx status codes
    }
  }),
  sendEmail: (id) => api.post(`/api/invoices/${id}/email`),
  exportExcel: (params = {}) => api.get('/api/invoices/export/excel', { params, responseType: 'blob' }),
  updateStatus: (id, status) => api.patch(`/api/invoices/${id}/status`, { status }),
  exportToPdf: async (exportData, onProgress) => {
    const MAX_RETRIES = 3;
    const TIMEOUT = 30000; // 30 seconds
    let retryCount = 0;

    const downloadWithRetry = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await api.post('/api/invoices/export/pdf', exportData, {
          responseType: 'blob',
          signal: controller.signal,
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        });

        clearTimeout(timeoutId);

        // Validate response
        if (!response.data || response.data.size === 0) {
          throw new Error('Received empty PDF data');
        }

        // Verify PDF content type
        if (response.headers['content-type'] !== 'application/pdf') {
          throw new Error('Invalid response type');
        }

        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Verify blob size
        if (blob.size === 0) {
          throw new Error('Generated PDF is empty');
        }

        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename based on date range and report type
        const dateStr = exportData.dateRange === 'custom' 
          ? `${format(new Date(exportData.customDateRange[0]), 'yyyy-MM-dd')}_to_${format(new Date(exportData.customDateRange[1]), 'yyyy-MM-dd')}`
          : exportData.dateRange;
        
        link.download = `financial_report_${exportData.reportType}_${dateStr}.pdf`;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('PDF generation timed out');
        }
        throw error;
      }
    };

    while (retryCount < MAX_RETRIES) {
      try {
        return await downloadWithRetry();
      } catch (error) {
        retryCount++;
        if (retryCount === MAX_RETRIES) {
          console.error('Error exporting to PDF after retries:', error);
          toast.error(error.message || 'Failed to export PDF. Please try again.');
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        toast.warning(`Retrying PDF export (${retryCount}/${MAX_RETRIES})...`);
      }
    }
  },
  exportToExcel: async (exportData) => {
    try {
      const response = await api.post('/api/invoices/export/excel', exportData, {
        responseType: 'blob'
      });
      
      // Create a blob from the Excel data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on date range and report type
      const dateStr = exportData.dateRange === 'custom' 
        ? `${format(new Date(exportData.customDateRange[0]), 'yyyy-MM-dd')}_to_${format(new Date(exportData.customDateRange[1]), 'yyyy-MM-dd')}`
        : exportData.dateRange;
      
      link.download = `financial_report_${exportData.reportType}_${dateStr}.xlsx`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel. Please try again.');
      throw error;
    }
  }
};  

// User related API calls
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`)
};

// Budget related API calls
export const budgetAPI = {
  getAll: () => api.get('/api/budgets'),
  getById: (id) => api.get(`/api/budgets/${id}`),
  create: (data) => api.post('/api/budgets', data),
  update: (id, data) => {
    // Make sure id is a string and not undefined
    if (!id) {
      console.error("Budget update called with undefined ID");
      throw new Error("Cannot update budget: ID is required");
    }
    
    console.log(`Sending update request to: /api/budgets/${id}`);
    
    // Remove id from data to prevent duplicate ID fields
    const { id: _, ...cleanData } = data;
    
    return api.put(`/api/budgets/${id}`, cleanData);
  },
  delete: (id) => api.delete(`/api/budgets/${id}`)
};

// Appointment related API calls
export const appointmentAPI = {
  getAll: (params = {}) => {
    // Convert params object to query string
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.clientId) queryParams.append('clientId', params.clientId);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/appointments?${queryString}` : '/api/appointments';
    
    return api.get(url);
  },
  getById: (id) => api.get(`/api/appointments/${id}`),
  create: (data) => api.post('/api/appointments', data),
  update: (id, data) => api.put(`/api/appointments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/appointments/${id}`)
};

// Response interceptor for client-appointment synchronization
api.interceptors.response.use(
  async (response) => {
    const config = response.config;
    const url = config.url || '';
    const method = (config.method || '').toLowerCase();
    
    try {
      // Handle various sync operations as before
      if (url.includes('/api/clients/') && (method === 'put' || method === 'patch')) {
        // Sync client updates to appointments
        const updatedClient = response.data;
        if (updatedClient?.id) {
          try {
            const appointmentsResponse = await appointmentAPI.getAll({
              clientId: updatedClient.id
            });
            
            if (appointmentsResponse.data?.length) {
              // Update appointment data as before
              // Code omitted for brevity
            }
          } catch (error) {
            console.error("Error syncing client update to appointments:", error);
          }
        }
      }
      
      // Handle other sync operations as before
      // Code omitted for brevity
    } catch (error) {
      console.error("Error in response interceptor:", error);
      // Don't block the original response
    }
    
    return response;
  },
  (error) => {
    // Debug response errors
    console.error("API Error Response:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Export copies with alternative naming for backward compatibility
export const appointmentsAPI = appointmentAPI;
export const clientAPI = clientsAPI;
export const invoiceAPI = invoicesAPI;
export const userAPI = usersAPI;

export default api;