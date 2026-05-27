const API = {
  getToken() {
    return localStorage.getItem('aa_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('aa_token', token);
    else localStorage.removeItem('aa_token');
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('aa_user') || 'null');
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('aa_user', JSON.stringify(user));
    else localStorage.removeItem('aa_user');
  },
  clearAuth() {
    this.setToken(null);
    this.setUser(null);
  },
  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
    return data;
  },
  auth: {
    register: (body) => API.request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => API.request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => API.request('/api/auth/me'),
    forgot: (email) =>
      API.request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    reset: (token, password) =>
      API.request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
    google: (id_token) => API.request('/api/auth/google', { method: 'POST', body: JSON.stringify({ id_token }) }),
  },
  projects: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.request(`/api/projects${q ? `?${q}` : ''}`);
    },
    adminList: () => API.request('/api/projects/admin/all'),
    create: (formData) =>
      API.request('/api/projects', { method: 'POST', body: formData, headers: {} }),
    update: (id, formData) =>
      API.request(`/api/projects/${id}`, { method: 'PUT', body: formData, headers: {} }),
    remove: (id) => API.request(`/api/projects/${id}`, { method: 'DELETE' }),
  },
  payments: {
    config: () => API.request('/api/payments/config'),
    checkout: (projectIds) =>
      API.request('/api/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ projectIds }),
      }),
  },
  config: () => API.request('/api/config'),
};

window.API = API;
