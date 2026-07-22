<template>
  <div>
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">用户额度管理</h2>
      <div class="page-actions">
        <select v-model="filterType" class="form-input filter-select">
          <option value="all">全部用户</option>
          <option value="limited">有限额用户</option>
          <option value="unlimited">无限制用户</option>
          <option value="exceeded">今日已超限</option>
        </select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayTotalNeurons.toLocaleString() }}</div>
        <div class="stat-label">今日总消耗</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayTotalRequests.toLocaleString() }}</div>
        <div class="stat-label">今日总请求</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.exceededUsers }}</div>
        <div class="stat-label">今日超限用户</div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">用户列表</h3>
      </div>

      <!-- 表格头 -->
      <div class="table-header">
        <div class="col-email">邮箱</div>
        <div class="col-limit">每日额度</div>
        <div class="col-used">今日已用</div>
        <div class="col-remaining">剩余</div>
        <div class="col-requests">请求数</div>
        <div class="col-status">状态</div>
        <div class="col-actions">操作</div>
      </div>

      <!-- 用户列表 -->
      <div class="user-list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-row">
          <div class="col-email">
            <div class="user-email">{{ user.email }}</div>
            <div class="user-username">{{ user.username || '未设置昵称' }}</div>
          </div>
          <div class="col-limit">
            <span v-if="user.dailyLimit > 0">{{ user.dailyLimit.toLocaleString() }}</span>
            <span v-else class="unlimited">无限制</span>
          </div>
          <div class="col-used">{{ user.usedToday.toLocaleString() }}</div>
          <div class="col-remaining">
            <span v-if="user.dailyLimit > 0">{{ user.remaining.toLocaleString() }}</span>
            <span v-else>-</span>
          </div>
          <div class="col-requests">{{ user.requestCount }}</div>
          <div class="col-status">
            <span v-if="user.dailyLimit <= 0" class="status-badge unlimited">无限制</span>
            <span v-else-if="user.remaining > 0" class="status-badge active">正常</span>
            <span v-else class="status-badge exceeded">已超限</span>
          </div>
          <div class="col-actions">
            <button class="btn btn-ghost btn-sm" @click="editQuota(user)">设置额度</button>
            <button class="btn btn-secondary btn-sm" @click="viewHistory(user)">查看历史</button>
          </div>
        </div>

        <div v-if="filteredUsers.length === 0" class="empty-state">
          <p>暂无符合条件的用户</p>
        </div>
      </div>
    </div>

    <!-- 设置额度弹窗 -->
    <div v-if="showQuotaModal" class="modal-overlay" @click="closeQuotaModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">设置用户额度</h3>

        <div class="user-info-box">
          <div class="info-row">
            <span class="info-label">用户：</span>
            <span class="info-value">{{ editingUser?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">今日已用：</span>
            <span class="info-value">{{ editingUser?.usedToday?.toLocaleString() || 0 }} Neurons</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">每日 Neurons 额度</label>
          <input v-model.number="quotaForm.daily_neurons_limit" type="number" class="form-input" min="0" />
          <div class="form-hint">
            设为 0 表示无限制。默认额度为 10000 Neurons。
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeQuotaModal">取消</button>
          <button class="btn btn-primary" @click="saveQuota" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 历史记录弹窗 -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-content modal-large" @click.stop>
        <h3 class="modal-title">使用历史 - {{ historyUser?.email }}</h3>

        <div v-if="historyLoading" class="loading-state">加载中...</div>

        <div v-else-if="historyData.length === 0" class="empty-state">
          <p>暂无历史记录</p>
        </div>

        <div v-else class="history-list">
          <div class="history-header">
            <div class="history-col">日期</div>
            <div class="history-col">消耗 Neurons</div>
            <div class="history-col">请求数</div>
          </div>
          <div v-for="record in historyData" :key="record.id" class="history-row">
            <div class="history-col">{{ record.date }}</div>
            <div class="history-col">{{ record.total_neurons?.toLocaleString() || 0 }}</div>
            <div class="history-col">{{ record.request_count || 0 }}</div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeHistoryModal">关闭</button>
        </div>
      </div>
    </div>

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

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI, isSuperAdmin } = useAdminAuth();
const dialog = useDialog();

// 用户列表
const users = ref([]);
const filterType = ref('all');

// 统计数据
const stats = ref({
  totalUsers: 0,
  todayTotalNeurons: 0,
  todayTotalRequests: 0,
  exceededUsers: 0
});

// 弹窗状态
const showQuotaModal = ref(false);
const showHistoryModal = ref(false);
const editingUser = ref(null);
const historyUser = ref(null);
const historyData = ref([]);
const historyLoading = ref(false);
const saving = ref(false);

// 额度表单
const quotaForm = ref({
  daily_neurons_limit: 10000
});

// 过滤用户
const filteredUsers = computed(() => {
  let filtered = users.value;

  if (filterType.value === 'limited') {
    filtered = filtered.filter(u => u.dailyLimit > 0);
  } else if (filterType.value === 'unlimited') {
    filtered = filtered.filter(u => u.dailyLimit <= 0);
  } else if (filterType.value === 'exceeded') {
    filtered = filtered.filter(u => u.dailyLimit > 0 && u.remaining <= 0);
  }

  return filtered;
});

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await fetchAPI('/api/admin/usage/daily');
    const data = await response.json();
    if (data.success) {
      users.value = data.data;

      // 计算统计数据
      stats.value.totalUsers = data.data.length;
      stats.value.todayTotalNeurons = data.data.reduce((sum, u) => sum + u.usedToday, 0);
      stats.value.todayTotalRequests = data.data.reduce((sum, u) => sum + u.requestCount, 0);
      stats.value.exceededUsers = data.data.filter(u => u.dailyLimit > 0 && u.remaining <= 0).length;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
};

// 编辑额度
const editQuota = (user) => {
  editingUser.value = user;
  quotaForm.value.daily_neurons_limit = user.dailyLimit;
  showQuotaModal.value = true;
};

const closeQuotaModal = () => {
  showQuotaModal.value = false;
  editingUser.value = null;
};

// 保存额度
const saveQuota = async () => {
  if (!editingUser.value) return;

  saving.value = true;
  try {
    const response = await fetchAPI(`/api/admin/usage/user/${editingUser.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(quotaForm.value)
    });

    const data = await response.json();
    if (data.success) {
      closeQuotaModal();
      loadUsers();
      dialog.showSuccess('额度设置已保存');
    } else {
      dialog.showError(data.error?.message || '保存失败');
    }
  } catch (error) {
    console.error('保存额度失败:', error);
    dialog.showError('保存额度失败');
  } finally {
    saving.value = false;
  }
};

// 查看历史
const viewHistory = async (user) => {
  historyUser.value = user;
  historyData.value = [];
  historyLoading.value = true;
  showHistoryModal.value = true;

  try {
    const response = await fetchAPI(`/api/admin/usage/history?userId=${user.id}&limit=30`);
    const data = await response.json();
    if (data.success) {
      historyData.value = data.data.records;
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
  } finally {
    historyLoading.value = false;
  }
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyUser.value = null;
  historyData.value = [];
};

// 初始化
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .page-title {
  color: #fff;
}

.filter-select {
  width: 150px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.dark .stat-card {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.stat-card.warning {
  border-color: #ff9500;
  background: #fff8f0;
}

.dark .stat-card.warning {
  background: #3c2a1c;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.dark .stat-value {
  color: #fff;
}

.stat-card.warning .stat-value {
  color: #ff9500;
}

.stat-label {
  font-size: 14px;
  color: #86868b;
}

/* 表格 */
.table-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #fafafa;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #86868b;
  margin-bottom: 8px;
}

.dark .table-header {
  background: #2c2c2e;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.dark .user-row {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.user-row:hover {
  border-color: #0071e3;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.08);
}

.col-email {
  width: 220px;
  flex-shrink: 0;
}

.col-limit,
.col-used,
.col-remaining,
.col-requests {
  width: 100px;
  text-align: center;
  flex-shrink: 0;
}

.col-status {
  width: 80px;
  text-align: center;
  flex-shrink: 0;
}

.col-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.user-email {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .user-email {
  color: #fff;
}

.user-username {
  margin-top: 2px;
  font-size: 12px;
  color: #86868b;
}

.unlimited {
  color: #86868b;
}

/* 状态标签 */
.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.exceeded {
  background: #ffebee;
  color: #c62828;
}

.status-badge.unlimited {
  background: #e3f2fd;
  color: #1565c0;
}

.dark .status-badge.active {
  background: #1b5e20;
  color: #a5d6a7;
}

.dark .status-badge.exceeded {
  background: #4a1c1c;
  color: #ef9a9a;
}

.dark .status-badge.unlimited {
  background: #0d47a1;
  color: #90caf9;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #86868b;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 640px;
}

.dark .modal-content {
  background: #2c2c2e;
}

.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .modal-title {
  color: #fff;
}

.user-info-box {
  padding: 16px;
  background: #f5f5f7;
  border-radius: 10px;
  margin-bottom: 20px;
}

.dark .user-info-box {
  background: #3a3a3c;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: #86868b;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .info-value {
  color: #fff;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .form-label {
  color: #e5e5e7;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #0071e3;
}

.dark .form-input {
  background: #1c1c1e;
  border-color: #3a3a3c;
  color: #fff;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #86868b;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions .btn {
  flex: 1;
}

/* 历史记录 */
.history-list {
  margin-top: 16px;
}

.history-header {
  display: flex;
  padding: 12px 16px;
  background: #f5f5f7;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #86868b;
  margin-bottom: 8px;
}

.dark .history-header {
  background: #3a3a3c;
}

.history-row {
  display: flex;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 8px;
}

.dark .history-row {
  background: #3a3a3c;
  border-color: #48484a;
}

.history-col {
  flex: 1;
  font-size: 14px;
  color: #1d1d1f;
}

.dark .history-col {
  color: #e5e5e7;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #86868b;
}
</style>