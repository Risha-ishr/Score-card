const BASE = import.meta.env.VITE_API_URL + '/api';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token')
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {})
});

async function request(url, opts = {}) {
  const res  = await fetch(BASE + url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Request failed');
  return data;
}

export const login = (username, password) =>
  request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

export const getParameters = () =>
  request('/admin/parameters', { headers: headers() });

export const getEmployees = (search = '') =>
  request(`/admin/employees${search ? `?search=${encodeURIComponent(search)}` : ''}`, { headers: headers() });

export const getEmployeeScorecard = (id) =>
  request(`/admin/employees/${id}/scorecard`, { headers: headers() });

export const saveEmployeeScorecard = (id, body) =>
  request(`/admin/employees/${id}/scorecard`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  });

export const addCandidate = (name, email) =>
  request('/admin/employees', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, email })
  });

export const uploadExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request('/admin/upload-excel', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: form
  });
};

export const getMyScorecard = () =>
  request('/employee/scorecard', { headers: headers() });
