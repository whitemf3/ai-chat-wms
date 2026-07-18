<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
        <div :class="['dialog-container', { 'dialog-wide': bindings }]" @click.stop>
          <!-- Icon -->
          <div :class="['dialog-icon', type]">
            <svg v-if="type === 'confirm'" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else-if="type === 'error'" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="type === 'success'" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Message -->
          <div class="dialog-message">{{ message }}</div>

          <!-- Bindings List -->
          <div v-if="bindings" class="bindings-container">
            <div v-if="bindings.rules && bindings.rules.length > 0" class="binding-group">
              <div class="binding-group-header">
                <span class="binding-group-icon">📋</span>
                <span class="binding-group-title">选择规则</span>
                <span class="binding-count">{{ bindings.rules.length }}</span>
              </div>
              <div class="binding-list">
                <div v-for="rule in bindings.rules" :key="rule.id" class="binding-item">
                  <span class="binding-dot"></span>
                  <span class="binding-name">{{ rule.name }}</span>
                </div>
              </div>
            </div>

            <div v-if="bindings.workflows && bindings.workflows.length > 0" class="binding-group">
              <div class="binding-group-header">
                <span class="binding-group-icon">🔄</span>
                <span class="binding-group-title">AI工作流</span>
                <span class="binding-count">{{ bindings.workflows.length }}</span>
              </div>
              <div class="binding-list">
                <div v-for="workflow in bindings.workflows" :key="workflow.id" class="binding-item">
                  <span class="binding-dot"></span>
                  <span class="binding-name">{{ workflow.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="dialog-buttons">
            <button
              v-if="type === 'confirm'"
              class="dialog-btn cancel"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              class="dialog-btn confirm"
              @click="handleConfirm"
            >
              {{ type === 'confirm' ? '确定' : '关闭' }}
            </button>
          </div>
        </div>
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
  bindings: {
    type: Object,
    default: null,
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    emit('update:visible', false);
    if (props.type === 'confirm') {
      emit('cancel');
    }
  }
};

const handleConfirm = () => {
  emit('update:visible', false);
  emit('confirm');
};

const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.dialog-wide {
  max-width: 480px;
}

.dark .dialog-container {
  background: #2a2b32;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.dialog-icon.confirm {
  background: rgba(251, 191, 36, 0.15);
  color: #f59e0b;
}

.dialog-icon.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.dialog-icon.success {
  background: rgba(16, 163, 127, 0.15);
  color: #10a37f;
}

.dialog-icon.info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.dialog-message {
  font-size: 15px;
  line-height: 1.6;
  color: #202123;
  margin-bottom: 20px;
}

.dark .dialog-message {
  color: #ececf1;
}

/* Bindings Container */
.bindings-container {
  margin-bottom: 20px;
  text-align: left;
}

.binding-group {
  margin-bottom: 16px;
}

.binding-group:last-child {
  margin-bottom: 0;
}

.binding-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f5f5f7;
  border-radius: 8px;
  margin-bottom: 8px;
}

.dark .binding-group-header {
  background: #3a3a3c;
}

.binding-group-icon {
  font-size: 16px;
}

.binding-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .binding-group-title {
  color: #f5f5f7;
}

.binding-count {
  margin-left: auto;
  padding: 2px 8px;
  background: #007aff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

.binding-list {
  padding-left: 12px;
}

.binding-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.binding-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #86868b;
  flex-shrink: 0;
}

.binding-name {
  font-size: 14px;
  color: #333;
}

.dark .binding-name {
  color: #d1d1d6;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 80px;
}

.dialog-btn.cancel {
  background: #f4f4f4;
  color: #6e6e80;
}

.dialog-btn.cancel:hover {
  background: #e4e4e4;
}

.dark .dialog-btn.cancel {
  background: #444654;
  color: #b4b4b4;
}

.dark .dialog-btn.cancel:hover {
  background: #545563;
}

.dialog-btn.confirm {
  background: #10a37f;
  color: white;
}

.dialog-btn.confirm:hover {
  background: #0d8a6a;
}

/* Transition */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-container,
.dialog-leave-to .dialog-container {
  transform: scale(0.95);
}
</style>