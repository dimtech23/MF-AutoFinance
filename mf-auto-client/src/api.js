// api.js
import axios from 'axios';

// Get API URL and BASE_URL from environment variables with proper defaults
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://server.mfautosfinance.com/api';

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
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add debugging
    console.log(`API Request to: ${config.url}`);
    
    if (token) {
      // Ensure Authorization header is added properly
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
  (response) => {
    return response;
  },
  (error) => {
    console.error("API response error:", error.message);
    
    // Check for authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and auth state on 401 errors
      localStorage.removeItem('token');
      // You might need to add logic here to reset your auth context
    }
    
    return Promise.reject(error);
  }
);

// Auth related API calls - Note: These should NOT include /api prefix since the backend routes don't have it
export const authAPI = {
  login: (credentials) => {
    const loginUrl = process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/auth/login`
      : 'https://server.mfautosfinance.com/auth/login';
      
    return axios.post(loginUrl, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
  },
  logout: () => api.post('/auth/logout'),
  resetPassword: (email) => api.post('/auth/reset', { email }),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPasswordWithCode: (data) => api.post('/auth/password-reset', data),
  updateUserInfo: (data) => api.put('/auth/update-info', data)
};

// All other API calls - These SHOULD include /api prefix
// Transaction API methods
export const transactionAPI = {
  // Get all transactions (we'll use budget entries as transactions)
  getAll: (params = {}) => {
    return budgetAPI.getAll();
  },
  
  // Get a specific transaction by ID
  getById: (id) => {
    return budgetAPI.getById(id);
  },
  
  // Create a new transaction
  create: (data) => {
    return budgetAPI.create(data);
  },
  
  // Update a transaction
  update: (id, data) => {
    return budgetAPI.update(id, data);
  },
  
  // Delete a transaction
  delete: (id) => {
    return budgetAPI.delete(id);
  },
  
  // Get transaction summary by calculating from budget data
  getSummary: async (timeRange = 'month') => {
    try {
      // Fetch all budget entries
      const response = await budgetAPI.getAll();
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
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
      const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
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
  
  // Generate monthly data for charts
  getMonthlyData: async (year = new Date().getFullYear()) => {
    try {
      // Fetch all budget entries
      const response = await budgetAPI.getAll();
      const transactions = response.data;
      
      // Group by month
      const months = {};
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.date || transaction.createdAt);
        if (date.getFullYear() !== parseInt(year)) return;
        
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!months[monthKey]) {
          months[monthKey] = {
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            income: 0,
            expenses: 0
          };
        }
        
        if (transaction.type === 'income') {
          months[monthKey].income += parseFloat(transaction.amount) || 0;
        } else {
          months[monthKey].expenses += parseFloat(transaction.amount) || 0;
        }
      });
      
      // Convert to array and sort by date
      const monthlyData = Object.values(months)
        .map(month => ({
          ...month,
          balance: month.income - month.expenses,
          label: `${month.month} ${month.year}`
        }))
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return months.indexOf(a.month) - months.indexOf(b.month);
        });
      
      return { data: monthlyData };
    } catch (error) {
      console.error('Error generating monthly data:', error);
      throw error;
    }
  },
  
  // Export to CSV by formatting budget data
  exportCSV: async (params = {}) => {
    try {
      // Fetch all budget entries
      const response = await budgetAPI.getAll();
      let transactions = response.data;
      
      // Apply filters if provided
      if (params.startDate && params.endDate) {
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        transactions = transactions.filter(t => {
          const txDate = new Date(t.date || t.createdAt);
          return txDate >= startDate && txDate <= endDate;
        });
      }
      
      if (params.type) {
        transactions = transactions.filter(t => t.type === params.type);
      }
      
      if (params.status) {
        transactions = transactions.filter(t => t.status === params.status);
      }
      
      if (params.category) {
        transactions = transactions.filter(t => t.category === params.category);
      }
      
      // Format as CSV
      const headers = ["ID", "Date", "Type", "Category", "Description", "Amount", "Status", "Reference"];
      const csvData = transactions.map(t => [
        t.id || t._id,
        new Date(t.date || t.createdAt).toISOString().split('T')[0],
        t.type || 'expense',
        t.category || 'other',
        t.description || '',
        t.amount || '0',
        t.status || 'pending',
        t.reference || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
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
  updateStatus: (clientId, status) => {
    if (!clientId) {
      console.error("Client updateStatus called with undefined ID");
      return Promise.reject(new Error("Cannot update status: Client ID is required"));
    }
    return api.patch(`/api/clients/${clientId}/status`, { status });
  },
  updatePayment: (clientId, paymentData) => {
    if (!clientId) {
      console.error("Client updatePayment called with undefined ID");
      return Promise.reject(new Error("Cannot update payment: Client ID is required"));
    }
    return api.patch(`/api/clients/${clientId}/payment`, paymentData);
  }
};

// Invoice related API calls
export const invoicesAPI = {
  getAll: () => api.get('/api/invoices'),
  getById: (id) => api.get(`/api/invoices/${id}`),
  create: (data) => api.post('/api/invoices', data),
  update: (id, data) => api.put(`/api/invoices/${id}`, data),
  delete: (id) => api.delete(`/api/invoices/${id}`)
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