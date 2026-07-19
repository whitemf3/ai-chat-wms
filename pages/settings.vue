<template>
  <div>
    <!-- 注册开关 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">注册功能</h3>
      </div>

      <div class="toggle-wrapper">
        <div
          :class="['toggle', { active: registrationEnabled }]"
          @click="toggleRegistration"
        >
          <div class="toggle-knob"></div>
        </div>
        <span>{{ registrationEnabled ? '已开放注册' : '已关闭注册' }}</span>
      </div>

      <p style="margin-top: 16px; color: #86868b; font-size: 14px;">
        关闭后，新用户将无法注册账号。管理员仍可正常登录。
      </p>
    </div>

    <!-- 网站设置 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">网站设置</h3>
      </div>

      <div class="form-group">
        <label class="form-label">网站名称</label>
        <input v-model="settings.site_name" type="text" class="form-input" />
      </div>

      <div class="form-group">
        <label class="form-label">默认模型</label>
        <select v-model="settings.default_model" class="form-input">
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">用户最大对话数</label>
        <input v-model.number="settings.max_conversations_per_user" type="number" class="form-input" />
      </div>

      <div class="form-group">
        <label class="form-label">AI 打字效果延迟 (毫秒)</label>
        <input v-model.number="settings.typing_delay" type="number" class="form-input" min="0" max="100" />
        <p class="form-hint">每个字符的显示延迟时间，0 表示禁用打字效果。建议范围：10-50ms</p>
      </div>

      <button class="btn btn-primary" @click="saveSettings" style="margin-top: 16px;">
        保存设置
      </button>
    </div>

    <!-- 操作日志 -->
    <div class="card log-card">
      <div class="card-header">
        <h3 class="card-title">操作日志</h3>
      </div>

      <!-- 日期筛选 -->
      <div class="filter-bar">
        <div class="filter-group">
          <select v-model="datePreset" class="filter-select" @change="handlePresetChange">
            <option value="1">最近一天</option>
            <option value="3">最近三天</option>
            <option value="7">最近七天</option>
            <option value="custom">自定义时间</option>
          </select>
        </div>

        <template v-if="datePreset === 'custom'">
          <div class="filter-group">
            <input
              v-model="customStartDate"
              type="date"
              class="filter-input"
              placeholder="开始日期"
            />
          </div>
          <span class="filter-separator">至</span>
          <div class="filter-group">
            <input
              v-model="customEndDate"
              type="date"
              class="filter-input"
              placeholder="结束日期"
            />
          </div>
          <button class="filter-btn" @click="searchLogs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            查询
          </button>
        </template>
      </div>

      <!-- 日志表格 - 可滚动 -->
      <div class="table-scroll-container" ref="tableContainer">
        <table class="data-table" ref="dataTable">
          <thead>
            <tr>
              <th>操作</th>
              <th>操作人</th>
              <th>目标类型</th>
              <th>IP地址</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.action }}</td>
              <td>{{ log.admin_name }}</td>
              <td>{{ log.target_type || '-' }}</td>
              <td>{{ log.ip_address || '-' }}</td>
              <td>{{ formatDate(log.created_at) }}</td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="5" class="empty-row">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <p>暂无操作日志</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="logs.length > 0" class="pagination-bar">
        <div class="pagination-info">
          共 <span class="highlight">{{ pagination.total }}</span> 条记录
        </div>
        <div class="pagination-controls">
          <select v-model.number="pagination.limit" class="pagination-select" @change="handleLimitChange">
            <option :value="10">10 条/页</option>
            <option :value="50">50 条/页</option>
            <option :value="100">100 条/页</option>
            <option :value="150">150 条/页</option>
          </select>

          <div class="pagination-btns">
            <button
              class="page-btn"
              :disabled="pagination.page <= 1"
              @click="changePage(-1)"
              title="上一页"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="page-jump">
              <span>第</span>
              <input
                v-model.number="jumpPage"
                type="number"
                class="page-input"
                min="1"
                :max="pagination.totalPages"
                @keyup.enter="handleJumpPage"
              />
              <span>/ {{ pagination.totalPages }} 页</span>
            </div>

            <button
              class="page-btn"
              :disabled="pagination.page >= pagination.totalPages"
              @click="changePage(1)"
              title="下一页"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <ConfirmDialog
      v-model:visible="dialog.confirmVisible.value"
      :type="dialog.confirmType.value"
      :message="dialog.confirmMessage.value"
      :bindings="dialog.confirmBindings.value"
      @confirm="dialog.handleConfirm"
      @cancel="dialog.handleCancel"
    />

    <!-- 顶部通知 -->
    <TopAlert
      v-model:visible="dialog.alertVisible.value"
      :type="dialog.alertType.value"
      :message="dialog.alertMessage.value"
      :duration="dialog.alertDuration.value"
      :alert-key="dialog.alertKey.value"
    />
  </div>
