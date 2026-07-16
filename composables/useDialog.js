import { ref } from 'vue';

// 确认弹窗状态
const confirmVisible = ref(false);
const confirmType = ref('confirm');
const confirmMessage = ref('');
let resolvePromise = null;

// 顶部通知状态
const alertVisible = ref(false);
const alertType = ref('info');
const alertMessage = ref('');
const alertDuration = ref(3000);

// 显示确认弹窗（需要用户手动确认）
const showConfirm = (msg) => {
  confirmMessage.value = msg;
  confirmType.value = 'confirm';
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

// 显示顶部通知（自动消失）
const showAlert = (msg, type = 'info', duration = 3000) => {
  alertMessage.value = msg;
  alertType.value = type;
  alertDuration.value = duration;
  alertVisible.value = true;
};

// 成功通知
const showSuccess = (msg, duration = 3000) => {
  showAlert(msg, 'success', duration);
};

// 错误通知
const showError = (msg, duration = 3000) => {
  showAlert(msg, 'error', duration);
};

// 警告通知
const showWarning = (msg, duration = 3000) => {
  showAlert(msg, 'warning', duration);
};

// 信息通知
const showInfo = (msg, duration = 3000) => {
  showAlert(msg, 'info', duration);
};

export const useDialog = () => {
  return {
    // 确认弹窗
    confirmVisible,
    confirmType,
    confirmMessage,
    showConfirm,
    handleConfirm,
    handleCancel,
    // 顶部通知
    alertVisible,
    alertType,
    alertMessage,
    alertDuration,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};