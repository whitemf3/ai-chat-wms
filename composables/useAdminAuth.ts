import { defineStore } from 'pinia';

export const useAdminAuth = defineStore('adminAuth', () => {
  const config = useRuntimeConfig();
  const token = ref(null);
  const adminInfo = ref(null);

  // 初始化时立即恢复状态（客户端）
  const initAuth = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_info');
      if (savedToken && savedAdmin) {
        token.value = savedToken;
        adminInfo.value = JSON.parse(savedAdmin);
      }
    }
  };

  // 立即初始化
  initAuth();

  // 登录
  const login = async (email, password) => {
    try {
      const response = await fetch(`${config.public.apiBase}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        token.value = data.data.token;
        adminInfo.value = data.data.admin;

        // 保存到localStorage
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_info', JSON.stringify(data.data.admin));

        return { success: true };
      } else {
        return { success: false, error: data.error.message };
      }
    } catch (error) {
      return { success: false, error: '网络错误，请重试' };
    }
  };

  // 登出
  const logout = async () => {
    token.value = null;
    adminInfo.value = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigateTo('/login');
  };

  // 验证登录状态
  const isAuthenticated = computed(() => !!token.value);

  // API请求封装
  const fetchAPI = async (endpoint, options = {}) => {
    // 确保 token 已初始化
    if (!token.value && process.client) {
      initAuth();
    }

    const url = `${config.public.apiBase}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(token.value && { Authorization: `Bearer ${token.value}` }),
    };
    return fetch(url, { ...options, headers });
  };

  return {
    token,
    adminInfo,
    login,
    logout,
    isAuthenticated,
    fetchAPI
  };
});