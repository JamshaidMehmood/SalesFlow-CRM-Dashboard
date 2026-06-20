import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  googleLogin: (data) => api.post('/auth/google', data).then((r) => r.data),
  getConfig: () => api.get('/auth/config').then((r) => r.data),
  getProfile: () => api.get('/auth/profile').then((r) => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.put('/auth/password', data).then((r) => r.data),
  getUsers: () => api.get('/auth/users').then((r) => r.data),
  inviteUser: (data) => api.post('/auth/users/invite', data).then((r) => r.data),
  disableUser2FA: (userId) =>
    api.post(`/auth/users/${userId}/disable-2fa`).then((r) => r.data),
};

export const twoFactorApi = {
  getStatus: () => api.get('/auth/2fa/status').then((r) => r.data),
  setup: () => api.post('/auth/2fa/setup').then((r) => r.data),
  verifySetup: (code) => api.post('/auth/2fa/verify-setup', { code }).then((r) => r.data),
  disable: (data) => api.post('/auth/2fa/disable', data).then((r) => r.data),
  verifyLogin: (data) => api.post('/auth/2fa/verify', data).then((r) => r.data),
};

export const auditLogsApi = {
  getAll: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
  getEntityHistory: (entityType, entityId) =>
    api.get(`/audit-logs/entity/${entityType}/${entityId}`).then((r) => r.data),
};

export const teamsApi = {
  getAll: () => api.get('/teams').then((r) => r.data),
  getReps: () => api.get('/teams/reps').then((r) => r.data),
  create: (data) => api.post('/teams', data).then((r) => r.data),
  update: (id, data) => api.put(`/teams/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/teams/${id}`).then((r) => r.data),
  addMember: (id, userId) => api.post(`/teams/${id}/members`, { userId }).then((r) => r.data),
  removeMember: (id, userId) =>
    api.delete(`/teams/${id}/members/${userId}`).then((r) => r.data),
};

export const territoriesApi = {
  getAll: () => api.get('/territories').then((r) => r.data),
  create: (data) => api.post('/territories', data).then((r) => r.data),
  update: (id, data) => api.put(`/territories/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/territories/${id}`).then((r) => r.data),
};

export const onboardingApi = {
  get: () => api.get('/onboarding').then((r) => r.data),
  dismiss: () => api.post('/onboarding/dismiss').then((r) => r.data),
};

export const contactsApi = {
  getAll: (params) => api.get('/contacts', { params }).then((r) => r.data),
  getById: (id) => api.get(`/contacts/${id}`).then((r) => r.data),
  create: (data) => api.post('/contacts', data).then((r) => r.data),
  update: (id, data) => api.put(`/contacts/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/contacts/${id}`).then((r) => r.data),
  exportCsv: (params) =>
    api.get('/contacts/export', { params, responseType: 'blob' }).then((r) => r.data),
  importCsv: ({ file, mapping, ownerId }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (ownerId) formData.append('ownerId', ownerId);
    return api
      .post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  getDuplicates: () => api.get('/contacts/duplicates').then((r) => r.data),
  getMergePreview: (survivorId, mergedId) =>
    api.get('/contacts/merge/preview', { params: { survivorId, mergedId } }).then((r) => r.data),
  merge: (data) => api.post('/contacts/merge', data).then((r) => r.data),
};

export const tagsApi = {
  getAll: () => api.get('/tags').then((r) => r.data),
  create: (data) => api.post('/tags', data).then((r) => r.data),
  delete: (id) => api.delete(`/tags/${id}`).then((r) => r.data),
};

export const customFieldsApi = {
  getAll: () => api.get('/custom-fields').then((r) => r.data),
  create: (data) => api.post('/custom-fields', data).then((r) => r.data),
  update: (id, data) => api.put(`/custom-fields/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/custom-fields/${id}`).then((r) => r.data),
  reorder: (fieldIds) => api.put('/custom-fields/reorder', { fieldIds }).then((r) => r.data),
};

export const leadSourcesApi = {
  getAll: () => api.get('/lead-sources').then((r) => r.data),
  getAllAdmin: () => api.get('/lead-sources/all').then((r) => r.data),
  getAnalytics: () => api.get('/lead-sources/analytics').then((r) => r.data),
  create: (data) => api.post('/lead-sources', data).then((r) => r.data),
  update: (id, data) => api.put(`/lead-sources/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/lead-sources/${id}`).then((r) => r.data),
};

export const attachmentsApi = {
  getAll: (params) => api.get('/attachments', { params }).then((r) => r.data),
  upload: (formData) =>
    api.post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  delete: (id) => api.delete(`/attachments/${id}`).then((r) => r.data),
  downloadUrl: (id) => `/api/attachments/${id}/download`,
};

export const dealsApi = {
  getAll: (params) => api.get('/deals', { params }).then((r) => r.data),
  create: (data) => api.post('/deals', data).then((r) => r.data),
  update: (id, data) => api.put(`/deals/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/deals/${id}`).then((r) => r.data),
};

export const activitiesApi = {
  getAll: (params) => api.get('/activities', { params }).then((r) => r.data),
  create: (data) => api.post('/activities', data).then((r) => r.data),
  delete: (id) => api.delete(`/activities/${id}`).then((r) => r.data),
};

export const notesApi = {
  getAll: (contactId) => api.get(`/contacts/${contactId}/notes`).then((r) => r.data),
  create: (contactId, data) => api.post(`/contacts/${contactId}/notes`, data).then((r) => r.data),
  delete: (contactId, id) => api.delete(`/contacts/${contactId}/notes/${id}`).then((r) => r.data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data),
};

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then((r) => r.data),
  create: (data) => api.post('/tasks', data).then((r) => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

export const pipelineStagesApi = {
  getAll: () => api.get('/pipeline-stages').then((r) => r.data),
  create: (data) => api.post('/pipeline-stages', data).then((r) => r.data),
  update: (id, data) => api.put(`/pipeline-stages/${id}`, data).then((r) => r.data),
  reorder: (stageIds) => api.put('/pipeline-stages/reorder', { stageIds }).then((r) => r.data),
  delete: (id, data) => api.delete(`/pipeline-stages/${id}`, { data }).then((r) => r.data),
};

export const quotasApi = {
  getAll: (params) => api.get('/quotas', { params }).then((r) => r.data),
  getProgress: (params) => api.get('/quotas/progress', { params }).then((r) => r.data),
  upsert: (data) => api.post('/quotas', data).then((r) => r.data),
  delete: (id) => api.delete(`/quotas/${id}`).then((r) => r.data),
};

export const leaderboardApi = {
  get: (params) => api.get('/leaderboard', { params }).then((r) => r.data),
};

export const reportsApi = {
  get: (params) => api.get('/reports', { params }).then((r) => r.data),
};

export const forecastApi = {
  get: (params) => api.get('/forecast', { params }).then((r) => r.data),
};

export const searchApi = {
  query: (q) => api.get('/search', { params: { q } }).then((r) => r.data),
};
