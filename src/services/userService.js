import { apiFetch } from '../api/client';

export const userService = {
  /**
   * Updates user profile info
   * @param {string} userId 
   * @param {object} payload { displayName, password, oldPassword, avatarUrl }
   */
  async updateProfile(userId, payload) {
    return apiFetch('/users/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        ...payload 
      })
    });
  }
};