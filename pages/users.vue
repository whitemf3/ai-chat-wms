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
              <th>是否管理员</th>
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
              <td>{{ user.isAdmin ? '✅ 是' : '否' }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>{{ user.last_login_at ? formatDate(user.last_login_at) : '-' }}</td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" @click="editUser(user)">编辑</button>
                  <button
                    v-if="!user.isAdmin"
                    :class="['btn', 'btn-sm', user.status === 'active' ? 'btn-danger' : 'btn-primary']"
                    @click="toggleUserStatus(user)"
                  >
                    {{ user.status === 'active' ? '封禁' : '解封' }}
                  </button>
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

    <!-- 编辑用户弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <h3 style="margin-bottom: 20px;">编辑用户</h3>
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="editForm.username" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="editForm.email" type="email" class="form-input" />
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-secondary" style="flex: 1;" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" style="flex: 1;" @click="saveUser">保存</button>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <ConfirmDialog
      v-model:visible="dialog.confirmVisible.value"
      :type="dialog.confirmType.value"
      :message="dialog.confirmMessage.value"
      @confirm="dialog.handleConfirm"
      @cancel="dialog.handleCancel"
    />

    <!-- 顶部通知 -->
    <TopAlert
      v-model:visible="dialog.alertVisible.value"
      :type="dialog.alertType.value"
      :message="dialog.alertMessage.value"
      :duration="dialog.alertDuration.value"
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

const { fetchAPI } = useAdminAuth();
const dialog = useDialog();

const users = ref([]);
const searchText = ref('');
const statusFilter = ref('');
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const showEditModal = ref(false);
const editForm = ref({ id: '', username: '', email: '' });

// 使用统一的日期格式化函数
const formatDate = formatShort;

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

const editUser = (user) => {
  editForm.value = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  showEditModal.value = true;
};

const saveUser = async () => {
  try {
    const response = await fetchAPI(`/api/admin/users/${editForm.value.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        username: editForm.value.username,
        email: editForm.value.email
      })
    });

    const data = await response.json();
    if (data.success) {
      showEditModal.value = false;
      loadUsers();
      dialog.showSuccess('用户信息已更新');
    }
  } catch (error) {
    console.error('保存用户失败:', error);
    dialog.showError('保存用户失败');
  }
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
    }
  } catch (error) {
    console.error('修改用户状态失败:', error);
    dialog.showError('操作失败');
  }
};

onMounted(loadUsers);
</script>