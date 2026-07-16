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
        <NuxtLink to="/models" class="nav-item" :class="{ active: $route.path === '/models' }">
          <span class="nav-icon">🤖</span>
          <span class="nav-text">模型配置</span>
        </NuxtLink>
        <NuxtLink to="/shares" class="nav-item" :class="{ active: $route.path === '/shares' }">
          <span class="nav-icon">🔗</span>
          <span class="nav-text">分享链接</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
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
          <span>{{ adminInfo?.username || '管理员' }}</span>
          <button class="logout-btn" @click="logout">退出</button>
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

const route = useRoute();
const { adminInfo, logout } = useAdminAuth();

const pageTitle = computed(() => {
  const titles = {
    '/': '仪表盘',
    '/users': '用户管理',
    '/models': '模型配置',
    '/shares': '分享链接',
    '/settings': '系统设置'
  };
  return titles[route.path] || '后台管理';
});
</script>