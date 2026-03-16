import { apiFetch } from '../api/client';

export const chatService = {
  /**
   * Fetches the message history for a specific room.
   * @param {string} roomId 
   * @returns {Promise<{messages: Array}>}
   */
  async getMessages(roomId) {
    try {
      return await apiFetch(`/rooms/${roomId}/messages`);
    } catch (error) {
      console.error(`Failed to fetch messages for room ${roomId}:`, error);
      return { messages: [] }; // Return fallback to prevent UI crash
    }
  },

  /**
   * Fetches the list of active participants in a room.
   * @param {string} roomId 
   * @returns {Promise<{participants: Array}>}
   */
  async getParticipants(roomId) {
    try {
      return await apiFetch(`/rooms/${roomId}/participants`);
    } catch (error) {
      console.error(`Failed to fetch participants for room ${roomId}:`, error);
      return { participants: [] }; // Return fallback to prevent UI crash
    }
  }
};