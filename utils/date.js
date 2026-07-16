/**
 * 日期处理工具
 * 统一处理 SQLite 日期格式，转换为北京时间显示
 */

/**
 * 将 SQLite 日期字符串转换为本地 Date 对象
 * SQLite 格式: 'YYYY-MM-DD HH:MM:SS' (UTC)
 * @param {string} dateStr - SQLite 日期字符串
 * @returns {Date|null} - Date 对象
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;

  // 已经是 ISO 格式（包含 T），去掉 Z 后处理
  if (dateStr.includes('T')) {
    // ISO 格式: 2025-07-17T10:30:45.123Z
    // 直接解析，JavaScript 会自动处理时区
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  // SQLite 格式: 'YYYY-MM-DD HH:MM:SS' (UTC)
  // 转换为 ISO 格式
  const isoStr = dateStr.replace(' ', 'T') + 'Z';
  const date = new Date(isoStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 格式化日期为本地时间字符串（北京时间）
 * @param {string} dateStr - 日期字符串
 * @param {Object} options - 格式化选项
 * @param {boolean} options.showSeconds - 是否显示秒
 * @param {boolean} options.showDate - 是否显示日期
 * @param {boolean} options.showTime - 是否显示时间
 * @returns {string} - 格式化后的日期字符串
 */
export function formatDate(dateStr, options = {}) {
  const date = parseDate(dateStr);
  if (!date) return '-';

  const {
    showSeconds = false,
    showDate = true,
    showTime = true,
  } = options;

  const dateOptions = {
    timeZone: 'Asia/Shanghai',
  };

  if (showDate && showTime) {
    return date.toLocaleString('zh-CN', {
      ...dateOptions,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
    });
  } else if (showDate) {
    return date.toLocaleDateString('zh-CN', {
      ...dateOptions,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } else if (showTime) {
    return date.toLocaleTimeString('zh-CN', {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
    });
  }

  return '-';
}

/**
 * 格式化为简短格式：月-日 时:分
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatShort(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return '-';

  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化为完整格式：年-月-日 时:分:秒
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatFull(dateStr) {
  return formatDate(dateStr, { showSeconds: true });
}

/**
 * 格式化为日期：年-月-日
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatDateOnly(dateStr) {
  return formatDate(dateStr, { showTime: false });
}

/**
 * 格式化为时间：时:分
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatTimeOnly(dateStr) {
  return formatDate(dateStr, { showDate: false });
}

/**
 * 检查日期是否已过期
 * @param {string} dateStr - 日期字符串
 * @returns {boolean}
 */
export function isExpired(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return true;
  return date < new Date();
}

/**
 * 获取相对时间描述
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
export function formatRelative(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return '-';

  const now = new Date();
  const diff = now - date; // 毫秒差
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes} 分钟前`;
  } else if (hours < 24) {
    return `${hours} 小时前`;
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    return formatShort(dateStr);
  }
}