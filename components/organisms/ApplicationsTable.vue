<template>
  <table :class="$style.table">
    <thead>
      <tr>
        <th>応募日</th>
        <th>案件</th>
        <th>応募者</th>
        <th>稼働</th>
        <th>ステータス</th>
        <th v-if="withResume">レジュメ</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="application in state.applications" :key="application.id">
        <td data-label="応募日">{{ application.appliedAt }}</td>
        <td data-label="案件">
          {{ getJob(application.jobId)?.title || "" }}<br />
          <TagBadge :tone="streamTone(getJob(application.jobId)?.stream || '')">
            {{ getJob(application.jobId)?.stream || "" }}
          </TagBadge>
        </td>
        <td data-label="応募者">
          {{ getFreelancer(application.freelancerId)?.name || "" }}<br />
          {{ getFreelancer(application.freelancerId)?.role || "" }}
        </td>
        <td data-label="稼働">
          <StatusBadge :value="getFreelancer(application.freelancerId)?.availability || ''" />
        </td>
        <td data-label="ステータス">
          <select :class="$style.control" :value="application.status" @change="onStatusChange(application.id, $event)">
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </td>
        <td v-if="withResume" data-label="レジュメ">
          <BaseButton variant="secondary" icon="search" @click="selectPreview(application.freelancerId)">確認</BaseButton>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
withDefaults(defineProps<{
  withResume?: boolean;
}>(), {
  withResume: false
});

const {
  state,
  statuses,
  getFreelancer,
  getJob,
  streamTone,
  changeApplicationStatus,
  selectPreview
} = useTryangleFreelance();

function onStatusChange(applicationId: string, event: Event) {
  changeApplicationStatus(applicationId, (event.target as HTMLSelectElement).value);
}
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

.control {
  width: 100%;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 10px 11px;
  background: #fff;
  color: var(--ink);
  outline: none;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
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

  .table td button,
  .table td select {
    width: 100%;
  }
}
</style>
