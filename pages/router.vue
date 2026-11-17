<template>
  <div class="router-page">
    <!-- 页头 -->
    <header class="page-head">
      <div>
        <h3 class="page-title">智能路由配置</h3>
        <p class="page-desc">
          用户输入与模型之间的调度策略：图片附件 → 视觉模型，深度思考 → 大模型，
          生图意图 → 文生图模型，其余按规则降级。保存后立即生效。
        </p>
      </div>
      <div class="head-status" :class="config.enabled ? 'on' : 'off'">
        <span class="status-dot"></span>
        {{ config.enabled ? '路由已启用' : '路由已停用' }}
      </div>
    </header>

    <!-- 总开关卡片 -->
    <section class="panel switch-panel">
      <div class="panel-main">
        <div class="panel-text">
          <div class="panel-title">启用智能路由</div>
          <div class="panel-hint">关闭后所有请求直接使用下方「降级模型」</div>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="config.enabled" />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <!-- 直达模型 -->
    <section class="panel">
      <div class="panel-head">
        <span class="panel-badge" :class="{ disabled: !config.enabled }">1</span>
        <div>
          <div class="panel-title">直达模型</div>
          <div class="panel-hint">确定性场景零延迟直达，不经过意图分类</div>
        </div>
      </div>
      <div class="panel-body grid-3">
        <div class="field">
          <label class="field-label">视觉模型<small>消息带图片附件时使用</small></label>
          <select v-model="config.vision_model" class="field-select">
            <optgroup v-if="modelsByCapabilities('vision').length" label="视觉模型">
              <option v-for="m in modelsByCapabilities('vision')" :key="m.model_id" :value="m.model_id">
                {{ m.name }}
              </option>
            </optgroup>
            <optgroup label="其他可用模型">
              <option v-for="m in modelsByCapabilities('chat')" :key="m.model_id" :value="m.model_id">
                {{ m.name }}
              </option>
            </optgroup>
            <option v-if="!hasModel(config.vision_model)" :value="config.vision_model">
              当前值：{{ config.vision_model }}（未在模型配置中）
            </option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">深度思考模型<small>前端"深度思考"开关开启时使用</small></label>
          <select v-model="config.deep_think_model" class="field-select">
            <optgroup label="对话模型">
              <option v-for="m in modelsByCapabilities('chat')" :key="m.model_id" :value="m.model_id">
                {{ m.name }}
              </option>
            </optgroup>
            <option v-if="!hasModel(config.deep_think_model)" :value="config.deep_think_model">
              当前值：{{ config.deep_think_model }}（未在模型配置中）
            </option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">文生图模型<small>生图意图命中时使用</small></label>
          <select v-model="config.image_model" class="field-select">
            <optgroup label="文生图模型">
              <option v-for="m in modelsByCapabilities('image')" :key="m.model_id" :value="m.model_id">
                {{ m.name }}
              </option>
            </optgroup>
            <option v-if="!hasModel(config.image_model)" :value="config.image_model">
              当前值：{{ config.image_model }}（未在模型配置中）
            </option>
          </select>
        </div>
      </div>
      <div v-if="!modelsByCapabilities('image').length" class="panel-tip">
        文生图模型列表为空，可前往「模型配置」添加 capabilities=image 的模型
      </div>
    </section>

    <!-- 降级模型 -->
    <section class="panel">
      <div class="panel-head">
        <span class="panel-badge">2</span>
        <div>
          <div class="panel-title">降级模型</div>
          <div class="panel-hint">以上意图均未命中（或路由总开关关闭）时使用的兜底对话模型</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="field" style="max-width: 420px">
          <label class="field-label">兜底模型<small>建议选择响应快的中等参数模型</small></label>
          <select v-model="config.fallback_model" class="field-select">
            <optgroup label="对话模型">
              <option v-for="m in modelsByCapabilities('chat')" :key="m.model_id" :value="m.model_id">
                {{ m.name }}
              </option>
            </optgroup>
            <option v-if="!hasModel(config.fallback_model)" :value="config.fallback_model">
              当前值：{{ config.fallback_model }}（未在模型配置中）
            </option>
          </select>
        </div>
      </div>
    </section>

    <!-- 生图关键词 -->
    <section class="panel">
      <div class="panel-head">
        <span class="panel-badge" :class="{ disabled: !config.enabled }">3</span>
        <div>
          <div class="panel-title">生图关键词（快速通道）</div>
          <div class="panel-hint">命中任一关键词直接路由到文生图模型，零延迟、不消耗分类调用</div>
        </div>
        <span class="panel-count">{{ keywordList.length }} 个</span>
      </div>
      <div class="panel-body">
        <textarea
          v-model="keywordsText"
          class="field-textarea keywords-area"
          rows="7"
          placeholder="每行一个关键词，例如：&#10;画一张&#10;帮我画&#10;generate an image"
        ></textarea>
        <div class="field-foot">
          <span>按行编辑，保存时自动去除空行</span>
          <button class="btn ghost sm" type="button" @click="restoreDefaultKeywords">恢复默认关键词</button>
        </div>
      </div>
    </section>

    <!-- LLM 意图理解 -->
    <section class="panel">
      <div class="panel-head">
        <span class="panel-badge" :class="{ disabled: !config.enabled || !config.classify_enabled }">4</span>
        <div>
          <div class="panel-title">LLM 意图理解</div>
          <div class="panel-hint">关键词未命中时，用低成本小模型判断用户是否想要生成图片</div>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="config.classify_enabled" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="panel-body" :class="{ muted: !config.classify_enabled }">
        <div class="grid-3">
          <div class="field">
            <label class="field-label">分类模型<small>建议使用小参数模型</small></label>
            <select v-model="config.classify_model" class="field-select" :disabled="!config.classify_enabled">
              <optgroup label="对话模型">
                <option v-for="m in modelsByCapabilities('chat')" :key="m.model_id" :value="m.model_id">
                  {{ m.name }}
                </option>
              </optgroup>
              <option v-if="!hasModel(config.classify_model)" :value="config.classify_model">
                当前值：{{ config.classify_model }}（未在模型配置中）
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">超时（毫秒）<small>500 – 30000，超时即降级</small></label>
            <input
              v-model.number="config.classify_timeout_ms"
              class="field-input"
              type="number"
              min="500"
              max="30000"
              step="500"
              :disabled="!config.classify_enabled"
            />
          </div>
          <div class="field">
            <label class="field-label">置信度阈值<small>0 – 1，低于阈值按文本处理</small></label>
            <div class="range-wrap">
              <input
                v-model.number="config.confidence_threshold"
                class="range"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :disabled="!config.classify_enabled"
              />
              <span class="range-value">{{ Number(config.confidence_threshold).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="field mt-16">
          <label class="field-label">
            分类提示词<small>few-shot 提示词，<code>{{ messagePlaceholder }}</code> 会被替换为用户消息</small>
          </label>
          <textarea
            v-model="config.llm_prompt"
            class="field-textarea prompt-area"
            rows="10"
            :disabled="!config.classify_enabled"
          ></textarea>
        </div>
      </div>
    </section>

    <!-- 测试 -->
    <section class="panel">
      <div class="panel-head">
        <span class="panel-badge">5</span>
        <div>
          <div class="panel-title">路由测试</div>
          <div class="panel-hint">输入一句话预览关键词命中结果（不调用模型、不产生费用）</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="test-row">
          <input
            v-model="testMessage"
            class="field-input"
            type="text"
            placeholder="例如：帮我画一张雪山日落"
            @keydown.enter.prevent="runTest"
          />
          <button class="btn primary" :disabled="!testMessage.trim() || testing" @click="runTest">
            {{ testing ? '测试中…' : '测试' }}
          </button>
        </div>
        <transition name="fade">
          <div v-if="testResult" class="test-result" :class="testResult.intent === 'image_generation' ? 'hit' : 'miss'">
            <div class="result-row">
              <span class="result-label">意图</span>
              <span class="result-value" :class="testResult.intent === 'image_generation' ? 'hit' : ''">
                {{ testResult.intent }}
              </span>
            </div>
            <div class="result-row">
              <span class="result-label">目标模型</span>
              <span class="result-value mono">{{ testResult.targetModel }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">判定依据</span>
              <span class="result-value">{{ testResult.reason }}（置信度 {{ testResult.confidence }}）</span>
            </div>
          </div>
        </transition>
      </div>
    </section>

    <!-- 粘性操作栏 -->
    <div class="action-bar">
      <span v-if="saveMsg" :class="['save-msg', saveOk ? 'ok' : 'fail']">
        <span class="save-dot"></span>{{ saveMsg }}
      </span>
      <span v-else class="save-hint">修改后点击保存立即生效</span>
      <div class="action-btns">
        <button class="btn ghost" :disabled="loading" @click="loadConfig">重置更改</button>
        <button class="btn primary" :disabled="loading || saving" @click="saveConfig">
          {{ saving ? '保存中…' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminAuth } from '~/composables/useAdminAuth';

const { fetchAPI } = useAdminAuth();

const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const saveMsg = ref('');
const saveOk = ref(false);
const testMessage = ref('');
const testResult = ref(null);
const keywordsText = ref('');
const availableModels = ref([]);
const messagePlaceholder = '{{MESSAGE}}';

const DEFAULT_KEYWORDS = [
  '画一张', '画一幅', '画一个', '画个', '画只', '画张', '帮我画', '给我画',
  '生成一张', '生成一幅', '生成一个', '生成图片', '生成图像', '生成插画', '生成海报',
  '生成头像', '生成壁纸', '生成logo', '生成 Logo', '生成图标',
  '绘制一张', '绘制一幅', '绘制图片', '制作一张', '制作一幅', '创建一张', '创建一幅',
  '设计一张', '设计一幅', '文生图', 'text to image', 'text-to-image',
  'generate an image', 'generate a picture', 'generate an illustration',
  'create an image', 'create a picture', 'make an image', 'draw me', 'draw a picture',
  'draw an image', 'paint a picture', 'paint an image', 'render an image',
];

const defaultConfig = () => ({
  enabled: true,
  vision_model: '@cf/meta/llama-3.2-11b-vision-instruct',
  deep_think_model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  image_model: '@cf/black-forest-labs/flux-1-schnell',
  fallback_model: '@cf/meta/llama-3.2-3b-instruct',
  image_keywords: [...DEFAULT_KEYWORDS],
  classify_enabled: true,
  classify_model: '@cf/meta/llama-3.2-1b-instruct',
  classify_timeout_ms: 4000,
  confidence_threshold: 0.6,
  llm_prompt: '',
});

const config = ref(defaultConfig());

const keywordList = computed(() => keywordsText.value.split('\n').map((k) => k.trim()).filter(Boolean));

const modelsByCapabilities = (cap) =>
  availableModels.value.filter((m) => (m.capabilities || 'chat') === cap);

const hasModel = (modelId) => availableModels.value.some((m) => m.model_id === modelId);

const loadModels = async () => {
  try {
    const response = await fetchAPI('/api/admin/models');
    const body = await response.json();
    const list = body.data || [];
    availableModels.value = list.filter((m) => m.enabled === 1 || m.enabled === true);
  } catch (err) {
    console.error('Load models error:', err);
    availableModels.value = [];
  }
};

const loadConfig = async () => {
  loading.value = true;
  try {
    const response = await fetchAPI('/api/admin/router-config');
    const body = await response.json();
    if (body && body.data && body.data.config) {
      config.value = { ...defaultConfig(), ...body.data.config };
    }
    keywordsText.value = (config.value.image_keywords || []).join('\n');
  } catch (err) {
    console.error('Load router config error:', err);
    saveMsg.value = '加载失败，当前为代码默认配置';
    saveOk.value = false;
  } finally {
    loading.value = false;
  }
};

const restoreDefaultKeywords = () => {
  keywordsText.value = DEFAULT_KEYWORDS.join('\n');
};

const saveConfig = async () => {
  if (saving.value) return;
  saving.value = true;
  saveMsg.value = '';
  try {
    const response = await fetchAPI('/api/admin/router-config', {
      method: 'PUT',
      body: JSON.stringify({
        config: { ...config.value, image_keywords: keywordList.value },
      }),
    });
    const body = await response.json();
    if (body.success) {
      config.value = { ...defaultConfig(), ...body.data.config };
      keywordsText.value = (config.value.image_keywords || []).join('\n');
      saveMsg.value = '已保存并生效';
      saveOk.value = true;
    } else {
      saveMsg.value = body.error?.message || '保存失败';
      saveOk.value = false;
    }
  } catch (err) {
    console.error('Save router config error:', err);
    saveMsg.value = '保存失败，请重试';
    saveOk.value = false;
  } finally {
    saving.value = false;
    setTimeout(() => { saveMsg.value = ''; }, 4000);
  }
};

const runTest = async () => {
  if (!testMessage.value.trim() || testing.value) return;
  testing.value = true;
  testResult.value = null;
  try {
    const response = await fetchAPI('/api/admin/router-config/test', {
      method: 'POST',
      body: JSON.stringify({ message: testMessage.value }),
    });
    const body = await response.json();
    if (body.success) {
      testResult.value = body.data;
    }
  } catch (err) {
    console.error('Test router error:', err);
  } finally {
    testing.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadModels(), loadConfig()]);
});
</script>

<style scoped>
.router-page {
  --brand: #3964fe;
  --brand-soft: rgba(57, 100, 254, 0.08);
  --border: rgba(5, 5, 5, 0.08);
  --border-strong: rgba(5, 5, 5, 0.12);
  --text-1: #1d1d1f;
  --text-2: #6e6e80;
  --text-3: #9b9b9e;
  --bg-soft: rgba(5, 5, 5, 0.03);
  padding-bottom: 120px;
}

/* 页头 */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-1);
}

