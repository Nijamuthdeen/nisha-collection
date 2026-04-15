import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:8080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nc_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('nc_token')
      localStorage.removeItem('nc_user')
      window.location.href = '/login'
      return Promise.reject(err)
    }
    const msg = err?.response?.data?.message || err?.message || 'Something went wrong'
    toast.error(msg)
    return Promise.reject(err)
  }
)

export const authApi = {
  login:  (data) => api.post('/api/auth/login', data),
  verify: ()     => api.get('/api/auth/verify'),
}

export const productsApi = {
  getAll:       ()       => api.get('/api/products'),
  getById:      (id)     => api.get(`/api/products/${id}`),
  getByBarcode: (bc)     => api.get(`/api/products/barcode/${bc}`),
  search:       (q)      => api.get('/api/products/search', { params: { query: q } }),
  getLowStock:  ()       => api.get('/api/products/low-stock'),
  create:       (data)   => api.post('/api/products', data),
  update:       (id, d)  => api.put(`/api/products/${id}`, d),
  delete:       (id)     => api.delete(`/api/products/${id}`),
}

export const invoicesApi = {
  getAll:         ()      => api.get('/api/invoices'),
  getById:        (id)    => api.get(`/api/invoices/${id}`),
  getByNumber:    (no)    => api.get(`/api/invoices/number/${no}`),
  getByDateRange: (f, t)  => api.get('/api/invoices/filter', { params: { from: f, to: t } }),
  create:         (data)  => api.post('/api/invoices', data),
}

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard'),
}

// Always return a safe array regardless of API response shape
export function ensureArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.content && Array.isArray(data.content)) return data.content
  return []
}

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default api
