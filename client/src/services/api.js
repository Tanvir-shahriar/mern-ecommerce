import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const apiErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';

export const mediaUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;
  return url;
};
