<template>
  <table :class="$style.table">
    <thead>
      <tr>
        <th>案件</th>
        <th>単価</th>
        <th>並び替え</th>
        <th>公開</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td :class="$style.stateCell" colspan="4">案件を取得しています。</td>
      </tr>
      <tr v-else-if="displayJobs.length === 0">
        <td :class="$style.stateCell" colspan="4">
          条件に合う案件はありません。
        </td>
      </tr>
      <template v-else>
        <tr v-for="job in displayJobs" :key="job.id">
          <td data-label="案件">{{ job.title }}<br />{{ job.client }}</td>
          <td data-label="単価">{{ job.rateMin }}-{{ job.rateMax }}万円</td>
          <td data-label="並び替え">
            <BaseButton variant="secondary" @click="toggleJobSort(job.id)">{{
              job.sortFlag ? "上位" : "通常"
            }}</BaseButton>
          </td>
          <td data-label="公開">
            <BaseButton variant="secondary" @click="toggleJobActive(job.id)">{{
              job.active ? "公開" : "停止"
            }}</BaseButton>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
import type { Job } from "~/composables/frichy/types";

const props = defineProps<{
  jobs?: Job[];
  loading?: boolean;
}>();

const { state, toggleJobSort, toggleJobActive } = useFrichyRuntime();

const displayJobs = computed(() => props.jobs ?? state.value.jobs);
</script>

<style module>
.table {
  width: 100%;
  min-width: 720px;
  max-width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 11px 9px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
  font-size: 13px;
}

.table th {
  color: var(--muted);
  font-size: 12px;
  background: var(--primary-soft);
}

.stateCell {
  color: var(--muted);
  text-align: center;
}

@media (max-width: 620px) {
  .table,
  .table thead,
  .table tbody,
  .table tr,
  .table th,
  .table td {
    display: block;
  }

  .table {
    min-width: 0;
  }

  .table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .table tr {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    padding: 8px;
    margin-bottom: 10px;
  }

  .table td {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 5px;
    align-items: start;
    min-width: 0;
    border-bottom: 1px solid #edf2f7;
    padding: 10px 4px;
    overflow-wrap: anywhere;
  }

  .table td > * {
    min-width: 0;
    max-width: 100%;
  }

  .table td:last-child {
    border-bottom: 0;
  }

  .table td::before {
    content: attr(data-label);
    color: var(--muted);
    font-size: 12px;
    font-weight: 800;
  }

  .table td button {
    width: 100%;
  }
}
</style>
