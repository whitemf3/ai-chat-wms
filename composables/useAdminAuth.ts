import { defineStore } from 'pinia';

export const useAdminAuth = defineStore('adminAuth', () => {
  const config = useRuntimeConfig();
  const token = ref<string | null>(null);
  const adminInfo = ref<any>(null);
  const initialized = ref(false);

  // 初始化认证状态
  const initAuth = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_info');
      if (savedToken && savedAdmin) {
        token.value = savedToken;
        try {
          adminInfo.value = JSON.parse(savedAdmin);
        } catch (e) {
          console.error('Failed to parse admin_info:', e);
        }
      }
      initialized.value = true;
    }
  };

  // 更新管理员信息
  const updateAdminInfo = (info: any) => {
    adminInfo.value = info;
    if (process.client) {
      localStorage.setItem('admin_info', JSON.stringify(info));
    }
  };

  // 登录
  const login = async (email: string, password: string, turnstileToken?: string) => {
    try {
      const response = await fetch(`${config.public.apiBase}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken })
      });

      const data = await response.json();

      if (data.success) {
        token.value = data.data.token;
        adminInfo.value = data.data.admin;

        // 保存到localStorage
        if (process.client) {
          localStorage.setItem('admin_token', data.data.token);
          localStorage.setItem('admin_info', JSON.stringify(data.data.admin));
        }

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
    if (process.client) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    }
    navigateTo('/login');
  };

  // 验证登录状态
  const isAuthenticated = computed(() => !!token.value);

  // 是否是超级管理员
  const isSuperAdmin = computed(() => adminInfo.value?.role === 'super_admin');

  // API请求封装
  const fetchAPI = async (endpoint: string, options: any = {}) => {
    // 确保在客户端且 token 已初始化
    if (process.client && !initialized.value) {
      initAuth();
    }

    const url = `${config.public.apiBase}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 优先使用 store 中的 token，如果没有则从 localStorage 读取
    let currentToken = token.value;
    if (!currentToken && process.client) {
      currentToken = localStorage.getItem('admin_token');
    }
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    // 检查 401 未授权响应，立即跳转登录页
    if (response.status === 401) {
      token.value = null;
      adminInfo.value = null;
      if (process.client) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigateTo('/login');
      }
      throw new Error('Unauthorized');
    }

    // 如果返回 403，可能是权限问题，提示用户
    if (response.status === 403) {
      const data = await response.clone().json();
      console.warn('Permission denied:', data);
    }

    return response;
  };

  return {
    token,
    adminInfo,
    initialized,
    initAuth,
    updateAdminInfo,
    login,
    logout,
    isAuthenticated,
    isSuperAdmin,
    fetchAPI
  };
});