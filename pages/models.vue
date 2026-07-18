<template>
  <div>
    <!-- Tab 切换 -->
    <div class="tab-container">
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'models' }]"
          @click="activeTab = 'models'"
        >
          模型列表
        </button>
        <button
          :class="['tab', { active: activeTab === 'rules' }]"
          @click="activeTab = 'rules'"
        >
          选择规则
        </button>
      </div>
    </div>

    <!-- 模型列表 Tab -->
    <div v-show="activeTab === 'models'" class="card">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">模型配置</h3>
          <div class="params-help-wrapper">
            <span class="params-help-icon" @mouseenter="showParamsHelp = true" @mouseleave="showParamsHelp = false">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path></svg>
            </span>
            <div v-if="showParamsHelp" class="params-help-popup">
              <div class="help-item">
                <div class="help-label">Context Window</div>
                <div class="help-desc">模型能"记住"的对话长度，单位是 token。</div>
              </div>
              <div class="help-item">
                <div class="help-label">Max Output Tokens</div>
                <div class="help-desc">模型单次回复的最大长度。</div>
              </div>
              <div class="help-item">
                <div class="help-label">Temperature</div>
                <div class="help-desc">控制模型回复的随机性。</div>
              </div>
            </div>
          </div>
        </div>
        <button v-if="isSuperAdmin" class="btn btn-primary btn-sm" @click="showAddModal = true">+ 添加模型</button>
      </div>

      <!-- 表格头 -->
      <div class="model-table-header">
        <div class="col-name">模型</div>
        <div class="col-desc">描述</div>
        <div class="col-status">状态</div>
        <div class="col-param">Context</div>
        <div class="col-param">Output</div>
        <div class="col-param">Temp</div>
        <div class="col-actions">操作</div>
      </div>

      <!-- 模型列表 -->
      <div class="model-list">
        <div v-for="model in models" :key="model.id" class="model-row">
          <div class="col-name">
            <div class="model-name">
              <span class="model-icon">🤖</span>
              <span class="model-name-text">{{ model.name }}</span>
            </div>
            <div class="model-id">{{ model.model_id }}</div>
          </div>
          <div class="col-desc">{{ model.description || '-' }}</div>
          <div class="col-status">
            <span v-if="!model.enabled" class="status-badge">已禁用</span>
            <span v-else class="status-badge active">正常</span>
          </div>
          <div class="col-param">{{ model.context_window }}</div>
          <div class="col-param">{{ model.max_output_tokens }}</div>
          <div class="col-param">{{ model.temperature }}</div>
          <div class="col-actions">
            <template v-if="isSuperAdmin">
              <button
                :class="['btn', 'btn-sm', model.enabled ? 'btn-ghost' : 'btn-primary']"
                @click="toggleModel(model)"
              >
                {{ model.enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn btn-ghost btn-sm" @click="editModel(model)">编辑</button>
              <button class="btn btn-danger btn-sm" @click="deleteModel(model)">删除</button>
            </template>
            <span v-else class="no-permission">仅查看</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择规则 Tab -->
    <div v-show="activeTab === 'rules'" class="card">
      <div class="card-header">
        <h3 class="card-title">模型选择规则</h3>
        <button v-if="isSuperAdmin" class="btn btn-primary btn-sm" @click="showAddRuleModal = true">+ 添加规则</button>
      </div>

      <!-- 规则说明 -->
      <div class="rule-notice">
        <span class="notice-icon">📌</span>
        <span>规则优先级：从上到下依次匹配，匹配成功即停止。可拖拽调整顺序。</span>
      </div>

      <!-- 规则列表 -->
      <div class="rule-list">
        <div
          v-for="(rule, index) in rules"
          :key="rule.id"
          class="rule-row"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent
          @drop="onDrop($event, index)"
        >
          <div class="rule-drag">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M96,192a12,12,0,1,1-12-12A12,12,0,0,1,96,192Zm84-12a12,12,0,1,0,12,12A12,12,0,0,0,180,180Zm-96-84a12,12,0,1,0,12,12A12,12,0,0,0,84,96Zm96,0a12,12,0,1,0,12,12A12,12,0,0,0,180,96Z"></path>
            </svg>
          </div>

          <div class="rule-content">
            <div class="rule-header">
              <span class="rule-icon">{{ getRuleIcon(rule.condition_type) }}</span>
              <span class="rule-name">{{ rule.name }}</span>
              <span v-if="!rule.enabled" class="status-badge">已禁用</span>
              <span v-else class="status-badge active">启用</span>
            </div>
            <div class="rule-detail">
              <span class="rule-condition">{{ getConditionText(rule) }}</span>
              <span class="rule-arrow">→</span>
              <span class="rule-target">{{ rule.target_model_name || rule.target_model_id }}</span>
            </div>
          </div>

          <div class="rule-actions">
            <template v-if="isSuperAdmin">
              <button
                :class="['btn', 'btn-sm', rule.enabled ? 'btn-ghost' : 'btn-primary']"
                @click="toggleRule(rule)"
              >
                {{ rule.enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn btn-ghost btn-sm" @click="editRule(rule)">编辑</button>
              <button class="btn btn-danger btn-sm" @click="deleteRule(rule)">删除</button>
            </template>
            <span v-else class="no-permission">仅查看</span>
          </div>
        </div>

        <div v-if="rules.length === 0" class="empty-state">
          <p>暂无规则，点击"添加规则"创建</p>
        </div>
      </div>

      <!-- 测试面板 -->
      <div class="test-panel">
        <div class="test-panel-header">
          <span class="test-icon">🧪</span>
          <span>测试规则匹配</span>
        </div>
        <div class="test-panel-body">
          <div class="test-input-row">
            <input
              v-model="testMessage"
              type="text"
              class="form-input test-input"
              placeholder="输入测试消息，如：帮我翻译这段文字"
            />
            <label class="test-checkbox">
              <input type="checkbox" v-model="testHasImage" />
              <span>有图片</span>
            </label>
            <label class="test-checkbox">
              <input type="checkbox" v-model="testDeepThink" />
              <span>深度思考</span>
            </label>
            <button class="btn btn-primary btn-sm" @click="testRules" :disabled="!testMessage">
              测试
            </button>
          </div>
          <div v-if="testResult" class="test-result">
            <span class="result-label">匹配结果：</span>
            <span v-if="testResult.matched_rule" class="result-rule">
              {{ testResult.matched_rule.name }} →
            </span>
            <span class="result-model">{{ testResult.selected_model_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模型弹窗 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModelModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">{{ showEditModal ? '编辑模型' : '添加模型' }}</h3>

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

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Context Window</label>
            <input v-model.number="modelForm.context_window" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Max Output Tokens</label>
            <input v-model.number="modelForm.max_output_tokens" type="number" class="form-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Temperature</label>
            <input v-model.number="modelForm.temperature" type="number" step="0.1" min="0" max="2" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="modelForm.display_order" type="number" class="form-input" />
          </div>
        </div>

        <!-- 测试区域 -->
        <div class="test-model-section">
          <div class="test-header">
            <span class="test-label">🧪 模型测试</span>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="!modelForm.model_id || testingModel"
              @click="testModel"
            >
              {{ testingModel ? '测试中...' : '测试连接' }}
            </button>
          </div>
          <div v-if="modelTestResult" class="test-result" :class="{ success: modelTestResult.success, error: !modelTestResult.success }">
            <div class="test-status">
              <span v-if="modelTestResult.success" class="status-icon success">✓</span>
              <span v-else class="status-icon error">✕</span>
              <span class="status-text">{{ modelTestResult.message }}</span>
              <span v-if="modelTestResult.latency" class="test-latency">{{ modelTestResult.latency }}ms</span>
            </div>
            <div v-if="modelTestResult.response" class="test-response">
              <span class="response-label">模型响应：</span>
              <span class="response-text">{{ modelTestResult.response }}</span>
            </div>
            <div v-if="modelTestResult.errorDetail" class="test-error-detail">
              <div class="error-header" @click="toggleErrorDetail">
                <span class="error-toggle">{{ showErrorDetail ? '▼' : '▶' }}</span>
                <span class="error-label">详细错误信息</span>
              </div>
              <div v-show="showErrorDetail" class="error-content">
                <pre v-if="modelTestResult.isJson">{{ formatJson(modelTestResult.errorDetail) }}</pre>
                <div v-else class="error-text">{{ modelTestResult.errorDetail }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="!modelForm.model_id" class="test-hint">
            请先填写模型ID
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModelModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="showAddModal && !modelTestResult?.success"
            @click="saveModel"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则弹窗 -->
    <div v-if="showAddRuleModal || showEditRuleModal" class="modal-overlay" @click="closeRuleModal">
      <div class="modal-content modal-large" @click.stop>
        <h3 class="modal-title">{{ showEditRuleModal ? '编辑规则' : '添加规则' }}</h3>

        <div class="form-group">
          <label class="form-label">规则名称 *</label>
          <input v-model="ruleForm.name" type="text" class="form-input" placeholder="例如：图片理解" />
        </div>

        <div class="form-group">
          <label class="form-label">规则描述</label>
          <input v-model="ruleForm.description" type="text" class="form-input" placeholder="规则描述" />
        </div>

        <div class="form-group">
          <label class="form-label">条件类型 *</label>
          <select v-model="ruleForm.condition_type" class="form-input">
            <option value="has_image">有图片附件</option>
            <option value="deep_think">深度思考模式</option>
            <option value="translate">翻译任务</option>
            <option value="length_range">文本长度范围</option>
            <option value="custom">自定义条件</option>
          </select>
        </div>

        <!-- 条件参数：翻译任务 -->
        <div v-if="ruleForm.condition_type === 'translate'" class="form-group">
          <label class="form-label">关键词列表</label>
          <input
            v-model="translateKeywords"
            type="text"
            class="form-input"
            placeholder="输入关键词，逗号分隔，如：翻译,translate,转成"
          />
          <div class="form-hint">用户消息包含这些关键词时触发</div>
        </div>

        <!-- 条件参数：文本长度 -->
        <div v-if="ruleForm.condition_type === 'length_range'" class="form-group">
          <label class="form-label">长度范围（字符数）</label>
          <div class="range-inputs">
            <input v-model.number="lengthMin" type="number" class="form-input" placeholder="最小" />
            <span class="range-separator">-</span>
            <input v-model.number="lengthMax" type="number" class="form-input" placeholder="最大" />
          </div>
        </div>

        <!-- 条件参数：自定义 -->
        <div v-if="ruleForm.condition_type === 'custom'" class="form-group">
          <label class="form-label">自定义表达式</label>
          <input
            v-model="customExpression"
            type="text"
            class="form-input"
            placeholder="如：message.includes('代码')"
          />
          <div class="form-hint">支持简单表达式，message 为用户消息</div>
        </div>

        <div class="form-group">
          <label class="form-label">目标模型 *</label>
          <select v-model="ruleForm.target_model_id" class="form-input">
            <option value="">请选择模型</option>
            <option v-for="model in enabledModels" :key="model.model_id" :value="model.model_id">
              {{ model.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">优先级</label>
          <input v-model.number="ruleForm.priority" type="number" class="form-input" />
          <div class="form-hint">数值越大优先级越高</div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeRuleModal">取消</button>
          <button class="btn btn-primary" @click="saveRule">保存</button>
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

// Tab 状态
const activeTab = ref('models');

// 模型列表相关
const models = ref([]);
const enabledModels = computed(() => models.value.filter(m => m.enabled));
const showAddModal = ref(false);
const showEditModal = ref(false);
const showParamsHelp = ref(false);

// 规则列表相关
const rules = ref([]);
const showAddRuleModal = ref(false);
const showEditRuleModal = ref(false);
const draggedIndex = ref(null);

// 测试相关
const testMessage = ref('');
const testHasImage = ref(false);
const testDeepThink = ref(false);
const testResult = ref(null);

// 模型表单
const defaultModelForm = {
  id: '',
  model_id: '',
  name: '',
  description: '',
  context_window: 4096,
  max_output_tokens: 2048,
  temperature: 0.7,
  display_order: 0
};
const modelForm = ref({ ...defaultModelForm });

// 模型测试相关
const testingModel = ref(false);
const modelTestResult = ref(null);
const showErrorDetail = ref(false);

// 规则表单
const defaultRuleForm = {
  id: '',
  name: '',
  description: '',
  condition_type: 'length_range',
  condition_value: {},
  target_model_id: '',
  priority: 0,
  enabled: 1
};
const ruleForm = ref({ ...defaultRuleForm });

// 条件参数临时变量
const translateKeywords = ref('');
const lengthMin = ref(0);
const lengthMax = ref(200);
const customExpression = ref('');

// ============================================
// 模型相关方法
// ============================================
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

const closeModelModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  modelForm.value = { ...defaultModelForm };
  modelTestResult.value = null;
  showErrorDetail.value = false;
};

// 切换错误详情显示
const toggleErrorDetail = () => {
  showErrorDetail.value = !showErrorDetail.value;
};

// 格式化 JSON 显示
const formatJson = (str) => {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  } catch {
    return str;
  }
};

// 测试模型连接
const testModel = async () => {
  if (!modelForm.value.model_id) {
    return;
  }

  testingModel.value = true;
  modelTestResult.value = null;
  showErrorDetail.value = false;

  try {
    const response = await fetchAPI('/api/admin/models/test', {
      method: 'POST',
      body: JSON.stringify({
        model_id: modelForm.value.model_id,
        max_tokens: 50
      })
    });

    const data = await response.json();

    if (data.success) {
      modelTestResult.value = {
        success: true,
        message: '模型连接成功',
        response: data.data.response,
        latency: data.data.latency
      };
    } else {
      // 判断错误信息是否是 JSON 格式
      const errorMsg = data.error?.message || '模型连接失败';
      const isJson = errorMsg.startsWith('{') || errorMsg.startsWith('[');

      modelTestResult.value = {
        success: false,
        message: isJson ? '模型返回错误信息' : errorMsg,
        errorDetail: isJson ? errorMsg : null,
        isJson,
        latency: data.error?.latency
      };
    }
  } catch (error) {
    console.error('测试模型失败:', error);
    const errorMsg = error?.message || String(error);
    const isJson = errorMsg.startsWith('{') || errorMsg.startsWith('[');

    modelTestResult.value = {
      success: false,
      message: isJson ? '请求错误' : '网络错误，请检查后端服务',
      errorDetail: isJson ? errorMsg : null,
      isJson
    };
  } finally {
    testingModel.value = false;
  }
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
      closeModelModal();
      loadModels();
      dialog.showSuccess('模型配置已保存');
    } else {
      dialog.showError(data.error?.message || '保存失败');
    }
  } catch (error) {
    console.error('保存模型失败:', error);
    dialog.showError('保存模型失败');
  }
};

const toggleModel = async (model) => {
  // 如果是禁用操作，先检查绑定关系
  if (model.enabled) {
    try {
      const response = await fetchAPI(`/api/admin/models/${model.id}/toggle`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        // 没有绑定关系，直接禁用成功
        loadModels();
        dialog.showSuccess('模型已禁用');
      } else if (data.error?.code === 'MODEL_IN_USE' && data.error?.bindings) {
        // 有绑定关系，显示绑定信息弹窗
        await dialog.showBindings('该模型正在被以下配置使用，请先解除绑定', data.error.bindings);
      } else {
        dialog.showError(data.error?.message || '操作失败');
      }
    } catch (error) {
      console.error('切换模型状态失败:', error);
      dialog.showError('操作失败');
    }
  } else {
    // 启用操作，直接执行
    try {
      const response = await fetchAPI(`/api/admin/models/${model.id}/toggle`, {
        method: 'PUT'
      });

      const data = await response.json();
      if (data.success) {
        loadModels();
        dialog.showSuccess('模型已启用');
      } else {
        dialog.showError(data.error?.message || '操作失败');
      }
    } catch (error) {
      console.error('切换模型状态失败:', error);
      dialog.showError('操作失败');
    }
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
    } else {
      dialog.showError(data.error?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除模型失败:', error);
    dialog.showError('删除模型失败');
  }
};

// ============================================
// 规则相关方法
// ============================================
const loadRules = async () => {
  try {
    const response = await fetchAPI('/api/admin/model-rules');
    const data = await response.json();
    if (data.success) {
      rules.value = data.data;
    }
  } catch (error) {
    console.error('获取规则列表失败:', error);
  }
};

const getRuleIcon = (type) => {
  const icons = {
    has_image: '🖼️',
    deep_think: '🧠',
    translate: '🌐',
    length_range: '📝',
    custom: '⚙️'
  };
  return icons[type] || '📌';
};

const getConditionText = (rule) => {
  // 解析 condition_value（可能是字符串或对象）
  let value = rule.condition_value;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = {};
    }
  }

  switch (rule.condition_type) {
    case 'has_image':
      return '用户上传了图片';
    case 'deep_think':
      return '开启了深度思考模式';
    case 'translate':
      return `消息包含关键词 [${(value.keywords || []).join(', ')}]`;
    case 'length_range':
      return `消息长度 ${value.min}-${value.max} 字符`;
    case 'custom':
      return `自定义: ${value.expression}`;
    default:
      return '未知条件';
  }
};

const editRule = (rule) => {
  ruleForm.value = { ...rule };

  // 解析 condition_value（可能是字符串或对象）
  let value = rule.condition_value;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = {};
    }
  }

  // 解析条件值到临时变量
  if (rule.condition_type === 'translate') {
    translateKeywords.value = (value.keywords || []).join(', ');
  } else if (rule.condition_type === 'length_range') {
    lengthMin.value = value.min || 0;
    lengthMax.value = value.max || 200;
  } else if (rule.condition_type === 'custom') {
    customExpression.value = value.expression || '';
  }

  showEditRuleModal.value = true;
};

const closeRuleModal = () => {
  showAddRuleModal.value = false;
  showEditRuleModal.value = false;
  ruleForm.value = { ...defaultRuleForm };
  translateKeywords.value = '';
  lengthMin.value = 0;
  lengthMax.value = 200;
  customExpression.value = '';
};

const buildConditionValue = () => {
  switch (ruleForm.value.condition_type) {
    case 'has_image':
      return { value: true };
    case 'deep_think':
      return { value: true };
    case 'translate':
      return { keywords: translateKeywords.value.split(',').map(k => k.trim()).filter(Boolean) };
    case 'length_range':
      return { min: lengthMin.value, max: lengthMax.value };
    case 'custom':
      return { expression: customExpression.value };
    default:
      return {};
  }
};

const saveRule = async () => {
  try {
    const conditionValue = buildConditionValue();

    const payload = {
      ...ruleForm.value,
      condition_value: conditionValue
    };

    const url = showEditRuleModal.value
      ? `/api/admin/model-rules/${ruleForm.value.id}`
      : '/api/admin/model-rules';

    const method = showEditRuleModal.value ? 'PUT' : 'POST';

    const response = await fetchAPI(url, {
      method,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.success) {
      closeRuleModal();
      loadRules();
      dialog.showSuccess('规则已保存');
    } else {
      dialog.showError(data.error?.message || '保存失败');
    }
  } catch (error) {
    console.error('保存规则失败:', error);
    dialog.showError('保存规则失败');
  }
};

const toggleRule = async (rule) => {
  try {
    const response = await fetchAPI(`/api/admin/model-rules/${rule.id}/toggle`, {
      method: 'PUT'
    });

    const data = await response.json();
    if (data.success) {
      loadRules();
      dialog.showSuccess(rule.enabled ? '规则已禁用' : '规则已启用');
    } else {
      dialog.showError(data.error?.message || '操作失败');
    }
  } catch (error) {
    console.error('切换规则状态失败:', error);
    dialog.showError('操作失败');
  }
};

const deleteRule = async (rule) => {
  const confirmed = await dialog.showConfirm(`确定要删除规则 "${rule.name}" 吗？`);

  if (!confirmed) return;

  try {
    const response = await fetchAPI(`/api/admin/model-rules/${rule.id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.success) {
      loadRules();
      dialog.showSuccess('规则已删除');
    } else {
      dialog.showError(data.error?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除规则失败:', error);
    dialog.showError('删除规则失败');
  }
};

// 拖拽排序
const onDragStart = (event, index) => {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
};

const onDrop = async (event, targetIndex) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    return;
  }

  const newRules = [...rules.value];
  const [removed] = newRules.splice(draggedIndex.value, 1);
  newRules.splice(targetIndex, 0, removed);

  // 重新计算优先级
  const orders = newRules.map((rule, index) => ({
    id: rule.id,
    priority: newRules.length - index
  }));

  rules.value = newRules;

  try {
    await fetchAPI('/api/admin/model-rules/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orders })
    });
  } catch (error) {
    console.error('更新优先级失败:', error);
    loadRules(); // 回滚
  }

  draggedIndex.value = null;
};

// 测试规则
const testRules = async () => {
  try {
    const response = await fetchAPI('/api/admin/model-rules/test', {
      method: 'POST',
      body: JSON.stringify({
        message: testMessage.value,
        has_image: testHasImage.value,
        deep_think: testDeepThink.value
      })
    });

    const data = await response.json();
    if (data.success) {
      testResult.value = data.data;
    } else {
      dialog.showError(data.error?.message || '测试失败');
    }
  } catch (error) {
    console.error('测试规则失败:', error);
    dialog.showError('测试规则失败');
  }
};

// 初始化
onMounted(() => {
  loadModels();
  loadRules();
});
</script>

<style scoped>
/* Tab 切换 */
.tab-container {
  margin-bottom: 16px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: #f5f5f7;
  padding: 4px;
  border-radius: 10px;
}

.dark .tabs {
  background: #2c2c2e;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #86868b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #1d1d1f;
}

.dark .tab:hover {
  color: #e5e5e7;
}

.tab.active {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .tab.active {
  background: #3a3a3c;
  color: #fff;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 参数帮助图标 */
.params-help-wrapper {
  position: relative;
}

.params-help-icon {
  display: flex;
  align-items: center;
  cursor: help;
  color: #86868b;
  transition: color 0.2s;
}

.params-help-icon:hover {
  color: #0071e3;
}

.params-help-popup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  width: 360px;
  padding: 16px;
  background: #1d1d1f;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.dark .params-help-popup {
  background: #3a3a3c;
}

.help-item {
  margin-bottom: 12px;
}

.help-item:last-child {
  margin-bottom: 0;
}

.help-label {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.help-desc {
  font-size: 12px;
  color: #a1a1a6;
  line-height: 1.5;
}

/* 表格布局 */
.model-table-header {
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

.dark .model-table-header {
  background: #2c2c2e;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.dark .model-row {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.model-row:hover {
  border-color: #0071e3;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.08);
}

/* 列宽定义 */
.col-name {
  width: 320px;
  flex-shrink: 0;
}

.col-desc {
  flex: 1;
  min-width: 120px;
  padding-left: 16px;
}

.col-status {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.col-param {
  width: 90px;
  text-align: center;
  flex-shrink: 0;
}

.col-actions {
  width: 180px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* 模型名称 */
.model-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-icon {
  font-size: 16px;
}

.model-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .model-name-text {
  color: #fff;
}

.model-id {
  margin-top: 4px;
  font-family: 'SF Mono', Monaco, 'Consolas', monospace;
  font-size: 11px;
  color: #86868b;
}

/* 状态标签 */
.col-status {
  display: flex;
  justify-content: center;
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

/* 描述列 */
.col-desc {
  font-size: 13px;
  color: #666;
  padding-right: 16px;
}

.dark .col-desc {
  color: #a1a1a6;
}

/* 参数列 */
.col-param {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .col-param {
  color: #e5e5e7;
}

/* 无权限提示 */
.no-permission {
  font-size: 13px;
  color: #86868b;
}

/* 规则列表 */
.rule-notice {
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

.dark .rule-notice {
  background: #2c2c2e;
}

.notice-icon {
  font-size: 16px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-row {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.15s ease;
}

.dark .rule-row {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

.rule-row:hover {
  border-color: #0071e3;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.08);
}

.rule-row:active {
  cursor: grabbing;
}

.rule-drag {
  display: flex;
  align-items: center;
  padding: 8px;
  color: #86868b;
}

.rule-content {
  flex: 1;
  padding-left: 8px;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rule-icon {
  font-size: 16px;
}

.rule-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.dark .rule-name {
  color: #fff;
}

.rule-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.rule-condition {
  color: #86868b;
}

.rule-arrow {
  color: #d1d1d6;
}

.rule-target {
  color: #0071e3;
  font-weight: 500;
}

.rule-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #86868b;
}

/* 测试面板 */
.test-panel {
  margin-top: 24px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
}

.dark .test-panel {
  background: #2c2c2e;
}

.test-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.dark .test-panel-header {
  color: #fff;
}

.test-icon {
  font-size: 16px;
}

.test-panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.test-input {
  flex: 1;
  min-width: 200px;
}

.test-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.dark .test-checkbox {
  color: #a1a1a6;
}

.test-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.test-result {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
}

.dark .test-result {
  background: #3a3a3c;
}

.result-label {
  color: #86868b;
}

.result-rule {
  color: #0071e3;
}

.result-model {
  color: #2e7d32;
  font-weight: 600;
}

.dark .result-model {
  color: #a5d6a7;
}

/* 按钮 */
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
  width: 560px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.form-input:disabled {
  background: #f5f5f7;
  color: #86868b;
}

.dark .form-input {
  background: #1c1c1e;
  border-color: #3a3a3c;
  color: #fff;
}

.dark .form-input:disabled {
  background: #2c2c2e;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #86868b;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs .form-input {
  flex: 1;
}

.range-separator {
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

/* 模型测试区域 */
.test-model-section {
  margin-top: 20px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
}

.dark .test-model-section {
  background: #3a3a3c;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.dark .test-label {
  color: #e5e5e7;
}

.test-hint {
  margin-top: 12px;
  font-size: 13px;
  color: #86868b;
}

.test-result {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.dark .test-result {
  background: #2c2c2e;
}

.test-result.success {
  border-left: 3px solid #10b981;
}

.test-result.error {
  border-left: 3px solid #ef4444;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.status-icon.success {
  background: #10b981;
  color: #fff;
}

.status-icon.error {
  background: #ef4444;
  color: #fff;
}

.status-text {
  font-size: 13px;
  color: #1d1d1f;
}

.dark .status-text {
  color: #e5e5e7;
}

.test-latency {
  margin-left: auto;
  font-size: 12px;
  color: #86868b;
}

.test-response {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e5e5;
}

.dark .test-response {
  border-top-color: #3a3a3c;
}

.response-label {
  font-size: 12px;
  color: #86868b;
}

.response-text {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.dark .response-text {
  color: #e5e5e7;
}

/* 错误详情区域 */
.test-error-detail {
  margin-top: 12px;
  border-top: 1px solid #e5e5e5;
  padding-top: 12px;
}

.dark .test-error-detail {
  border-top-color: #3a3a3c;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.error-header:hover {
  opacity: 0.8;
}

.error-toggle {
  font-size: 10px;
  color: #86868b;
}

.error-label {
  font-size: 12px;
  color: #86868b;
}

.error-content {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.error-content pre {
  margin: 0;
  padding: 12px;
  background: #1d1d1f;
  border-radius: 8px;
  font-size: 11px;
  color: #f5f5f7;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-content .error-text {
  padding: 12px;
  background: #fee2e2;
  border-radius: 8px;
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
}

.dark .error-content .error-text {
  background: #4a1c1c;
  color: #fecaca;
}
</style>