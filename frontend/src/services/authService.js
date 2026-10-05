import api from './api';

// ─── Auth ─────────────────────────────────────────────────
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// ─── Users (Admin) ────────────────────────────────────────
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
};

// ─── Leads ────────────────────────────────────────────────
export const leadService = {
  // Admin
  getAll: (params) => api.get('/leads', { params }),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  assignCallingAgent: (id, data) => api.patch(`/leads/${id}/assign`, data),
  assignDemoAgent: (id, data) => api.patch(`/leads/${id}/assign-demo`, data),
  bulkAssign: (data) => api.post('/leads/bulk-assign', data),
  bulkDelete: (data) => api.post('/leads/bulk-delete', data),
  syncSheet: (sheetUrl) => api.post('/leads/sync-sheet', { sheetUrl }),
  getSheetConfig: () => api.get('/leads/sheet-config'),
  saveSheetUrl: (sheetUrl) => api.post('/leads/save-sheet-url', { sheetUrl }),
  getStats: () => api.get('/leads/stats'),

  // Calling Agent
  getMyLeads: (params) => api.get('/leads/my-leads', { params }),
  updateCallStatus: (id, data) => api.patch(`/leads/${id}/call-status`, data),

  // Demo Agent
  getMyDemos: (params) => api.get('/leads/my-demos', { params }),
  updateDemoStatus: (id, data) => api.patch(`/leads/${id}/demo-status`, data),
};
