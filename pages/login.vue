<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="login-logo-icon">⚙️</div>
        <div class="login-logo-text">AI Chat 后台管理</div>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div v-if="error" class="login-error">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAdminAuth } from '~/composables/useAdminAuth';

definePageMeta({
  layout: false
});

const { login } = useAdminAuth();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码';
    return;
  }

  loading.value = true;
  error.value = '';

  const result = await login(email.value, password.value);

  if (result.success) {
    navigateTo('/');
  } else {
    error.value = result.error;
  }

  loading.value = false;
};
</script>