// src/services/api.js
// Thin-client API layer — all business logic lives in the Node.js backend.

import axios from 'axios';

// ── Config ─────────────────────────────────────────────────────────────────
// Change this to your backend URL (e.g. "http://192.168.1.x:5000/api" on LAN)
const BASE_URL = 'http://192.168.1.4:5000/api';

let _tokenGetter = null;

export function setTokenGetter(fn) {
  _tokenGetter = fn;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = _tokenGetter ? _tokenGetter() : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired / invalid — caller should handle redirect to login
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password)        => api.post('/auth/login',    { email, password }),
  register: (name, email, password)  => api.post('/auth/register', { name, email, password }),
  profile:  ()                       => api.get('/auth/profile'),
};

// ── Emissions ───────────────────────────────────────────────────────────────
export const emissionsAPI = {
  log:    (data)   => api.post('/emissions/log', data),
  list:   (params) => api.get('/emissions',       { params }),
  stats:  (params) => api.get('/emissions/stats', { params }),
  recent: (limit = 10) => api.get('/emissions/recent', { params: { limit } }),
};

// ── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  summary:  (period = 'week') => api.get(`/reports/summary?period=${period}`),
  insights: ()                => api.get('/reports/insights'),
  progress: ()                => api.get('/reports/progress'),
};

// ── Cloud ────────────────────────────────────────────────────────────────────
export const cloudAPI = {
  testConnection:    (provider)  => api.get(`/cloud/test-connection/${provider}`),
  regions:           (provider)  => api.get('/cloud/regions', { params: { provider } }),
  calculateSavings:  (data)      => api.post('/cloud/calculate-savings', data),
  launchInstance:    (data)      => api.post('/cloud/launch-instance', data),
  terminateInstance: (data)      => api.post('/cloud/terminate-instance', data),
  instanceStatus:    (provider, id, params) =>
    api.get(`/cloud/instance-status/${provider}/${id}`, { params }),
  listInstances:     (provider, params) =>
    api.get(`/cloud/instances/${provider}`, { params }),
  submitWorkload:    (data)      => api.post('/cloud/workloads', data),
  workloads:         (params)    => api.get('/cloud/workloads', { params }),
  workloadDetails:   (id)        => api.get(`/cloud/workloads/${id}`),
  seedRegions:       ()          => api.post('/cloud/regions/seed'),
};

export default api;
