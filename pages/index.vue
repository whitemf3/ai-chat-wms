<template>
  <div>
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">用户总数</div>
        <div class="stat-value">{{ stats.users?.total || 0 }}</div>
        <div class="stat-change positive">今日新增 {{ stats.users?.newToday || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">对话总数</div>
        <div class="stat-value">{{ stats.conversations?.total || 0 }}</div>
        <div class="stat-change positive">今日新增 {{ stats.conversations?.newToday || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">消息总数</div>
        <div class="stat-value">{{ stats.messages?.total || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">分享链接</div>
        <div class="stat-value">{{ stats.shares?.total || 0 }}</div>
        <div class="stat-change">有效 {{ stats.shares?.active || 0 }}</div>
      </div>
    </div>

    <!-- 模型使用统计 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">模型使用排行</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>使用次数</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.modelUsage" :key="item.model">
              <td>{{ item.model }}</td>
              <td>{{ item.count }}</td>
              <td>{{ getPercentage(item.count) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 增长趋势 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">最近7天增长趋势</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>新增用户</th>
              <th>新增对话</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in combinedGrowth" :key="index">
              <td>{{ item.date }}</td>
              <td>{{ item.userCount }}</td>
              <td>{{ item.conversationCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminAuth } from '~/composables/useAdminAuth';

definePageMeta({
  middleware: ['admin']
});

const { fetchAPI } = useAdminAuth();
const stats = ref({
  users: {},
  conversations: {},
  messages: {},
  shares: {},
  modelUsage: [],
  charts: {
    userGrowth: [],
    conversationGrowth: []
  }
});

const combinedGrowth = computed(() => {
  const userMap = new Map(stats.value.charts.userGrowth.map(item => [item.date, item.count]));
  const convMap = new Map(stats.value.charts.conversationGrowth.map(item => [item.date, item.count]));

  const dates = [...new Set([...userMap.keys(), ...convMap.keys()])].sort();

  return dates.map(date => ({
    date,
    userCount: userMap.get(date) || 0,
    conversationCount: convMap.get(date) || 0
  }));
});

const getPercentage = (count) => {
  const total = stats.value.modelUsage.reduce((sum, item) => sum + item.count, 0);
  return total > 0 ? Math.round((count / total) * 100) : 0;
};

onMounted(async () => {
  try {
    const response = await fetchAPI('/api/admin/dashboard/stats');
    const data = await response.json();
    if (data.success) {
      stats.value = data.data;
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
});
</script>