</template>

<script setup>
import { useAdminAuth } from '~/composables/useAdminAuth';
import { useDialog } from '~/composables/useDialog';
import { formatFull } from '~/utils/date';

definePageMeta({
  middleware: ['admin']
});

const adminAuth = useAdminAuth();
const dialog = useDialog();

// 确保初始化
onMounted(() => {
  if (!adminAuth.adminInfo) {
    adminAuth.initAuth();
  }
});

// 使用 computed 保持响应性
const isSuperAdmin = computed(() => adminAuth.adminInfo?.role === 'super_admin');
const adminInfo = computed(() => adminAuth.adminInfo);
const fetchAPI = adminAuth.fetchAPI;

const registrationEnabled = ref(true);
const settings = ref({
  site_name: 'AI Chat',
  default_model: '@cf/meta/llama-3.2-3b-instruct',
  max_conversations_per_user: 100,
  typing_delay: 15
});
const availableModels = ref([
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/meta/llama-3.2-1b-instruct',
  '@cf/qwen/qwen-2.5-72b-instruct',
  '@cf/meta/llama-3.2-11b-vision-instruct'
]);
const logs = ref([]);

// 日期筛选
const datePreset = ref('1');
const customStartDate = ref('');
const customEndDate = ref('');

// 分页 - 默认10条/页
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const jumpPage = ref(1);

// 使用统一的日期格式化函数
const formatDate = formatFull;

const getDateRange = () => {
  if (datePreset.value === 'custom') {
    return {
      start_date: customStartDate.value,
      end_date: customEndDate.value
    };
  } else {
    const days = parseInt(datePreset.value);
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
  }
};

const loadConfig = async () => {
  try {
    const response = await fetchAPI('/api/admin/config');
    const data = await response.json();
    if (data.success) {
      const config = data.data;
      registrationEnabled.value = config.registration_enabled?.value === 'true';
      settings.value = {
        site_name: config.site_name?.value || 'AI Chat',
        default_model: config.default_model?.value || '@cf/meta/llama-3.2-3b-instruct',
        max_conversations_per_user: parseInt(config.max_conversations_per_user?.value || '100'),
        typing_delay: parseInt(config.typing_delay?.value || '15')
      };
    }
  } catch (error) {
    console.error('获取配置失败:', error);
  }
};

const loadLogs = async () => {
  try {
    const dateRange = getDateRange();
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString()
    });
    if (dateRange.start_date) params.append('start_date', dateRange.start_date);
    if (dateRange.end_date) params.append('end_date', dateRange.end_date);

    const response = await fetchAPI(`/api/admin/logs?${params}`);
    const data = await response.json();
    if (data.success) {
      logs.value = data.data.logs;
      pagination.value = data.data.pagination;
      jumpPage.value = pagination.value.page;
    }
  } catch (error) {
    console.error('获取日志失败:', error);
  }
};

const handlePresetChange = () => {
  pagination.value.page = 1;
  if (datePreset.value !== 'custom') loadLogs();
};

const searchLogs = () => {
  pagination.value.page = 1;
  loadLogs();
};

const handleLimitChange = () => {
  pagination.value.page = 1;
  loadLogs();
};

const changePage = (delta) => {
  pagination.value.page += delta;
  loadLogs();
};

const handleJumpPage = () => {
  if (!jumpPage.value || jumpPage.value < 1) {
    jumpPage.value = 1;
  } else if (jumpPage.value > pagination.value.totalPages) {
    jumpPage.value = pagination.value.totalPages;
  }
  pagination.value.page = jumpPage.value;
  loadLogs();
};

const toggleRegistration = async () => {
  // 等待初始化完成
  await nextTick();

  // 权限检查 - 使用 adminInfo 直接判断
  if (!adminInfo.value || adminInfo.value.role !== 'super_admin') {
    dialog.showError('需要超级管理员权限');
    return;
  }

  const action = registrationEnabled.value ? '关闭' : '开放';
  const confirmed = await dialog.showConfirm(`确定要${action}注册功能吗？`);
  if (!confirmed) return;

  try {
    const response = await fetchAPI('/api/admin/config/registration', {
      method: 'PUT',
      body: JSON.stringify({ enabled: !registrationEnabled.value })
    });
    const data = await response.json();
    if (data.success) {
      registrationEnabled.value = !registrationEnabled.value;
      dialog.showSuccess(`注册功能已${registrationEnabled.value ? '开放' : '关闭'}`);
    } else {
      dialog.showError(data.error?.message || '操作失败');
    }
  } catch (error) {
    console.error('切换注册开关失败:', error);
    dialog.showError('操作失败');
  }
};

