<template>
  <div>
    <!-- 搜索和操作栏 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">用户管理</h3>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <input
          v-model="searchText"
          type="text"
          class="form-input"
          placeholder="搜索用户名或邮箱..."
          style="flex: 1;"
          @input="searchUsers"
        />
        <select v-model="statusFilter" class="form-input" style="width: 150px;" @change="loadUsers">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已封禁</option>
        </select>
      </div>

      <!-- 用户表格 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>状态</th>
              <th>角色</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="status-badge" :class="user.status">
                  {{ user.status === 'active' ? '正常' : '已封禁' }}
                </span>
              </td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ getRoleName(user.role) }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>{{ user.last_login_at ? formatDate(user.last_login_at) : '-' }}</td>
              <td>
                <div class="action-btns">
                  <!-- 封禁/解封：仅超级管理员 -->
                  <div class="action-slot">
                    <button
                      v-if="isSuperAdmin && user.role === 'user'"
                      :class="['action-btn', user.status === 'active' ? 'ban' : 'unban']"
                      @click="toggleUserStatus(user)"
                    >
                      {{ user.status === 'active' ? '封禁' : '解封' }}
                    </button>
                  </div>

                  <!-- 角色设置：仅超级管理员，且不能操作自己 -->
                  <div class="action-slot">
                    <select
                      v-if="isSuperAdmin && !isCurrentUser(user)"
                      class="role-select"
                      :value="user.role"
                      @change="changeUserRole(user, $event)"
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                      <option value="super_admin">超级管理员</option>
                    </select>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <div class="pagination-info">
          显示 {{ (pagination.page - 1) * pagination.limit + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} / 共 {{ pagination.total }} 条
        </div>
        <div class="pagination-btns">
          <button class="btn btn-secondary btn-sm" :disabled="pagination.page <= 1" @click="changePage(-1)">上一页</button>
          <button class="btn btn-secondary btn-sm" :disabled="pagination.page >= pagination.totalPages" @click="changePage(1)">下一页</button>
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
import { formatShort } from '~/utils/date';

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI, adminInfo, isSuperAdmin } = useAdminAuth();
const dialog = useDialog();

const users = ref([]);
const searchText = ref('');
const statusFilter = ref('');
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const formatDate = formatShort;

// 检查是否是当前用户自己
const isCurrentUser = (user) => {
  return adminInfo.value?.id === user.id;
};

// 获取角色显示名称
const getRoleName = (role) => {
  const names = {
    'user': '普通用户',
    'admin': '管理员',
    'super_admin': '超级管理员'
  };
  return names[role] || role;
};

const loadUsers = async () => {
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      ...(searchText.value && { search: searchText.value }),
      ...(statusFilter.value && { status: statusFilter.value })
    });

    const response = await fetchAPI(`/api/admin/users?${params}`);
    const data = await response.json();

    if (data.success) {
      users.value = data.data.users;
      pagination.value = data.data.pagination;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
};

const searchUsers = () => {
  pagination.value.page = 1;
  loadUsers();
};

const changePage = (delta) => {
  pagination.value.page += delta;
  loadUsers();
};

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'banned' : 'active';
  const confirmed = await dialog.showConfirm(`确定要${newStatus === 'banned' ? '封禁' : '解封'}该用户吗？`);

  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/users/${user.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    if (data.success) {
      loadUsers();
      dialog.showSuccess(`已${newStatus === 'banned' ? '封禁' : '解封'}该用户`);
    } else {
      dialog.showError(data.error?.message || '操作失败');
    }
  } catch (error) {
    console.error('修改用户状态失败:', error);
    dialog.showError('操作失败');
  }
};

const changeUserRole = async (user, event) => {
  const newRole = event.target.value;
  const roleName = getRoleName(newRole);
  const confirmed = await dialog.showConfirm(`确定要将该用户设为${roleName}吗？`);

  if (!confirmed) {
    // 恢复原来的值
    event.target.value = user.role;
    return;
  }

  try {
    const response = await fetchAPI(`/api/admin/users/${user.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });

    const data = await response.json();
    if (data.success) {
      loadUsers();
      dialog.showSuccess(data.data.message);
    } else {
      dialog.showError(data.error?.message || '操作失败');
      loadUsers();
    }
  } catch (error) {
    console.error('修改用户角色失败:', error);
    dialog.showError('操作失败');
    loadUsers();
  }
};

onMounted(loadUsers);
</script>

<style scoped>
.action-btns {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-slot {
  display: flex;
  align-items: center;
  min-width: 50px;
}

.action-slot:last-child {
  min-width: 90px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn.ban {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.ban:hover {
  background: #fecaca;
}

.action-btn.unban {
  background: #dcfce7;
  color: #16a34a;
}

.action-btn.unban:hover {
  background: #bbf7d0;
}

.dark .action-btn.ban {
  background: rgba(220, 38, 38, 0.15);
  color: #fca5a5;
}

.dark .action-btn.ban:hover {
  background: rgba(220, 38, 38, 0.25);
}

.dark .action-btn.unban {
  background: rgba(22, 163, 74, 0.15);
  color: #86efac;
}

.dark .action-btn.unban:hover {
  background: rgba(22, 163, 74, 0.25);
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.user {
  background: #f3f4f6;
  color: #6b7280;
}

.role-badge.admin {
  background: #eff6ff;
  color: #2563eb;
}

.role-badge.super_admin {
  background: #fef3c7;
  color: #d97706;
}

.dark .role-badge.user {
  background: #374151;
  color: #9ca3af;
}

.dark .role-badge.admin {
  background: #1e3a5f;
  color: #60a5fa;
}

.dark .role-badge.super_admin {
  background: #78350f;
  color: #fbbf24;
}

.role-select {
  width: 100%;
  height: 26px;
  padding: 0 20px 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  transition: all 0.15s ease;
}

.role-select:hover {
  border-color: #d1d5db;
}

.role-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.dark .role-select {
  background-color: #374151;
  border-color: #4b5563;
  color: #f3f4f6;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}

.dark .role-select:hover {
  border-color: #6b7280;
}
</style>