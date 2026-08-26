import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to extract data and normalize errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.error?.details || null
    };
    return Promise.reject(customError);
  }
);

// 1. Dashboard API
export const dashboardApi = {
  getSummary: (params) => apiClient.get('/dashboard/summary', { params })
};

// 2. Business Analytics API
export const analyticsApi = {
  getSales: (params) => apiClient.get('/analytics/sales', { params }),
  getRevenueAtRisk: (params) => apiClient.get('/analytics/revenue-at-risk', { params }),
  getBusinessHealth: (params) => apiClient.get('/analytics/business-health', { params })
};

// 3. Deterministic Anomaly Detection API
export const detectionApi = {
  getAll: () => apiClient.get('/detections/all'),
  getPaymentSpikes: () => apiClient.get('/detections/payment-spikes'),
  getRefundSpikes: () => apiClient.get('/detections/refund-spikes'),
  getStockoutRisks: () => apiClient.get('/detections/stockout-risks'),
  getDemandSurges: () => apiClient.get('/detections/demand-surges'),
  getRegionalDelays: () => apiClient.get('/detections/regional-delays')
};

// 4. Payments API
export const paymentsApi = {
  getPayments: (params) => apiClient.get('/payments', { params }),
  getSummary: (params) => apiClient.get('/payments/summary', { params }),
  getFailureTrends: (params) => apiClient.get('/payments/failures/trend', { params })
};

// 5. Orders API
export const ordersApi = {
  getOrders: (params) => apiClient.get('/orders', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  getSummary: (params) => apiClient.get('/orders/summary', { params })
};

// 6. Inventory API
export const inventoryApi = {
  getInventory: (params) => apiClient.get('/inventory', { params }),
  getLowStock: () => apiClient.get('/inventory/low-stock'),
  getStockoutRisk: () => apiClient.get('/inventory/stockout-risk'),
  getHealthSummary: () => apiClient.get('/inventory/health-summary')
};

// 7. Customers API
export const customersApi = {
  getCustomers: (params) => apiClient.get('/customers', { params }),
  getCustomerById: (id) => apiClient.get(`/customers/${id}`),
  getAtRisk: () => apiClient.get('/customers/at-risk')
};

// 8. Products API
export const productsApi = {
  getProducts: (params) => apiClient.get('/products', { params }),
  getProductById: (id) => apiClient.get(`/products/${id}`),
  getPerformance: (params) => apiClient.get('/products/performance', { params })
};

// 8.1 Categories API
export const categoriesApi = {
  getCategories: () => apiClient.get('/categories')
};

// 9. Refunds API
export const refundsApi = {
  getRefunds: (params) => apiClient.get('/refunds', { params }),
  getSummary: (params) => apiClient.get('/refunds/summary', { params }),
  getTrends: (params) => apiClient.get('/refunds/trends', { params })
};

// 10. Health API
export const healthApi = {
  getHealth: () => apiClient.get('/health')
};

// 11. Intelligence & Reasoning API
export const intelligenceApi = {
  getOverview: (params) => apiClient.get('/intelligence/overview', { params }),
  getInsights: (params) => apiClient.get('/intelligence/insights', { params }),
  getInsightById: (id) => apiClient.get(`/intelligence/insights/${id}`),
  getAnomalies: (params) => apiClient.get('/intelligence/anomalies', { params }),
  getRisks: (params) => apiClient.get('/intelligence/risks', { params }),
  getBusinessHealth: (params) => apiClient.get('/intelligence/business-health', { params })
};

// 12. AI Autonomous Agent, Policy & Simulator API
export const aiApi = {
  chat: (payload) => apiClient.post('/ai/chat', payload),
  getProposals: (params) => apiClient.get('/ai/proposals', { params }),
  getProposalById: (id) => apiClient.get(`/ai/proposals/${id}`),
  approveProposal: (id, payload) => apiClient.post(`/ai/proposals/${id}/approve`, payload || {}),
  rejectProposal: (id, payload) => apiClient.post(`/ai/proposals/${id}/reject`, payload || {}),
  getAuditLogs: (params) => apiClient.get('/ai/audit-logs', { params }),
  simulatePrice: (payload) => apiClient.post('/ai/simulate/price', payload),
  simulateReorder: (payload) => apiClient.post('/ai/simulate/reorder', payload),
  simulateRestock: (payload) => apiClient.post('/ai/simulations/restock', payload)
};

// 13. Phase 5 Action Orchestration & Governance API
export const actionsApi = {
  getActions: (params) => apiClient.get('/ai/actions', { params }),
  getActionById: (id) => apiClient.get(`/ai/actions/${id}`),
  proposeAction: (payload) => apiClient.post('/ai/actions', payload),
  approveAction: (id, payload) => apiClient.post(`/ai/actions/${id}/approve`, payload || {}),
  rejectAction: (id, payload) => apiClient.post(`/ai/actions/${id}/reject`, payload || {}),
  executeAction: (id, payload) => apiClient.post(`/ai/actions/${id}/execute`, payload || {}),
  cancelAction: (id, payload) => apiClient.post(`/ai/actions/${id}/cancel`, payload || {}),
  getActionTimeline: (id) => apiClient.get(`/ai/actions/${id}/audit`),
  simulateRestock: (payload) => apiClient.post('/ai/simulations/restock', payload)
};

export default apiClient;