const saveSettings = async () => {
  // 权限检查
  if (!adminAuth.adminInfo || adminAuth.adminInfo.role !== 'super_admin') {
    dialog.showError('需要超级管理员权限');
    return;
  }

  // 验证打字延迟范围
  if (settings.value.typing_delay < 0 || settings.value.typing_delay > 100) {
    dialog.showError('打字延迟必须在 0-100 毫秒之间');
    return;
  }

  try {
    const response = await fetchAPI('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify({
        site_name: settings.value.site_name,
        default_model: settings.value.default_model,
        max_conversations_per_user: settings.value.max_conversations_per_user.toString(),
        typing_delay: settings.value.typing_delay.toString()
      })
    });
    const data = await response.json();
    if (data.success) {
      dialog.showSuccess('设置已保存');
    } else {
      dialog.showError(data.error?.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    dialog.showError('保存失败');
  }
};

onMounted(() => {
  loadConfig();
  loadLogs();
});
</script>

<style scoped>
.log-card {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 表单提示 */
.form-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #86868b;
}

.dark .form-hint {
  color: #86868b;
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-group {
  position: relative;
}

.filter-select,
.filter-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
  outline: none;
}

.dark .filter-select,
.dark .filter-input {
  background: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.filter-select {
  min-width: 120px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.filter-input {
  width: 140px;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.filter-separator {
  color: #86868b;
  font-size: 14px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  background: #0071e3;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #0077ed;
}

.filter-btn:active {
  transform: scale(0.98);
}

/* 表格滚动区域 */
.table-scroll-container {
  flex: 1;
  max-height: calc(100vh - 400px);
  min-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  scrollbar-gutter: stable;
}

.dark .table-scroll-container {
  border-color: #3a3a3c;
}

.table-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #d1d1d6;
  border-radius: 3px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a6;
}

.dark .table-scroll-container::-webkit-scrollbar-thumb {
  background: #48484a;
}

.dark .table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #636366;
}

/* 空状态 */
.empty-row {
  text-align: center;
  padding: 60px 20px !important;
  color: #86868b;
}

.empty-row svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-row p {
  margin: 0;
  font-size: 14px;
}

/* 分页栏样式 */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 0;
  border-top: 1px solid #e5e5e5;
  flex-wrap: wrap;
  gap: 16px;
}

.dark .pagination-bar {
  border-top-color: #3a3a3c;
}

.pagination-info {
  font-size: 14px;
  color: #86868b;
}

.pagination-info .highlight {
  color: #333;
  font-weight: 600;
}

.dark .pagination-info .highlight {
  color: #fff;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-select {
  height: 32px;
  padding: 0 28px 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: all 0.2s ease;
}

.dark .pagination-select {
  background-color: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.pagination-select:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.pagination-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .page-btn {
  background: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f7;
  border-color: #d1d1d6;
}

.dark .page-btn:hover:not(:disabled) {
  background: #3a3a3c;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #86868b;
}

.page-input {
  width: 50px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #333;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
}

.dark .page-input {
  background: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.page-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

/* 隐藏 number 输入的箭头 */
.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 固定表格布局 */
.table-scroll-container .data-table {
  table-layout: fixed;
  width: 100%;
}

.table-scroll-container .data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f5f5f7;
}

.dark .table-scroll-container .data-table thead {
  background: #2c2c2e;
}

.table-scroll-container .data-table th:nth-child(1),
.table-scroll-container .data-table td:nth-child(1) {
  width: 20%;
}

.table-scroll-container .data-table th:nth-child(2),
.table-scroll-container .data-table td:nth-child(2) {
  width: 15%;
}

.table-scroll-container .data-table th:nth-child(3),
.table-scroll-container .data-table td:nth-child(3) {
  width: 15%;
}

.table-scroll-container .data-table th:nth-child(4),
.table-scroll-container .data-table td:nth-child(4) {
  width: 20%;
}

.table-scroll-container .data-table th:nth-child(5),
.table-scroll-container .data-table td:nth-child(5) {
  width: 30%;
}
</style>