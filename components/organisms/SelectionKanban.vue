<template>
  <div :class="$style.kanban">
    <div v-for="status in statuses" :key="status" :class="$style.lane">
      <h3>{{ status }} {{ applicationsByStatus(status).length }}</h3>
      <div :class="$style.cardList">
        <div v-for="application in applicationsByStatus(status)" :key="application.id" :class="$style.card">
          <strong>{{ getFreelancer(application.freelancerId)?.name || "不明" }}</strong>
          <p>{{ getJob(application.jobId)?.title || "不明な案件" }}</p>
          <select :class="$style.control" :value="application.status" @change="onStatusChange(application.id, $event)">
            <option v-for="option in statuses" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
        <div v-if="applicationsByStatus(status).length === 0" :class="$style.empty">該当なし</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { ApplicationStatus } from "~/composables/useTryangleFreelance";

const { state, statuses, getFreelancer, getJob, changeApplicationStatus } = useTryangleFreelance();

function applicationsByStatus(status: ApplicationStatus) {
  return state.value.applications.filter((application) => application.status === status);
}

function onStatusChange(applicationId: string, event: Event) {
  changeApplicationStatus(applicationId, (event.target as HTMLSelectElement).value);
}
</script>

<style module>
.kanban {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 12px;
  overflow-x: auto;
  max-width: 100%;
  min-width: 0;
}

.lane {
  min-height: 260px;
  background: var(--primary-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
}

.lane h3 {
  margin: 0 0 10px;
  color: #10294f;
  font-size: 14px;
}

.cardList {
  display: grid;
  gap: 10px;
}

.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
}

.card p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.6;
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

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

@media (max-width: 1180px) {
  .kanban {
    grid-template-columns: repeat(4, minmax(220px, 1fr));
  }
}

@media (max-width: 620px) {
  .kanban {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .lane {
    min-height: 0;
  }
}
</style>
