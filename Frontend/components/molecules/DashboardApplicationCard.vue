<template>
  <article :class="$style.card">
    <div :class="$style.body">
      <strong>{{ freelancerName }}</strong>
      <p>{{ jobTitle }} / {{ status }} / {{ appliedAt }}</p>
    </div>
    <BaseButton
      variant="secondary"
      icon="briefcase"
      @click="$emit('openAdmin')"
    >
      管理で確認
    </BaseButton>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  freelancerName: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
}>();

defineEmits<{
  openAdmin: [];
}>();
</script>

<style module>
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.body {
  min-width: 0;
}

.body strong,
.body p {
  overflow-wrap: anywhere;
}

.body p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 620px) {
  .card {
    display: grid;
  }

  .card button {
    width: 100%;
  }
}
</style>
