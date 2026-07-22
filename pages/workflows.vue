<template>
  <div>
    <!-- 操作栏 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">AI 工作流</h3>
        <button v-if="isSuperAdmin" class="btn btn-primary btn-sm" @click="showAddModal = true">+ 新建工作流</button>
      </div>

      <!-- 说明 -->
      <div class="workflow-notice">
        <span class="notice-icon">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h4M4 12h4M4 18h4" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6l3 3-3 3M12 18l3-3-3-3" />
          </svg>
        </span>
        <span>工作流支持多个模型串联处理，实现图片描述→摘要生成→翻译等流水线能力。</span>
      </div>

      <!-- 工作流列表 -->
      <div class="workflow-list">
        <div v-for="workflow in workflows" :key="workflow.id" class="workflow-card">
          <div class="workflow-header">
            <div class="workflow-info">
              <span class="workflow-name">{{ workflow.name }}</span>
              <span v-if="!workflow.enabled" class="status-badge">已禁用</span>
              <span v-else class="status-badge active">启用</span>
            </div>
            <div class="workflow-actions">
              <button class="btn btn-ghost btn-sm" @click="viewWorkflow(workflow)">查看</button>
              <template v-if="isSuperAdmin">
                <button class="btn btn-ghost btn-sm" @click="editWorkflow(workflow)">编辑</button>
                <button
                  :class="['btn', 'btn-sm', workflow.enabled ? 'btn-ghost' : 'btn-primary']"
                  @click="toggleWorkflow(workflow)"
                >
                  {{ workflow.enabled ? '禁用' : '启用' }}
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteWorkflow(workflow)">删除</button>
              </template>
            </div>
          </div>
          <div class="workflow-desc">{{ workflow.description || '暂无描述' }}</div>
          <div class="workflow-meta">
            <span class="meta-item">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 3a2 2 0 002 2h2a2 2 0 002-2M9 3h6" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6M9 16h6" />
              </svg>
              {{ workflow.step_count || 0 }} 个步骤
            </span>
          </div>
        </div>

        <div v-if="workflows.length === 0" class="empty-state">
          <p>暂无工作流，点击"新建工作流"创建</p>
        </div>
      </div>
    </div>

    <!-- 新建/编辑工作流弹窗 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content modal-large" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? '编辑工作流' : '新建工作流' }}</h3>

        <div class="form-group">
          <label class="form-label">工作流名称 *</label>
          <input v-model="workflowForm.name" type="text" class="form-input" placeholder="例如：图片内容处理流水线" />
        </div>

        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="workflowForm.description" type="text" class="form-input" placeholder="工作流描述" />
        </div>

        <!-- 步骤配置 -->
        <div class="steps-section">
          <div class="steps-header">
            <h4 class="steps-title">处理步骤</h4>
            <button type="button" class="btn btn-secondary btn-sm" @click="addStep">+ 添加步骤</button>
          </div>

          <div class="steps-list">
            <div v-for="(step, index) in workflowSteps" :key="index" class="step-item">
              <div class="step-header">
                <span class="step-number">步骤 {{ index + 1 }}</span>
                <button type="button" class="step-remove" @click="removeStep(index)">✕</button>
              </div>

              <div class="step-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">步骤类型</label>
                    <select v-model="step.step_type" class="form-input">
                      <option value="llm">LLM 文本生成</option>
                      <option value="vision">视觉模型</option>
                      <option value="translate">翻译模型</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">使用模型</label>
                    <select v-model="step.model_id" class="form-input">
                      <option value="">请选择模型</option>
                      <option v-for="model in enabledModels" :key="model.model_id" :value="model.model_id">
                        {{ model.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">输入模板</label>
                  <textarea
                    v-model="step.input_template"
                    class="form-input form-textarea"
                    placeholder="输入提示词，支持变量：{{input}}、{{step_1_output}}、{{step_2_output}}..."
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">输出变量名</label>
                    <input v-model="step.output_key" type="text" class="form-input" placeholder="例如：summary" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">最大输出 Token</label>
                    <input v-model.number="step.max_tokens" type="number" class="form-input" placeholder="200" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="workflowSteps.length === 0" class="no-steps">
              <p>请添加至少一个处理步骤</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveWorkflow">保存</button>
        </div>
      </div>
    </div>

    <!-- 查看工作流详情弹窗 -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal-content modal-large" @click.stop>
        <h3 class="modal-title">{{ currentWorkflow?.name }}</h3>
        <p class="modal-desc">{{ currentWorkflow?.description || '暂无描述' }}</p>

        <div class="workflow-steps-view">
          <h4 class="steps-view-title">执行流程</h4>
          <div class="flow-diagram">
            <div class="flow-start">
              <span class="flow-label">用户输入</span>
            </div>
            <div class="flow-arrow">↓</div>

            <template v-for="(step, index) in currentWorkflowSteps" :key="step.id">
              <div class="flow-step">
                <div class="flow-step-header">
                  <span class="flow-step-num">{{ index + 1 }}</span>
                  <span class="flow-step-type">{{ getStepTypeName(step.step_type) }}</span>
                </div>
                <div class="flow-step-model">{{ step.model_name || step.model_id }}</div>
                <div class="flow-step-output">输出: {{ step.output_key }}</div>
              </div>
              <div class="flow-arrow">↓</div>
            </template>

            <div class="flow-end">
              <span class="flow-label">最终输出</span>
            </div>
          </div>
        </div>

        <!-- 测试面板 -->
        <div class="test-section">
          <h4 class="test-title">🧪 测试工作流</h4>
          <div class="test-body">
            <input
              v-model="testInput"
              type="text"
              class="form-input test-input"
              placeholder="输入测试消息"
            />
            <input
              v-model="testImageUrl"
              type="text"
              class="form-input test-input"
              placeholder="图片URL（可选）"
            />
            <button class="btn btn-primary" @click="executeWorkflow" :disabled="!testInput || executing">
              {{ executing ? '执行中...' : '执行' }}
            </button>
          </div>

          <div v-if="executionResult" class="execution-result">
            <h5>执行结果</h5>
            <div class="result-outputs">
              <div v-for="(value, key) in executionResult.outputs" :key="key" class="result-item">
                <span class="result-key">{{ key }}:</span>
                <span class="result-value">{{ value }}</span>
              </div>
            </div>
            <div class="execution-log">
              <span>执行 {{ executionResult.total_steps }} 个步骤</span>
              <span v-for="log in executionResult.execution_log" :key="log.step" class="log-item">
                步骤{{ log.step }}: {{ log.latency }}ms
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showViewModal = false">关闭</button>
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

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI, isSuperAdmin } = useAdminAuth();
const dialog = useDialog();

const workflows = ref([]);
const models = ref([]);
const enabledModels = computed(() => models.value.filter(m => m.enabled));
const showAddModal = ref(false);
const showEditModal = ref(false);
const showViewModal = ref(false);
const currentWorkflow = ref(null);
const currentWorkflowSteps = ref([]);

// 表单
const workflowForm = ref({
  id: '',
  name: '',
  description: ''
});

const workflowSteps = ref([]);

// 测试相关
const testInput = ref('');
const testImageUrl = ref('');
const executing = ref(false);
const executionResult = ref(null);

// 加载数据
const loadWorkflows = async () => {
  try {
    const response = await fetchAPI('/api/admin/workflows');
    const data = await response.json();
    if (data.success) {
      workflows.value = data.data;
    }
  } catch (error) {
    console.error('获取工作流失败:', error);
  }
};

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

// 步骤操作
const addStep = () => {
  workflowSteps.value.push({
    step_type: 'llm',
    model_id: '',
    input_template: '',
    output_key: '',
    max_tokens: 200
  });
};

const removeStep = (index) => {
  workflowSteps.value.splice(index, 1);
};

const getStepTypeName = (type) => {
  const names = {
    llm: 'LLM 文本生成',
    vision: '视觉模型',
    translate: '翻译模型'
  };
  return names[type] || type;
};

// 工作流操作
const viewWorkflow = async (workflow) => {
  try {
    const response = await fetchAPI(`/api/admin/workflows/${workflow.id}`);
    const data = await response.json();
    if (data.success) {
      currentWorkflow.value = data.data;
      currentWorkflowSteps.value = data.data.steps || [];
      showViewModal.value = true;
    }
  } catch (error) {
    console.error('获取工作流详情失败:', error);
  }
};

const editWorkflow = async (workflow) => {
  try {
    const response = await fetchAPI(`/api/admin/workflows/${workflow.id}`);
    const data = await response.json();
    if (data.success) {
      workflowForm.value = {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description || ''
      };

      // 加载步骤
      workflowSteps.value = (data.data.steps || []).map(step => ({
        step_type: step.step_type,
        model_id: step.model_id,
        input_template: step.input_template,
        output_key: step.output_key,
        max_tokens: step.config ? JSON.parse(step.config).max_tokens : 200
      }));

      showEditModal.value = true;
    }
  } catch (error) {
    console.error('获取工作流详情失败:', error);
  }
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  workflowForm.value = { id: '', name: '', description: '' };
  workflowSteps.value = [];
};

const saveWorkflow = async () => {
  try {
    const steps = workflowSteps.value.map((step, index) => ({
      ...step,
      config: { max_tokens: step.max_tokens || 200 }
    }));

    const payload = {
      ...workflowForm.value,
      steps
    };

    const url = showEditModal.value
      ? `/api/admin/workflows/${workflowForm.value.id}`
      : '/api/admin/workflows';

    const method = showEditModal.value ? 'PUT' : 'POST';

    const response = await fetchAPI(url, {
      method,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.success) {
      closeModal();
      loadWorkflows();
      dialog.showSuccess('工作流已保存');
    } else {
      dialog.showError(data.error?.message || '保存失败');
    }
  } catch (error) {
    console.error('保存工作流失败:', error);
    dialog.showError('保存失败');
  }
};

const toggleWorkflow = async (workflow) => {
  try {
    const response = await fetchAPI(`/api/admin/workflows/${workflow.id}/toggle`, {
      method: 'PUT'
    });

    const data = await response.json();
    if (data.success) {
      loadWorkflows();
      dialog.showSuccess(workflow.enabled ? '工作流已禁用' : '工作流已启用');
    } else {
      dialog.showError(data.error?.message || '操作失败');
    }
  } catch (error) {
    console.error('切换工作流状态失败:', error);
    dialog.showError('操作失败');
  }
};

const deleteWorkflow = async (workflow) => {
  const confirmed = await dialog.showConfirm(`确定要删除工作流 "${workflow.name}" 吗？`);

  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/workflows/${workflow.id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.success) {
      loadWorkflows();
      dialog.showSuccess('工作流已删除');
    } else {
      dialog.showError(data.error?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除工作流失败:', error);
    dialog.showError('删除失败');
  }
};

// 执行工作流
const executeWorkflow = async () => {
  if (!testInput.value) return;

  executing.value = true;
  executionResult.value = null;

  try {
    const response = await fetchAPI(`/api/admin/workflows/${currentWorkflow.value.id}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        message: testInput.value,
        image_url: testImageUrl.value || null
      })
    });

    const data = await response.json();
    if (data.success) {
      executionResult.value = data.data;
    } else {
      dialog.showError(data.error?.message || '执行失败');
    }
  } catch (error) {
    console.error('执行工作流失败:', error);
    dialog.showError('执行失败');
  } finally {
    executing.value = false;
  }
};

onMounted(() => {
  loadWorkflows();
  loadModels();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .card-title {
  color: #fff;
}

.workflow-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f5f7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #86868b;
}

.dark .workflow-notice {
  background: #2c2c2e;
}

.notice-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0071e3;
}

.dark .notice-icon {
  color: #0a84ff;
}

.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workflow-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.dark .workflow-card {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workflow-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workflow-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .workflow-name {
  color: #fff;
}

.workflow-actions {
  display: flex;
  gap: 8px;
}

.workflow-desc {
  font-size: 13px;
  color: #86868b;
  margin-bottom: 8px;
}

.workflow-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #86868b;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item svg {
  opacity: 0.6;
}

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

.status-badge:not(.active) {
  background: #ffebee;
  color: #c62828;
}

.dark .status-badge.active {
  background: #1b5e20;
  color: #a5d6a7;
}

.dark .status-badge:not(.active) {
  background: #4a1c1c;
  color: #ef9a9a;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #86868b;
}

/* Modal */
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
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .modal-title {
  color: #fff;
}

.modal-desc {
  font-size: 14px;
  color: #86868b;
  margin-bottom: 20px;
}

/* Form */
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

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Steps */
.steps-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e5e5;
}

.dark .steps-section {
  border-top-color: #3a3a3c;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.dark .steps-title {
  color: #fff;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
}

.dark .step-item {
  background: #3a3a3c;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.step-number {
  font-size: 13px;
  font-weight: 600;
  color: #0071e3;
}

.step-remove {
  background: none;
  border: none;
  color: #86868b;
  cursor: pointer;
  font-size: 16px;
}

.step-remove:hover {
  color: #c62828;
}

.no-steps {
  text-align: center;
  padding: 20px;
  color: #86868b;
}

/* Flow Diagram */
.workflow-steps-view {
  margin: 20px 0;
}

.steps-view-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1d1d1f;
}

.dark .steps-view-title {
  color: #fff;
}

.flow-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flow-start,
.flow-end {
  padding: 12px 24px;
  background: #0071e3;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.flow-arrow {
  padding: 4px 0;
  color: #86868b;
  font-size: 18px;
}

.flow-step {
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}

.dark .flow-step {
  background: #3a3a3c;
}

.flow-step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.flow-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #0071e3;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.flow-step-type {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .flow-step-type {
  color: #fff;
}

.flow-step-model {
  font-size: 12px;
  color: #0071e3;
  margin-bottom: 4px;
}

.flow-step-output {
  font-size: 11px;
  color: #86868b;
}

/* Test Section */
.test-section {
  margin-top: 20px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
}

.dark .test-section {
  background: #3a3a3c;
}

.test-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1d1d1f;
}

.dark .test-title {
  color: #fff;
}

.test-body {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.test-input {
  flex: 1;
  min-width: 150px;
}

.execution-result {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.dark .execution-result {
  background: #2c2c2e;
}

.execution-result h5 {
  margin: 0 0 12px;
  font-size: 13px;
  color: #1d1d1f;
}

.dark .execution-result h5 {
  color: #fff;
}

.result-outputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  font-size: 13px;
}

.result-key {
  color: #0071e3;
  font-weight: 500;
}

.result-value {
  color: #333;
}

.dark .result-value {
  color: #e5e5e7;
}

.execution-log {
  margin-top: 12px;
  font-size: 12px;
  color: #86868b;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.log-item {
  background: #f5f5f7;
  padding: 4px 8px;
  border-radius: 4px;
}

.dark .log-item {
  background: #3a3a3c;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions .btn {
  flex: 1;
}

/* Buttons */
.btn-ghost {
  background: transparent;
  border: 1px solid #d1d1d6;
  color: #1d1d1f;
}

.btn-ghost:hover {
  background: #f5f5f7;
}

.dark .btn-ghost {
  border-color: #48484a;
  color: #e5e5e7;
}

.dark .btn-ghost:hover {
  background: #3a3a3c;
}
</style>