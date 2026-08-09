<template>
  <div :class="$style.groupList">
    <details
      v-for="group in applicationGroups"
      :key="group.freelancerId"
      :class="$style.group"
      open
    >
      <summary :class="$style.groupSummary">
        <span>
          <strong>担当者: {{ group.name }}</strong>
          <small>{{ group.role }} / {{ group.availability }}</small>
        </span>
        <TagBadge tone="blue">{{ group.applications.length }}件</TagBadge>
      </summary>

      <div :class="$style.itemList">
        <article
          v-for="application in group.applications"
          :key="application.id"
          :class="$style.item"
        >
          <div :class="$style.itemMain">
            <strong>{{ getJob(application.jobId)?.title || "" }}</strong>
            <span>{{ application.appliedAt }} / {{ application.status }}</span>
            <StreamBadge :value="getJob(application.jobId)?.stream || ''" />
          </div>
          <StatusBadge :value="group.availability" />
          <select
            :class="$style.control"
            :value="application.status"
            @change="onStatusChange(application.id, $event)"
          >
            <option v-for="status in statuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
          <BaseButton
            v-if="withResume"
            variant="secondary"
            icon="search"
            @click="selectPreview(application.freelancerId)"
            >レジュメ</BaseButton
          >
        </article>
      </div>
    </details>
    <div v-if="!applicationGroups.length" :class="$style.empty">該当なし</div>
  </div>
</template>

<script setup lang="ts">
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
import { computed } from "vue";
import type { Application } from "~/composables/frichy/types";

const props = withDefaults(
  defineProps<{
    applications?: Application[];
    withResume?: boolean;
  }>(),
  {
    withResume: false,
  },
);

const {
  state,
  statuses,
  getFreelancer,
  getJob,
  changeApplicationStatus,
  selectPreview,
} = useFrichyRuntime();

const applications = computed(() => props.applications || state.value.applications);

const applicationGroups = computed(() =>
  applications.value.reduce<
    Array<{
      freelancerId: string;
      name: string;
      role: string;
      availability: string;
      applications: Application[];
    }>
  >((groups, application) => {
    const freelancer = getFreelancer(application.freelancerId);
    const groupId = application.freelancerId || "unknown";
    let group = groups.find((item) => item.freelancerId === groupId);
    if (!group) {
      group = {
        freelancerId: groupId,
        name: freelancer?.name || "不明",
        role: freelancer?.role || "役割未設定",
        availability: freelancer?.availability || "",
        applications: [],
      };
      groups.push(group);
    }
    group.applications.push(application);
    return groups;
  }, []),
);

function onStatusChange(applicationId: string, event: Event) {
  changeApplicationStatus(applicationId, (event.target as HTMLSelectElement).value);
}
</script>

<style module>
.groupList {
  display: grid;
  gap: 12px;
}

.group {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.groupSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  background: var(--primary-soft);
  cursor: pointer;
}

.groupSummary span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.groupSummary strong,
.groupSummary small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.groupSummary small {
  color: var(--muted);
}

.itemList {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, auto) minmax(140px, 180px) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
}

.itemMain {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.itemMain strong,
.itemMain span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.itemMain span {
  color: var(--muted);
  font-size: 12px;
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

@media (max-width: 900px) {
  .item {
    grid-template-columns: 1fr;
  }

  .item button,
  .item select {
    width: 100%;
  }
}
</style>
