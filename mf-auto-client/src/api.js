// api.js
import axios from 'axios';

// Base URL from environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth related API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  resetPassword: (email) => api.post('/auth/reset', { email }),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPasswordWithCode: (data) => api.post('/auth/password-reset', data),
  updateUserInfo: (data) => api.put('/auth/update-info', data)
};

// Client related API calls - named clientsAPI to match your imports
export const clientsAPI = {
  getAll: () => api.get('/api/clients'),
  getById: (id) => api.get(`/api/clients/${id}`),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`)
};

// Invoice related API calls - named invoicesAPI to match your imports
export const invoicesAPI = {
  getAll: () => api.get('/api/invoices'),
  getById: (id) => api.get(`/api/invoices/${id}`),
  create: (data) => api.post('/api/invoices', data),
  update: (id, data) => api.put(`/api/invoices/${id}`, data),
  delete: (id) => api.delete(`/api/invoices/${id}`)
};

// User related API calls - named usersAPI to match your imports
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
  update: (id, data) => api.put(`/api/budgets/${id}`, data),
  delete: (id) => api.delete(`/api/budgets/${id}`)
};

// Also export client, invoice and user API with singular names for compatibility
export const clientAPI = clientsAPI;
export const invoiceAPI = invoicesAPI;
export const userAPI = usersAPI;

export default api;