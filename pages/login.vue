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

        <!-- Turnstile widget -->
        <div class="turnstile-wrapper">
          <div class="cf-turnstile" data-sitekey="0x4AAAAAAD_yxEkCTD6muHx5" data-action="turnstile-spin-v2"></div>
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

// Load Turnstile script
useHead({
  script: [
    {
      src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
      async: true,
      defer: true,
    },
  ],
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

  // Get Turnstile token
  const turnstileToken = document.querySelector('input[name="cf-turnstile-response"]')?.value;
  if (!turnstileToken) {
    error.value = '请完成人机验证';
    return;
  }

  loading.value = true;
  error.value = '';

  const result = await login(email.value, password.value, turnstileToken);

  if (result.success) {
    navigateTo('/');
  } else {
    error.value = result.error;
    // Reset Turnstile widget on failure
    if (window.turnstile) {
      window.turnstile.reset();
    }
  }

  loading.value = false;
};
</script>

<style scoped>
.turnstile-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.dark .turnstile-wrapper iframe {
  color-scheme: dark;
}
</style>