<template>
  <div>
    <!-- 操作栏 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">分享链接管理</h3>
      </div>

      <div class="filter-bar">
        <input
          v-model="searchText"
          type="text"
          class="filter-input"
          placeholder="搜索对话标题..."
          style="flex: 1; max-width: 300px;"
          @input="searchShares"
        />
        <select v-model="statusFilter" class="filter-select" style="width: 140px;" @change="loadShares">
          <option value="">全部状态</option>
          <option value="active">有效</option>
          <option value="expired">已失效</option>
        </select>
      </div>

      <!-- 分享链接表格 -->
      <div class="table-scroll-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 18%;">分享码</th>
              <th style="width: 14%;">对话标题</th>
              <th style="width: 8%;">创建者</th>
              <th style="width: 6%;">浏览</th>
              <th style="width: 8%;">状态</th>
              <th style="width: 12%;">过期时间</th>
              <th style="width: 12%;">创建时间</th>
              <th style="width: 22%;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="share in shares" :key="share.id">
              <td>
                <div class="share-code">
                  {{ share.share_code }}
                </div>
              </td>
              <td>{{ share.conversation_title || '-' }}</td>
              <td>{{ share.owner_name || '-' }}</td>
              <td>{{ share.view_count }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(share)">
                  {{ getStatusText(share) }}
                </span>
              </td>
              <td>{{ formatDate(share.expires_at) }}</td>
              <td>{{ formatDate(share.created_at) }}</td>
              <td>
                <div class="action-btns">
                  <button class="action-btn visit" @click="visitShare(share)" title="访问链接">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    访问
                  </button>
                  <template v-if="isSuperAdmin">
                    <template v-if="share.status === 'active'">
                      <button class="action-btn extend" @click="showExtendModal(share)" title="延长有效期">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        延长
                      </button>
                      <button class="action-btn expire" @click="expireShare(share)" title="使失效">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        失效
                      </button>
                    </template>
                    <button v-else class="action-btn activate" @click="showActivateModal(share)" title="重新生效">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      生效
                    </button>
                    <button class="action-btn delete" @click="deleteShare(share)" title="删除">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      删除
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="shares.length === 0">
              <td colspan="8" class="empty-row">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <p>暂无分享链接</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="shares.length > 0" class="pagination-bar">
        <div class="pagination-info">
          共 <span class="highlight">{{ pagination.total }}</span> 条记录
        </div>
        <div class="pagination-controls">
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
            <span class="page-text">第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
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

    <!-- 延长有效期弹窗 -->
    <div v-if="extendModal.visible" class="modal-overlay" @mousedown="onOverlayMouseDown" @click="onExtendOverlayClick">
      <div class="modal-content" @click.stop>
        <h3>延长有效期</h3>
        <p style="color: #86868b; margin-bottom: 16px;">
          当前过期时间：{{ formatDate(extendModal.share?.expires_at) }}
        </p>
        <div class="form-group">
          <label class="form-label">延长时间</label>
          <div class="time-options">
            <button
              v-for="opt in timeOptions"
              :key="opt.value"
              :class="['time-option', { active: extendModal.hours === opt.value }]"
              @click="extendModal.hours = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="extendModal.visible = false">取消</button>
          <button class="btn btn-primary" @click="extendShare">确定</button>
        </div>
      </div>
    </div>

    <!-- 重新生效弹窗 -->
    <div v-if="activateModal.visible" class="modal-overlay" @mousedown="onOverlayMouseDown" @click="onActivateOverlayClick">
      <div class="modal-content" @click.stop>
        <h3>重新生效链接</h3>
        <p style="color: #86868b; margin-bottom: 16px;">
          该分享链接将重新生效，用户可以继续访问。
        </p>
        <div class="form-group">
          <label class="form-label">有效期</label>
          <div class="time-options">
            <button
              v-for="opt in timeOptions"
              :key="opt.value"
              :class="['time-option', { active: activateModal.hours === opt.value }]"
              @click="activateModal.hours = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="activateModal.visible = false">取消</button>
          <button class="btn btn-primary" @click="activateShare">确定</button>
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
import { formatShort, isExpired } from '~/utils/date';

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI, isSuperAdmin } = useAdminAuth();
const dialog = useDialog();

