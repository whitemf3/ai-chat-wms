<template>
  <div>
    <!-- 操作栏 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">模型配置</h3>
        <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ 添加模型</button>
      </div>

      <!-- 模型列表 -->
      <div class="model-list">
        <div v-for="model in models" :key="model.id" class="model-card">
          <div class="model-main">
            <div class="model-header">
              <span class="model-name">🤖 {{ model.name }}</span>
              <span v-if="!model.enabled" class="status-badge expired">已禁用</span>
            </div>
          </div>

          <div class="model-details">
            <div class="detail-item">
              <span class="detail-label">模型ID</span>
              <span class="detail-value model-id">{{ model.model_id }}</span>
            </div>
            <div v-if="model.description" class="detail-item">
              <span class="detail-label">描述</span>
              <span class="detail-value">{{ model.description }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">参数</span>
              <span class="detail-value">
                <span class="param-tag">Context: {{ model.context_window }}</span>
                <span class="param-tag">Output: {{ model.max_output_tokens }}</span>
                <span class="param-tag">Temp: {{ model.temperature }}</span>
              </span>
            </div>
          </div>

          <div class="model-actions">
            <button
              :class="['btn', 'btn-sm', model.enabled ? 'btn-secondary' : 'btn-primary']"
              @click="toggleModel(model)"
            >
              {{ model.enabled ? '禁用' : '启用' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="editModel(model)">编辑</button>
            <button class="btn btn-danger btn-sm" @click="deleteModel(model)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模型弹窗 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop style="min-width: 500px;">
        <h3 style="margin-bottom: 20px;">{{ showEditModal ? '编辑模型' : '添加模型' }}</h3>

        <div class="form-group">
          <label class="form-label">模型ID *</label>
          <input v-model="modelForm.model_id" type="text" class="form-input" placeholder="例如: @cf/meta/llama-3.2-3b-instruct" :disabled="showEditModal" />
        </div>

        <div class="form-group">
          <label class="form-label">显示名称 *</label>
          <input v-model="modelForm.name" type="text" class="form-input" placeholder="例如: Llama 3.2 3B" />
        </div>

        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="modelForm.description" type="text" class="form-input" placeholder="模型描述" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Context Window</label>
            <input v-model.number="modelForm.context_window" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Max Output Tokens</label>
            <input v-model.number="modelForm.max_output_tokens" type="number" class="form-input" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Temperature</label>
            <input v-model.number="modelForm.temperature" type="number" step="0.1" min="0" max="2" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="modelForm.display_order" type="number" class="form-input" />
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-secondary" style="flex: 1;" @click="closeModal">取消</button>
          <button class="btn btn-primary" style="flex: 1;" @click="saveModel">保存</button>
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

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI } = useAdminAuth();
const dialog = useDialog();

const models = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);

const defaultForm = {
  id: '',
  model_id: '',
  name: '',
  description: '',
  context_window: 4096,
  max_output_tokens: 2048,
  temperature: 0.7,
  display_order: 0
};

const modelForm = ref({ ...defaultForm });

const loadModels = async () => {
  try {
    const response = await fetchAPI('/api/admin/models');
    const data = await response.json();
    if (data.success) {
      models.value = data.data;
    }
  } catch (error) {
    console.error('获取模型列表失败:', error);
  }
};

const editModel = (model) => {
  modelForm.value = { ...model };
  showEditModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  modelForm.value = { ...defaultForm };
};

const saveModel = async () => {
  try {
    const url = showEditModal.value
      ? `/api/admin/models/${modelForm.value.id}`
      : '/api/admin/models';

    const method = showEditModal.value ? 'PUT' : 'POST';

    const response = await fetchAPI(url, {
      method,
      body: JSON.stringify(modelForm.value)
    });

    const data = await response.json();
    if (data.success) {
      closeModal();
      loadModels();
      dialog.showSuccess('模型配置已保存');
    }
  } catch (error) {
    console.error('保存模型失败:', error);
    dialog.showError('保存模型失败');
  }
};

const toggleModel = async (model) => {
  try {
    const response = await fetchAPI(`/api/admin/models/${model.id}/toggle`, {
      method: 'PUT'
    });

    const data = await response.json();
    if (data.success) {
      loadModels();
      dialog.showSuccess(model.enabled ? '模型已禁用' : '模型已启用');
    }
  } catch (error) {
    console.error('切换模型状态失败:', error);
    dialog.showError('操作失败');
  }
};

const deleteModel = async (model) => {
  const confirmed = await dialog.showConfirm(`确定要删除模型 "${model.name}" 吗？`);

  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/models/${model.id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.success) {
      loadModels();
      dialog.showSuccess('模型已删除');
    }
  } catch (error) {
    console.error('删除模型失败:', error);
    dialog.showError('删除模型失败');
  }
};

onMounted(loadModels);
</script>

<style scoped>
.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.dark .model-card {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.model-card:hover {
  border-color: #0071e3;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.1);
}

.model-main {
  flex-shrink: 0;
  min-width: 180px;
}

.model-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .model-name {
  color: #fff;
}

.model-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.detail-label {
  font-size: 12px;
  color: #86868b;
  min-width: 48px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: #333;
}

.dark .detail-value {
  color: #e5e5e7;
}

.model-id {
  font-family: 'SF Mono', Monaco, 'Consolas', monospace;
  font-size: 12px;
  color: #666;
}

.dark .model-id {
  color: #a1a1a6;
}

.param-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f5f5f7;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  margin-right: 8px;
}

.dark .param-tag {
  background: #3a3a3c;
  color: #e5e5e7;
}

.model-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

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
  min-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.dark .modal-content {
  background: #2c2c2e;
}
</style>