.page-desc {
  margin: 0;
  max-width: 620px;
  font-size: 13px;
  line-height: 21px;
  color: var(--text-2);
}

.head-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-soft);
  color: var(--text-2);
}

.head-status.on {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.head-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
}

.head-status.on .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
}

/* 面板 */
.panel {
  margin-bottom: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.panel:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(to bottom, #fff, rgba(249, 250, 251, 0.6));
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
}

.panel-badge.disabled {
  background: var(--bg-soft);
  color: var(--text-3);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--text-1);
}

.panel-hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-2);
}

.panel-count {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--bg-soft);
  font-size: 12px;
  color: var(--text-2);
}

.panel-body {
  padding: 20px;
}

.panel-body.muted {
  opacity: 0.55;
  pointer-events: none;
}

.panel-tip {
  padding: 10px 20px;
  border-top: 1px solid var(--border);
  background: rgba(245, 158, 11, 0.06);
  font-size: 12px;
  color: #b45309;
}

.switch-panel .panel-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}

.panel-text .panel-title {
  margin-bottom: 2px;
}

/* 栅格 */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.mt-16 {
  margin-top: 16px;
}

/* 字段 */
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}

.field-label small {
  font-size: 12px;
  font-weight: 400;
  line-height: 17px;
  color: var(--text-2);
}

