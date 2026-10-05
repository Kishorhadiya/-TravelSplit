import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const tripService = {
  create: (data) => api.post('/trips', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  update: (id, data) => api.put(`/trips/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/trips/${id}`),
  archive: (id) => api.put(`/trips/${id}/archive`),
  addMember: (tripId, data) => api.post(`/trips/${tripId}/members`, data),
  join: (tripId) => api.post(`/trips/${tripId}/join`),
  removeMember: (tripId, userId) => api.delete(`/trips/${tripId}/members/${userId}`),
  updateMemberRole: (tripId, userId, role) => api.put(`/trips/${tripId}/members/${userId}/role`, { role }),
};

export const expenseService = {
  create: (tripId, data) => api.post(`/trips/${tripId}/expenses`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (tripId, params) => api.get(`/trips/${tripId}/expenses`, { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  update: (id, data) => api.put(`/expenses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const balanceService = {
  getBalances: (tripId) => api.get(`/trips/${tripId}/balances`),
  getSimplifiedBalances: (tripId) => api.get(`/trips/${tripId}/simplified-balances`),
};

export const settlementService = {
  getAll: (tripId, params) => api.get(`/trips/${tripId}/settlements`, { params }),
  create: (tripId, data) => api.post(`/trips/${tripId}/settlements`, data),
  update: (id, data) => api.put(`/settlements/${id}`, data),
};

export const friendService = {
  getAll: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  search: (query) => api.get('/friends/search', { params: { query } }),
  sendRequest: (data) => api.post('/friends/request', data),
  respond: (id, status) => api.put(`/friends/${id}`, { status }),
  remove: (id) => api.delete(`/friends/${id}`),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrip: (tripId) => api.get(`/trips/${tripId}/analytics`),
};
