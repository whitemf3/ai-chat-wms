<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        ⚙️ 后台管理
      </div>
      <nav class="sidebar-nav">
        <NuxtLink to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">📊</span>
          <span class="nav-text">仪表盘</span>
        </NuxtLink>
        <NuxtLink to="/users" class="nav-item" :class="{ active: $route.path === '/users' }">
          <span class="nav-icon">👥</span>
          <span class="nav-text">用户管理</span>
        </NuxtLink>
        <NuxtLink to="/quota" class="nav-item" :class="{ active: $route.path === '/quota' }">
          <span class="nav-icon">📈</span>
          <span class="nav-text">额度管理</span>
        </NuxtLink>
        <NuxtLink to="/models" class="nav-item" :class="{ active: $route.path === '/models' }">
          <span class="nav-icon">🤖</span>
          <span class="nav-text">模型配置</span>
        </NuxtLink>
        <NuxtLink to="/workflows" class="nav-item" :class="{ active: $route.path === '/workflows' }">
          <span class="nav-icon">🔄</span>
          <span class="nav-text">AI工作流</span>
        </NuxtLink>
        <NuxtLink to="/shares" class="nav-item" :class="{ active: $route.path === '/shares' }">
          <span class="nav-icon">🔗</span>
          <span class="nav-text">分享链接</span>
        </NuxtLink>
        <NuxtLink v-if="isSuperAdmin" to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">系统设置</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-user">
          <div class="user-avatar">{{ adminInfo?.username?.charAt(0)?.toUpperCase() || 'A' }}</div>
          <div class="user-info">
            <span class="user-name">{{ adminInfo?.username || '管理员' }}</span>
            <span v-if="adminInfo?.role" class="user-role" :class="adminInfo.role">{{ getRoleName(adminInfo.role) }}</span>
          </div>
          <button class="logout-btn" @click="logout" title="退出登录">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminAuth } from '~/composables/useAdminAuth';
import { useDialog } from '~/composables/useDialog';

const route = useRoute();
const { adminInfo, logout, initAuth, isSuperAdmin } = useAdminAuth();
const { alertVisible, closeAlert } = useDialog();

// 确保在客户端初始化
onMounted(() => {
  initAuth();
});

// 路由切换时关闭顶部弹窗
watch(() => route.path, () => {
  if (alertVisible.value) {
    closeAlert();
  }
});

const pageTitle = computed(() => {
  const titles = {
    '/': '仪表盘',
    '/users': '用户管理',
    '/quota': '额度管理',
    '/models': '模型配置',
    '/workflows': 'AI工作流',
    '/shares': '分享链接',
    '/settings': '系统设置'
  };
  return titles[route.path] || '后台管理';
});

const getRoleName = (role) => {
  const names = {
    'user': '普通用户',
    'admin': '管理员',
    'super_admin': '超级管理员'
  };
  return names[role] || '管理员';
};
</script>