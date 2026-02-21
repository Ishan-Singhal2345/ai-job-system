/**
 * services/auth.js — Auth API calls
 */

import api from './api';

export const authService = {
  register: (data)  => api.post('/api/auth/register', data),
  login:    (data)  => api.post('/api/auth/login', data),
  getMe:    ()      => api.get('/api/auth/me'),
  getUsers: ()      => api.get('/api/auth/users'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};
