import axios from 'axios';
import { storage } from '../utils/storage';

// For web demo mode: use mock data when no backend available
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://seniorcare360-api.onrender.com');

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: async (data: {
    email: string; password: string; first_name: string;
    last_name: string; phone?: string;
  }) => {
    const res = await api.post('/auth/register', data);
    await storage.setItem('access_token', res.data.access_token);
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    await storage.setItem('access_token', res.data.access_token);
    return res.data;
  },

  logout: async () => {
    await storage.deleteItem('access_token');
  },

  getToken: () => storage.getItem('access_token'),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userService = {
  getProfile: () => api.get('/users/me').then(r => r.data),
  updateProfile: (data: any) => api.put('/users/me', data).then(r => r.data),
};

// ─── Medications ──────────────────────────────────────────────────────────────
export const medicationService = {
  list: () => api.get('/medications/').then(r => r.data),
  add: (data: any) => api.post('/medications/', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/medications/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/medications/${id}`),
  requestDelivery: (data: {
    medication_id: number;
    special_instructions?: string;
    use_saved_address?: boolean;
    custom_address?: string;
  }) => api.post('/medications/request-delivery', data).then(r => r.data),
  deliveryHistory: () => api.get('/medications/deliveries/history').then(r => r.data),
  trackDelivery: (id: number) => api.get(`/medications/deliveries/${id}`).then(r => r.data),
};

// ─── Vitals ───────────────────────────────────────────────────────────────────
export const vitalsService = {
  list: (vital_type?: string) =>
    api.get('/vitals/', { params: { vital_type } }).then(r => r.data),
  log: (data: any) => api.post('/vitals/', data).then(r => r.data),
  delete: (id: number) => api.delete(`/vitals/${id}`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentService = {
  list: (upcoming_only = true) =>
    api.get('/appointments/', { params: { upcoming_only } }).then(r => r.data),
  create: (data: any) => api.post('/appointments/', data).then(r => r.data),
  complete: (id: number) => api.put(`/appointments/${id}/complete`).then(r => r.data),
  delete: (id: number) => api.delete(`/appointments/${id}`),
};

// ─── Emergency ────────────────────────────────────────────────────────────────
export const emergencyService = {
  getContacts: () => api.get('/emergency/contacts').then(r => r.data),
  addContact: (data: any) => api.post('/emergency/contacts', data).then(r => r.data),
  deleteContact: (id: number) => api.delete(`/emergency/contacts/${id}`),
  triggerSOS: (data: { latitude?: number; longitude?: number; message?: string }) =>
    api.post('/emergency/sos', data).then(r => r.data),
};

// ─── Benefits ─────────────────────────────────────────────────────────────────
export const benefitsService = {
  list: (category?: string) =>
    api.get('/benefits/', { params: { category } }).then(r => r.data),
};

export default api;
