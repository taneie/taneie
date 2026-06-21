<template>
  <article :class="$style.card">
    <div :class="$style.desktopCard">
      <div :class="$style.cardMain">
        <div :class="$style.cardHead">
          <div>
            <h3>{{ job.title }}</h3>
            <p :class="$style.metaLine">
              {{ job.client }} / {{ job.rateMin }}-{{ job.rateMax }}万円 /
              マージン{{ job.marginRate ?? 12 }}% / {{ job.remote }}
            </p>
          </div>
        </div>

        <p :class="$style.summaryText">{{ job.summary }}</p>

        <div :class="$style.tags">
          <TagBadge
            v-for="skill in job.required"
            :key="`required-${job.id}-${skill}`"
            >{{ skill }}</TagBadge
          >
          <TagBadge
            v-for="skill in job.nice"
            :key="`nice-${job.id}-${skill}`"
            tone="rose"
            >{{ skill }}</TagBadge
          >
        </div>
      </div>

      <aside :class="$style.cardAside">
        <TagBadge :tone="streamTone(job.stream)">{{ job.stream }}</TagBadge>
        <div :class="$style.desktopActions">
          <BaseButton
            v-if="role === 'freelancer'"
            :class="$style.applyButton"
            icon="send"
            :disabled="applied || !canApplyMore"
            @click="$emit('apply', job.id)"
          >
            {{ applyButtonLabel }}
          </BaseButton>
          <BaseButton
            v-else
            :class="$style.applyButton"
            variant="secondary"
            icon="briefcase"
            @click="$emit('openAdmin')"
          >
            営業管理で確認
          </BaseButton>
        </div>
      </aside>
    </div>

    <details :class="$style.mobileCard">
      <summary :class="$style.mobileSummary">
        <span :class="$style.mobileHead">
          <span :class="$style.mobileTitle">{{ job.title }}</span>
          <span :class="$style.mobileChevron" aria-hidden="true">⌄</span>
        </span>
        <p :class="$style.metaLine">
          {{ job.client }} / {{ job.rateMin }}-{{ job.rateMax }}万円 /
          マージン{{ job.marginRate ?? 12 }}% / {{ job.remote }}
        </p>
        <span :class="$style.mobileBadges">
          <TagBadge :tone="streamTone(job.stream)">{{ job.stream }}</TagBadge>
        </span>
        
      </summary>

      <div :class="$style.mobileDetail">
        <span :class="$style.mobileDescription">{{ job.summary }}</span>
        <span :class="$style.mobileTags">
          <TagBadge
            v-for="skill in job.required"
            :key="`mobile-summary-required-${job.id}-${skill}`"
            >{{ skill }}</TagBadge
          >
          <TagBadge
            v-for="skill in job.nice"
            :key="`mobile-summary-nice-${job.id}-${skill}`"
            tone="rose"
            >{{ skill }}</TagBadge
          >
        </span>

        
        <div :class="$style.mobileActions">
          <BaseButton
            v-if="role === 'freelancer'"
            icon="send"
            :disabled="applied || !canApplyMore"
            @click="$emit('apply', job.id)"
          >
            {{ applyButtonLabel }}
          </BaseButton>
          <BaseButton
            v-else
            variant="secondary"
            icon="briefcase"
            @click="$emit('openAdmin')"
          >
            営業管理で確認
          </BaseButton>
        </div>
      </div>
    </details>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTryangleRuntime } from "~/composables/tryangle/useTryangleRuntime";
import type { Job, Role } from "~/composables/tryangle/types";

const props = withDefaults(
  defineProps<{
    job: Job;
    role: Role | null;
    applied: boolean;
    canApplyMore?: boolean;
  }>(),
  {
    canApplyMore: true,
  },
);

defineEmits<{
  apply: [jobId: string];
  openAdmin: [];
}>();

const { streamTone } = useTryangleRuntime();

const applyButtonLabel = computed(() => {
  if (props.applied) return "応募済み";
  if (!props.canApplyMore) return "応募上限";
  return "応募する";
});
</script>

<style module>
.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.05);
}

.desktopCard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 190px);
  gap: 18px;
  align-items: stretch;
}

.cardMain,
.cardHead,
.cardHead > div,
.cardAside {
  min-width: 0;
}

.cardHead {
  display: grid;
  gap: 8px;
}

.cardAside {
  display: grid;
  justify-items: end;
  align-content: stretch;
  gap: 12px;
  min-width: 160px;
  min-height: 100%;
}

.card h3 {
  min-width: 0;
  margin: 0;
  color: #10294f;
  font-size: 17px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.card p,
.mobileDescription {
  overflow-wrap: anywhere;
  color: var(--muted);
  line-height: 1.6;
}

.metaLine {
  margin: 8px 0;
  font-size: 13px;
}

.summaryText {
  margin: 10px 0;
}

.tags,
.mobileTags,
.mobileBadges {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.desktopActions {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-self: end;
}

.applyButton {
  width: 100%;
  max-width: 172px;
}

.mobileActions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 9px;
}

.mobileCard {
  display: none;
}

@media (max-width: 620px) {
  .card {
    padding: 0;
    overflow: hidden;
    border-radius: 10px;
  }

  .desktopCard {
    display: none;
  }

  .mobileCard {
    display: block;
  }

  .mobileSummary {
    display: grid;
    gap: 10px;
    padding: 16px;
    cursor: pointer;
    list-style: none;
  }

  .mobileSummary::-webkit-details-marker {
    display: none;
  }

  .mobileHead {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: start;
  }

  .mobileTitle {
    min-width: 0;
    color: #10294f;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .mobileChevron {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary-strong);
    font-weight: 900;
    line-height: 1;
    transition: transform 0.18s ease;
  }

  .mobileCard[open] .mobileChevron {
    transform: rotate(180deg);
  }

  .mobileDescription {
    margin: 0;
    font-size: 13px;
  }

  .mobileDetail {
    display: grid;
    gap: 12px;
    padding: 0 16px 16px;
  }

  .mobileDetail .metaLine {
    margin: 14px 0 0;
    font-size: 13px;
  }

  .mobileActions button {
    width: 100%;
  }
}
</style>