// 弹窗关闭逻辑：记录鼠标按下时的目标元素
const overlayMouseDownTarget = ref(null);

const onOverlayMouseDown = (e) => {
  if (e.target === e.currentTarget) {
    overlayMouseDownTarget.value = e.target;
  } else {
    overlayMouseDownTarget.value = null;
  }
};

const onExtendOverlayClick = (e) => {
  if (overlayMouseDownTarget.value === e.currentTarget && e.target === e.currentTarget) {
    extendModal.value.visible = false;
  }
  overlayMouseDownTarget.value = null;
};

const onActivateOverlayClick = (e) => {
  if (overlayMouseDownTarget.value === e.currentTarget && e.target === e.currentTarget) {
    activateModal.value.visible = false;
  }
  overlayMouseDownTarget.value = null;
};

const shares = ref([]);
const searchText = ref('');
const statusFilter = ref('');
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

// 时间选项
const timeOptions = [
  { label: '1 小时', value: 1 },
  { label: '6 小时', value: 6 },
  { label: '12 小时', value: 12 },
  { label: '24 小时', value: 24 },
  { label: '3 天', value: 72 },
  { label: '7 天', value: 168 },
];

// 延长弹窗
const extendModal = ref({
  visible: false,
  share: null,
  hours: 24
});

// 生效弹窗
const activateModal = ref({
  visible: false,
  share: null,
  hours: 24
});

// 使用统一的日期格式化函数
const formatDate = formatShort;

const getStatusClass = (share) => {
  if (share.status === 'expired') return 'expired';
  return isExpired(share.expires_at) ? 'expired' : 'active';
};

const getStatusText = (share) => {
  if (share.status === 'expired') return '已失效';
  return isExpired(share.expires_at) ? '已过期' : '有效';
};

const loadShares = async () => {
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      ...(searchText.value && { search: searchText.value }),
      ...(statusFilter.value && { status: statusFilter.value })
    });

    const response = await fetchAPI(`/api/admin/shares?${params}`);
    const data = await response.json();

    if (data.success) {
      shares.value = data.data.shares;
      pagination.value = data.data.pagination;
    }
  } catch (error) {
    console.error('获取分享列表失败:', error);
  }
};

const searchShares = () => {
  pagination.value.page = 1;
  loadShares();
};

const changePage = (delta) => {
  pagination.value.page += delta;
  loadShares();
};

const showExtendModal = (share) => {
  extendModal.value = {
    visible: true,
    share,
    hours: 24
  };
};

const showActivateModal = (share) => {
  activateModal.value = {
    visible: true,
    share,
    hours: 24
  };
};

const expireShare = async (share) => {
  const confirmed = await dialog.showConfirm('确定要使该分享链接失效吗？');
  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/shares/${share.id}/expire`, {
      method: 'PUT'
    });
    const data = await response.json();
    if (data.success) {
      loadShares();
      dialog.showSuccess('分享链接已失效');
    }
  } catch (error) {
    console.error('失效分享链接失败:', error);
    dialog.showError('操作失败');
  }
};

const extendShare = async () => {
  try {
    const response = await fetchAPI(`/api/admin/shares/${extendModal.value.share.id}/extend`, {
      method: 'PUT',
      body: JSON.stringify({ hours: extendModal.value.hours })
    });
    const data = await response.json();
    if (data.success) {
      extendModal.value.visible = false;
      loadShares();
      dialog.showSuccess(`已延长 ${extendModal.value.hours} 小时`);
    }
  } catch (error) {
    console.error('延长分享链接失败:', error);
    dialog.showError('操作失败');
  }
};

const activateShare = async () => {
  try {
    const response = await fetchAPI(`/api/admin/shares/${activateModal.value.share.id}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ hours: activateModal.value.hours })
    });
    const data = await response.json();
    if (data.success) {
      activateModal.value.visible = false;
      loadShares();
      dialog.showSuccess('分享链接已生效');
    }
  } catch (error) {
    console.error('生效分享链接失败:', error);
    dialog.showError('操作失败');
  }
};

