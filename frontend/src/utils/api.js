import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response.data, // Return response.data directly
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      removeToken();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.data?.detail) {
      // Check if detail is an array (Pydantic validation errors)
      if (Array.isArray(error.response.data.detail)) {
        // Extract the first error message
        const firstError = error.response.data.detail[0];
        toast.error(firstError.msg || 'Validation error');
      } else {
        toast.error(error.response.data.detail);
      }
    } else {
      toast.error('An error occurred. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.access_token) {
      setToken(response.access_token);
    }
    return response;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.access_token) {
      setToken(response.access_token);
    }
    return response;
  },
  
  logout: () => {
    removeToken();
    window.location.href = '/login';
  },
  
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  
  // Email integration
  getEmailConnections: () => api.get('/users/me/email-connections'),
  addEmailConnection: (data) => api.post('/users/me/email-connections', data),
  removeEmailConnection: (id) => api.delete(`/users/me/email-connections/${id}`),
  setPrimaryEmail: (id) => api.put(`/users/me/email-connections/${id}/primary`),
  updateNotifications: (settings) => api.put('/users/me/notification-settings', settings),
  updateEmailSignature: (signature) => api.put('/users/me/email-signature', { signature }),
  
  // Make api available for direct use
  api,
};

// Documents API
export const documentsAPI = {
  create: (data) => api.post('/documents', data),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (params = {}) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  update: (id, data) => api.put(`/documents/${id}`, data),
  updateSection: (docId, sectionId, data) => api.put(`/documents/${docId}/sections/${sectionId}`, data),
  updatePage: (docId, pageNumber, data) => api.put(`/documents/${docId}/pages/${pageNumber}`, data),
  addMultimedia: (docId, sectionId, data) => api.post(`/documents/${docId}/sections/${sectionId}/multimedia`, data),
  addInteractive: (docId, sectionId, data) => api.post(`/documents/${docId}/sections/${sectionId}/interactive`, data),
  addMultimediaToPage: (docId, pageNumber, data) => api.post(`/documents/${docId}/pages/${pageNumber}/multimedia`, data),
  addInteractiveToPage: (docId, pageNumber, data) => api.post(`/documents/${docId}/pages/${pageNumber}/interactive`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  getAnalytics: (id) => api.get(`/documents/${id}/analytics`),
  getPageAnalytics: (id) => api.get(`/documents/${id}/page-analytics`),
  getComments: (id) => api.get(`/documents/${id}/comments`),
  addComment: (id, data) => api.post(`/documents/${id}/comments`, data),
  sendEmail: (id, emailData) => api.post(`/documents/${id}/send-email`, emailData),
  trackPageView: (data) => api.post('/tracking/page-view', data),
};

// AI API
export const aiAPI = {
  generateRFP: (data) => api.post('/ai/generate-rfp', data),
  analyzeDocument: (id) => api.post(`/ai/analyze-document/${id}`),
};

// Tracking API
export const trackingAPI = {
  trackView: (data) => api.post('/tracking/view', data),
};

export { api, getToken, setToken, removeToken };
export default api;