import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
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
  getEmissions: (params) => api.get('/emissions', { params }),
  getStats: (params) => api.get('/emissions/stats', { params }),
}

export const reportsAPI = {
  getSummary: (period = 'week') => api.get(`/reports/summary?period=${period}`),
  getInsights: () => api.get('/reports/insights'),
  getProgress: () => api.get('/reports/progress'),
}

export const cloudAPI = {
  testConnection: (provider) => api.get(`/cloud/test-connection/${provider}`),
  getRegions: (provider) => api.get('/cloud/regions', { params: { provider } }),
  calculateSavings: (data) => api.post('/cloud/calculate-savings', data),
  launchInstance: (data) => api.post('/cloud/launch-instance', data),
  terminateInstance: (data) => api.post('/cloud/terminate-instance', data),
  getInstanceStatus: (provider, instanceId, params) =>api.get(`/cloud/instance-status/${provider}/${instanceId}`, { params }),
  listInstances: (provider, params) => api.get(`/cloud/instances/${provider}`, { params }),
  submitWorkload: (data) => api.post('/cloud/workloads', data),
  getWorkloads: (params) => api.get('/cloud/workloads', { params }),
  getWorkloadDetails: (id) => api.get(`/cloud/workloads/${id}`),
  seedRegions: () => api.post('/cloud/regions/seed'),
}

export default api