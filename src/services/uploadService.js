import { BASE_URL, DEFAULT_HEADERS, apiFetch } from '../api/client';

export const uploadService = {
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/uploads/avatar`, { 
      method: 'POST', 
      headers: DEFAULT_HEADERS, 
      body: formData 
    });
    if (!response.ok) throw new Error('Avatar upload failed');
    return response.json();
  },
  async uploadChatFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/uploads/chat`, { 
      method: 'POST', 
      headers: DEFAULT_HEADERS, 
      body: formData 
    });
    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  }
};