.field-select,
.field-input,
.field-textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: #fff;
  color: var(--text-1);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input {
  height: 40px;
  padding: 0 12px;
}

.field-select {
  height: 40px;
  padding: 0 36px 0 12px;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8l3.5-3.5' fill='none' stroke='%236e6e80' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.field-textarea {
  padding: 10px 12px;
  line-height: 20px;
  resize: vertical;
  font-size: 12.5px;
}

.field-select:hover,
.field-input:hover,
.field-textarea:hover {
  border-color: rgba(5, 5, 5, 0.2);
}

.field-select:focus,
.field-input:focus,
.field-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(57, 100, 254, 0.12);
}

.field-select:disabled,
.field-input:disabled,
.field-textarea:disabled {
  background: var(--bg-soft);
  color: var(--text-3);
  cursor: not-allowed;
}

.keywords-area {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
}

.prompt-area {
  font-size: 12px;
  line-height: 19px;
}

.field-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-3);
}

/* 滑杆 */
.range-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
}

.range {
  flex: 1;
  accent-color: var(--brand);
  cursor: pointer;
}

.range-value {
  min-width: 44px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* 开关 */
.switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: rgba(5, 5, 5, 0.16);
  transition: background 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s;
}

.switch input:checked + .slider {
  background: var(--brand);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* 测试 */
.test-row {
  display: flex;
  gap: 10px;
}

.test-row .field-input {
  flex: 1;
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
}

.test-result.hit {
  border-color: rgba(57, 100, 254, 0.28);
  background: var(--brand-soft);
}

.result-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
}

.result-label {
  min-width: 64px;
  color: var(--text-2);
  font-size: 12px;
}

.result-value {
  color: var(--text-1);
  word-break: break-all;
}

.result-value.hit {
  color: var(--brand);
  font-weight: 600;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
}

/* 操作栏（粘底） */
.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.05);
}

.save-hint {
  font-size: 12px;
  color: var(--text-3);
}

.save-msg {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}

.save-msg.ok {
  color: #15803d;
}

.save-msg.fail {
  color: #d92d20;
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.action-btns {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

/* 按钮 */
.btn {
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn.primary {
  background: var(--brand);
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: #2f57e6;
}

.btn.ghost {
  background: var(--bg-soft);
  color: var(--text-1);
}

.btn.ghost:hover:not(:disabled) {
  background: rgba(5, 5, 5, 0.07);
}

.btn.sm {
  padding: 5px 12px;
  font-size: 12px;
}

/* 过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

code {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(5, 5, 5, 0.06);
  font-size: 11.5px;
}

@media (max-width: 720px) {
  .page-head {
    flex-direction: column;
    gap: 12px;
  }

  .test-row {
    flex-direction: column;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .action-btns {
    margin-left: 0;
  }
}
</style>