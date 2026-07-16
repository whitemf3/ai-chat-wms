<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="visible" :class="['top-alert', type]">
        <div class="alert-content">
          <span class="alert-icon">
            <svg v-if="type === 'warning'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-2a1 1 0 01-1-1V9a1 1 0 112 0v1a1 1 0 01-1 1z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="type === 'error'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="type === 'success'" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </span>
          <span class="alert-message">{{ message }}</span>
        </div>
        <button class="alert-close" @click="close">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'info',
  },
  message: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(['update:visible', 'close']);

let timer = null;

watch(() => props.visible, (val) => {
  if (val && props.duration > 0) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
});

const close = () => {
  clearTimeout(timer);
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.top-alert {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.top-alert.warning {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
}

.top-alert.error {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: #7f1d1d;
}

.top-alert.success {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: #064e3b;
}

.top-alert.info {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: #1e3a5f;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-message {
  line-height: 1.4;
}

.alert-close {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Transition */
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>