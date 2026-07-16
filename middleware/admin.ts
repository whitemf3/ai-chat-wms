export default defineNuxtRouteMiddleware((to) => {
  // 只在客户端执行
  if (process.server) return;

  const token = localStorage.getItem('admin_token');

  if (!token && to.path !== '/login') {
    return navigateTo('/login');
  }

  if (token && to.path === '/login') {
    return navigateTo('/');
  }
});