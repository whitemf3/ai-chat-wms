export default defineNuxtRouteMiddleware(async (to) => {
  // 只在客户端执行
  if (process.server) return;

  const token = localStorage.getItem('admin_token');
  const adminInfo = localStorage.getItem('admin_info');

  // 未登录且访问非登录页，跳转到登录页
  if (!token && to.path !== '/login') {
    return navigateTo('/login');
  }

  // 已登录且访问登录页，跳转到首页
  if (token && to.path === '/login') {
    return navigateTo('/');
  }

  // 如果有 token，初始化 store
  if (token && adminInfo) {
    const adminAuth = useAdminAuth();
    if (!adminAuth.initialized) {
      adminAuth.initAuth();
    }
  }
});