const deleteShare = async (share) => {
  const confirmed = await dialog.showConfirm('确定要删除该分享链接吗？');
  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/shares/${share.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
      loadShares();
      dialog.showSuccess('分享链接已删除');
    }
  } catch (error) {
    console.error('删除分享链接失败:', error);
    dialog.showError('删除失败');
  }
};

const visitShare = (share) => {
  const url = `${window.location.origin}/share/${share.share_code}`;
  window.open(url, '_blank');
};

onMounted(loadShares);
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

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

.dark .filter-input {
  background: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.filter-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.filter-select {
  height: 36px;
  padding: 0 28px 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: all 0.2s ease;
}

.dark .filter-select {
  background-color: #2c2c2e;
  border-color: #3a3a3c;
  color: #fff;
}

.filter-select:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.table-scroll-container {
  max-height: calc(100vh - 350px);
  min-height: 300px;
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

.dark .table-scroll-container::-webkit-scrollbar-thumb {
  background: #48484a;
}

.data-table {
  table-layout: fixed;
  width: 100%;
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f5f5f7;
}

.dark .data-table thead {
  background: #2c2c2e;
}

.share-code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 12px;
  color: #666;
  word-break: break-all;
  line-height: 1.5;
  background: #f5f5f7;
  padding: 6px 8px;
  border-radius: 4px;
}

.dark .share-code {
  background: #3a3a3c;
  color: #a1a1a6;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #e3fcef;
  color: #00875a;
}

.status-badge.expired {
  background: #ffebe6;
  color: #bf2600;
}

.dark .status-badge.active {
  background: rgba(0, 135, 90, 0.2);
  color: #6ee7b7;
}

.dark .status-badge.expired {
  background: rgba(191, 38, 0, 0.2);
  color: #fca5a5;
}

.action-btns {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.visit {
  background: #e8eaf6;
  color: #3f51b5;
}

.action-btn.visit:hover {
  background: #c5cae9;
}

.action-btn.extend {
  background: #e3f2fd;
  color: #1976d2;
}

.action-btn.extend:hover {
  background: #bbdefb;
}

.action-btn.expire {
  background: #fff3e0;
  color: #f57c00;
}

.action-btn.expire:hover {
  background: #ffe0b2;
}

.action-btn.activate {
  background: #e8f5e9;
  color: #388e3c;
}

.action-btn.activate:hover {
  background: #c8e6c9;
}

.action-btn.delete {
  background: #ffebee;
  color: #d32f2f;
}

.action-btn.delete:hover {
  background: #ffcdd2;
}

.dark .action-btn.visit {
  background: rgba(63, 81, 181, 0.2);
  color: #7986cb;
}

.dark .action-btn.visit:hover {
  background: rgba(63, 81, 181, 0.3);
}

.dark .action-btn.extend {
  background: rgba(25, 118, 210, 0.2);
  color: #64b5f6;
}

.dark .action-btn.extend:hover {
  background: rgba(25, 118, 210, 0.3);
}

.dark .action-btn.expire {
  background: rgba(245, 124, 0, 0.2);
  color: #ffb74d;
}

.dark .action-btn.expire:hover {
  background: rgba(245, 124, 0, 0.3);
}

.dark .action-btn.activate {
  background: rgba(56, 142, 60, 0.2);
  color: #81c784;
}

.dark .action-btn.activate:hover {
  background: rgba(56, 142, 60, 0.3);
}

.dark .action-btn.delete {
  background: rgba(211, 47, 47, 0.2);
  color: #ef5350;
}

.dark .action-btn.delete:hover {
  background: rgba(211, 47, 47, 0.3);
}

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

.page-text {
  font-size: 14px;
  color: #86868b;
}

/* 弹窗样式 */
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90vw;
}

.dark .modal-content {
  background: #2c2c2e;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.dark .modal-content h3 {
  color: #fff;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dark .form-label {
  color: #fff;
}

.time-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-option {
  padding: 8px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .time-option {
  background: #3a3a3c;
  border-color: #48484a;
  color: #fff;
}

.time-option:hover {
  border-color: #0071e3;
}

.time-option.active {
  background: #0071e3;
  border-color: #0071e3;
  color: #fff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>