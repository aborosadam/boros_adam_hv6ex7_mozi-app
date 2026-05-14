const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('mozi_token');
}

function setToken(token) {
  localStorage.setItem('mozi_token', token);
}

function removeToken() {
  localStorage.removeItem('mozi_token');
  localStorage.removeItem('mozi_user');
}

function getUser() {
  const raw = localStorage.getItem('mozi_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
  localStorage.setItem('mozi_user', JSON.stringify(user));
}

async function apiRequest(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) throw { status: res.status, message: data.error || 'Szerverhiba' };
  return data;
}

const api = {
  get: (endpoint) => apiRequest('GET', endpoint),
  post: (endpoint, body) => apiRequest('POST', endpoint, body),
  put: (endpoint, body) => apiRequest('PUT', endpoint, body),
  delete: (endpoint) => apiRequest('DELETE', endpoint),
};

export { api, getToken, setToken, removeToken, getUser, setUser };
