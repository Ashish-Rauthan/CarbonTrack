// web_app/frontend/src/services/api.js

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
}

export const emissionsAPI = {
  logEmission: (data) => api.post('/emissions/log', data),
  getEmissions: () => api.get('/emissions'),
  getStats: () => api.get('/emissions/stats'),
}

// NEW: Reports API
export const reportsAPI = {
  getSummary: (period = 'week') => api.get(`/reports/summary?period=${period}`),
  getInsights: () => api.get('/reports/insights'),
  getProgress: () => api.get('/reports/progress'),
  downloadReport: (format = 'pdf', period = 'month') => 
    api.get(`/reports/download?format=${format}&period=${period}`, { responseType: 'blob' }),
}

export default api