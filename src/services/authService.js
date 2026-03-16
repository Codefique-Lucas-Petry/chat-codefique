import { apiFetch } from '../api/client';

export const authService = {
  async login(username, password, roomId) {
    return apiFetch('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, roomId }),
    });
  },
  async register(data) {
    return apiFetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
};