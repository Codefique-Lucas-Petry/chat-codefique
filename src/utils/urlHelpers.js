import { BASE_URL } from '../api/client';

export const addNgrokBypass = (url) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}ngrok-skip-browser-warning=1`;
};

export const normalizeFileUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  let url = value.startsWith('http') ? value : `${BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
  return addNgrokBypass(url);
};

export const formatAvatarUrl = (path) => {
  if (!path) return 'https://ui-avatars.com/api/?name=User&background=random';
  return normalizeFileUrl(path.trim());
};