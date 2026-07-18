export default defineNuxtPlugin(() => {
  // 只在客户端执行
  if (process.client) {
    const adminAuth = useAdminAuth();
    adminAuth.initAuth();
  }
});