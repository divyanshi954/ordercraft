import axios from 'axios';

// Base URL uses Vite proxy '/api' by default or VITE_API_URL if configured
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ordercraft_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid infinite redirects on login failures
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('ordercraft_token');
        localStorage.removeItem('ordercraft_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper for extracting error message
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  return error?.response?.data?.message || error?.message || fallback;
};

// API Endpoints Matching OrderCraft Backend
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const customerApi = {
  getCustomers: (search = '', page = 0, size = 10) =>
    api.get('/customers', { params: { search: search || undefined, page, size } }),
  getAllCustomers: () => api.get('/customers/all'),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (customer) => api.post('/customers', customer),
  updateCustomer: (id, customer) => api.put(`/customers/${id}`, customer),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

export const productApi = {
  getProducts: (search = '', page = 0, size = 10) =>
    api.get('/products', { params: { search: search || undefined, page, size } }),
  getAllProducts: () => api.get('/products/all'),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (product) => api.post('/products', product),
  updateProduct: (id, product) => api.put(`/products/${id}`, product),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const materialApi = {
  getMaterials: (search = '', page = 0, size = 10) =>
    api.get('/materials', { params: { search: search || undefined, page, size } }),
  getAllMaterials: () => api.get('/materials/all'),
  getLowStockMaterials: () => api.get('/materials/low-stock'),
  getMaterial: (id) => api.get(`/materials/${id}`),
  createMaterial: (material) => api.post('/materials', material),
  updateMaterial: (id, material) => api.put(`/materials/${id}`, material),
  deleteMaterial: (id) => api.delete(`/materials/${id}`),
};

export const supplierApi = {
  getSuppliers: (search = '', page = 0, size = 10) =>
    api.get('/suppliers', { params: { search: search || undefined, page, size } }),
  getAllSuppliers: () => api.get('/suppliers/all'),
  getSupplier: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (supplier) => api.post('/suppliers', supplier),
  updateSupplier: (id, supplier) => api.put(`/suppliers/${id}`, supplier),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
};

export const bomApi = {
  getBoms: () => api.get('/boms'),
  getBom: (id) => api.get(`/boms/${id}`),
  getActiveBomForProduct: (productId) => api.get(`/boms/product/${productId}/active`),
  createBom: (request) => api.post('/boms', request),
  updateBom: (id, request) => api.put(`/boms/${id}`, request),
  deleteBom: (id) => api.delete(`/boms/${id}`),
};

export const salesOrderApi = {
  getSalesOrders: (search = '', page = 0, size = 10) =>
    api.get('/sales-orders', { params: { search: search || undefined, page, size } }),
  getSalesOrder: (id) => api.get(`/sales-orders/${id}`),
  createSalesOrder: (request) => api.post('/sales-orders', request),
  confirmSalesOrder: (id) => api.post(`/sales-orders/${id}/confirm`, {}),
  checkMaterials: (id) => api.post(`/sales-orders/${id}/check-materials`, {}),
  getMaterialRequirementsPreview: (id) => api.get(`/sales-orders/${id}/material-requirements`),
  startProductionFromOrder: (id) => api.post(`/sales-orders/${id}/start-production`, {}),
  cancelSalesOrder: (id) => api.post(`/sales-orders/${id}/cancel`, {}),
};

export const purchaseOrderApi = {
  getPurchaseOrders: (search = '', page = 0, size = 10) =>
    api.get('/purchase-orders', { params: { search: search || undefined, page, size } }),
  getPurchaseOrder: (id) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (request) => api.post('/purchase-orders', request),
  markPurchaseOrderOrdered: (id) => api.post(`/purchase-orders/${id}/order`, {}),
  receivePurchaseOrder: (id) => api.post(`/purchase-orders/${id}/receive`, {}),
  cancelPurchaseOrder: (id) => api.post(`/purchase-orders/${id}/cancel`, {}),
};

export const productionOrderApi = {
  getProductionOrders: (search = '', page = 0, size = 10) =>
    api.get('/production-orders', { params: { search: search || undefined, page, size } }),
  getProductionOrder: (id) => api.get(`/production-orders/${id}`),
  planProduction: (request) => api.post('/production-orders', request),
  startProduction: (id) => api.post(`/production-orders/${id}/start`, {}),
  completeProduction: (id) => api.post(`/production-orders/${id}/complete`, {}),
};

export const invoiceApi = {
  getInvoices: (search = '', page = 0, size = 10) =>
    api.get('/invoices', { params: { search: search || undefined, page, size } }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  generateInvoice: (request) => api.post('/invoices', request),
  cancelInvoice: (id) => api.post(`/invoices/${id}/cancel`, {}),
};

export const paymentApi = {
  getPayments: (search = '', page = 0, size = 10) =>
    api.get('/payments', { params: { search: search || undefined, page, size } }),
  getPaymentsByInvoice: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
  recordPayment: (request) => api.post('/payments', request),
};

export const dashboardApi = {
  getDashboardSummary: () => api.get('/dashboard'),
};

export default api;
