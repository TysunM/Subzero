// API client for SubZero backend
const API_BASE_URL = 'http://localhost:5000/api';

// Demo data for when backend is not available
const DEMO_DATA = {
  user: {
    id: 'demo-user-123',
    email: 'demo@subzero.com',
    first_name: 'Demo',
    last_name: 'User',
    created_at: '2024-01-01T00:00:00Z'
  },
  subscriptions: [
    {
      id: '1',
      merchant_name: 'Netflix',
      service_name: 'Netflix Premium',
      amount: 15.99,
      billing_cycle: 'monthly',
      category: 'entertainment',
      status: 'active',
      next_billing_date: '2024-07-15',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      merchant_name: 'Spotify',
      service_name: 'Spotify Premium',
      amount: 9.99,
      billing_cycle: 'monthly',
      category: 'entertainment',
      status: 'active',
      next_billing_date: '2024-07-10',
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: '3',
      merchant_name: 'Adobe',
      service_name: 'Creative Cloud',
      amount: 52.99,
      billing_cycle: 'monthly',
      category: 'productivity',
      status: 'active',
      next_billing_date: '2024-07-20',
      created_at: '2024-03-01T00:00:00Z'
    }
  ],
  analytics: {
    total_monthly_spend: 78.97,
    total_annual_spend: 947.64,
    subscription_count: 3,
    potential_savings: 25.99,
    category_breakdown: {
      entertainment: { amount: 25.98, count: 2 },
      productivity: { amount: 52.99, count: 1 }
    },
    upcoming_bills: [
      {
        subscription_id: '2',
        service_name: 'Spotify Premium',
        amount: 9.99,
        billing_date: '2024-07-10',
        days_until: 3
      },
      {
        subscription_id: '1',
        service_name: 'Netflix Premium',
        amount: 15.99,
        billing_date: '2024-07-15',
        days_until: 8
      }
    ]
  },
  categories: [
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'fitness', name: 'Fitness & Health' },
    { id: 'news', name: 'News & Media' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'utilities', name: 'Utilities' }
  ],
  cancellationStats: {
    total_requests: 5,
    completed_requests: 4,
    pending_requests: 1,
    success_rate: 80,
    total_annual_savings: 240.00
  }
};

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('subzero_token');
    this.demoMode = true; // Enable demo mode for frontend testing
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('subzero_token', token);
    } else {
      localStorage.removeItem('subzero_token');
    }
  }

  async request(endpoint, options = {}) {
    // In demo mode, return mock data
    if (this.demoMode) {
      return this.getMockResponse(endpoint, options);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  getMockResponse(endpoint, options) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/auth/login' || endpoint === '/auth/register') {
          resolve({
            access_token: 'demo-token-123',
            user: DEMO_DATA.user
          });
        } else if (endpoint === '/auth/profile') {
          resolve({ user: DEMO_DATA.user });
        } else if (endpoint === '/subscriptions') {
          resolve({ subscriptions: DEMO_DATA.subscriptions });
        } else if (endpoint === '/subscriptions/analytics') {
          resolve(DEMO_DATA.analytics);
        } else if (endpoint === '/subscriptions/categories') {
          resolve({ categories: DEMO_DATA.categories });
        } else if (endpoint === '/cancellations/stats') {
          resolve(DEMO_DATA.cancellationStats);
        } else if (endpoint.startsWith('/subscriptions/') && endpoint.endsWith('/cancel')) {
          resolve({ message: 'Cancellation request initiated', request_id: 'demo-cancel-123' });
        } else if (options.method === 'POST' && endpoint === '/subscriptions') {
          const newSub = {
            id: Date.now().toString(),
            ...JSON.parse(options.body),
            status: 'active',
            created_at: new Date().toISOString()
          };
          DEMO_DATA.subscriptions.push(newSub);
          resolve(newSub);
        } else {
          resolve({ message: 'Demo response' });
        }
      }, 300); // Simulate network delay
    });
  }

  // Authentication
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Subscriptions
  async getSubscriptions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/subscriptions?${params}`);
  }

  async getSubscription(id) {
    return this.request(`/subscriptions/${id}`);
  }

  async createSubscription(subscriptionData) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async updateSubscription(id, subscriptionData) {
    return this.request(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }

  async cancelSubscription(id, requestData = {}) {
    return this.request(`/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getSubscriptionCategories() {
    return this.request('/subscriptions/categories');
  }

  async getSubscriptionAnalytics() {
    return this.request('/subscriptions/analytics');
  }

  // Financial Accounts
  async getAccounts() {
    return this.request('/accounts');
  }

  async linkAccount(accountData) {
    return this.request('/accounts/link', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async syncAccount(id) {
    return this.request(`/accounts/${id}/sync`, {
      method: 'POST',
    });
  }

  async getAccountTransactions(id, params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/accounts/${id}/transactions?${queryParams}`);
  }

  // Cancellations
  async getCancellations(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/cancellations?${params}`);
  }

  async getCancellationStats() {
    return this.request('/cancellations/stats');
  }

  async retryCancellation(id) {
    return this.request(`/cancellations/${id}/retry`, {
      method: 'POST',
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const apiClient = new ApiClient();

