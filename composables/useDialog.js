import { ref, nextTick } from 'vue';

// 确认弹窗状态
const confirmVisible = ref(false);
const confirmType = ref('confirm');
const confirmMessage = ref('');
const confirmBindings = ref(null);
let resolvePromise = null;

// 顶部通知状态
const alertVisible = ref(false);
const alertType = ref('info');
const alertMessage = ref('');
const alertDuration = ref(3000);
const alertKey = ref(0); // 用于强制重新渲染

// 定时器引用（全局管理，避免组件销毁时丢失）
let alertTimer = null;

// 清除定时器
const clearAlertTimer = () => {
  if (alertTimer) {
    clearTimeout(alertTimer);
    alertTimer = null;
  }
};

// 关闭通知
const closeAlert = () => {
  clearAlertTimer();
  alertVisible.value = false;
};

// 显示顶部通知（自动消失）
const showAlert = async (msg, type = 'info', duration = 3000) => {
  // 如果当前有弹窗显示，先关闭它
  if (alertVisible.value) {
    clearAlertTimer();
    alertVisible.value = false;
    // 等待关闭动画完成
    await nextTick();
    // 短暂延迟确保动画完成
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // 显示新弹窗
  alertMessage.value = msg;
  alertType.value = type;
  alertDuration.value = duration;
  alertKey.value++; // 更新 key 强制重新渲染
  alertVisible.value = true;

  // 设置自动关闭定时器（在 composable 中管理，不依赖组件生命周期）
  if (duration > 0) {
    alertTimer = setTimeout(() => {
      alertVisible.value = false;
      alertTimer = null;
    }, duration);
  }
};

// 成功通知
const showSuccess = (msg, duration = 3000) => {
  return showAlert(msg, 'success', duration);
};

// 错误通知
const showError = (msg, duration = 3000) => {
  return showAlert(msg, 'error', duration);
};

// 警告通知
const showWarning = (msg, duration = 3000) => {
  return showAlert(msg, 'warning', duration);
};

// 信息通知
const showInfo = (msg, duration = 3000) => {
  return showAlert(msg, 'info', duration);
};

// 显示确认弹窗（需要用户手动确认）
const showConfirm = (msg, bindings = null) => {
  confirmMessage.value = msg;
  confirmType.value = 'confirm';
  confirmBindings.value = bindings;
  confirmVisible.value = true;

  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
};

// 显示绑定信息弹窗（只有关闭按钮）
const showBindings = (msg, bindings) => {
  confirmMessage.value = msg;
  confirmType.value = 'info';
  confirmBindings.value = bindings;
  confirmVisible.value = true;

  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
};

// 处理确认
const handleConfirm = () => {
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
};

// 处理取消
const handleCancel = () => {
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

export const useDialog = () => {
  return {
    // 确认弹窗
    confirmVisible,
    confirmType,
    confirmMessage,
    confirmBindings,
    showConfirm,
    showBindings,
    handleConfirm,
    handleCancel,
    // 顶部通知
    alertVisible,
    alertType,
    alertMessage,
    alertDuration,
    alertKey,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
  };
};