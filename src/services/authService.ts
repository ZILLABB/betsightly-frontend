import { API_BASE_URL } from '../config/apiConfig';
import { User } from '../contexts/AuthContext';

export const login = async (username: string, password: string): Promise<{ user: User; access_token: string }> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
  }

  return response.json();
};

export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to get user data.');
  }

  return response.json();
};

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.valid;
  } catch {
    return false;
  }
};

export default { login, getCurrentUser, verifyToken };
