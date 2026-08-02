<template>
  <section id="features" :class="$style.infoSection">
    <div :class="$style.sectionHead">
      <span>FEATURES</span>
      <h2 :class="$style.featureTitle">
        <span>最短1分で応募まで。</span>
        <span>Frichyが案件探しを自動化。</span>
      </h2>
    </div>

    <div :class="$style.featureGrid">
      <article v-for="feature in features" :key="feature.title">
        <span :class="$style.featureIcon" aria-hidden="true">
          {{ feature.icon }}
        </span>
        <div :class="$style.featureBody">
          <strong>{{ feature.title }}</strong>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  { icon: "⌕", title: "案件探しの時間を1/3に" },
  { icon: "↔", title: "応募後の調整がスムーズに進む" },
  { icon: "✓", title: "提案準備が自動で整う" },
];
</script>

<style module>
.infoSection {
  margin-top: 42px;
  animation: fadeSlideUp 0.48s ease-out 0.24s both;
}

.sectionHead {
  max-width: 760px;
  margin-bottom: 18px;
}

.sectionHead span {
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
}

.sectionHead h2 {
  margin: 6px 0 0;
  color: #0d2749;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.24;
}

.featureTitle {
  max-width: 820px;
  font-weight: 900;
}

.featureTitle span {
  display: block;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: 0;
}

.featureTitle span:last-child {
  color: var(--primary-strong);
}

.featureGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.featureGrid article {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
  min-height: 104px;
  overflow: hidden;
  padding: 18px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.06);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  animation: fadeSlideUp 0.42s ease-out both;
}

.featureGrid article:nth-child(1) {
  animation-delay: 0.08s;
}

.featureGrid article:nth-child(2) {
  animation-delay: 0.16s;
}

.featureGrid article:nth-child(3) {
  animation-delay: 0.24s;
}

.featureGrid article:hover {
  border-color: rgba(169, 197, 237, 0.95);
  box-shadow: 0 14px 28px rgba(29, 78, 137, 0.1);
  transform: translateY(-2px);
}

.featureGrid article::before {
  content: "";
  position: absolute;
  inset: 16px auto 16px 0;
  width: 4px;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(180deg, var(--primary), var(--cyan));
  pointer-events: none;
  animation: accentGlow 4.8s ease-in-out infinite;
}

.featureIcon {
  position: relative;
  z-index: 1;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid #a9c5ed;
  border-radius: 8px;
  background: #f4f8fe;
  color: var(--primary-strong);
  font-size: 17px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(29, 95, 211, 0.08);
}

.featureBody {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.featureBody strong {
  display: block;
  color: #0d2749;
  font-size: 17px;
  line-height: 1.55;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes accentGlow {
  0%,
  100% {
    opacity: 0.72;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 980px) {
  .featureGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .infoSection {
    margin-top: 42px;
  }

  .sectionHead {
    margin-bottom: 22px;
  }

  .sectionHead span {
    letter-spacing: 0.04em;
  }

  .sectionHead h2 {
    margin-top: 7px;
    font-size: 24px;
    line-height: 1.3;
  }

  .featureTitle span {
    letter-spacing: 0;
  }

  .featureGrid {
    gap: 18px;
  }

  .featureGrid article {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 12px;
    min-height: 92px;
    padding: 16px;
  }

  .featureIcon {
    width: 34px;
    height: 34px;
    font-size: 17px;
    margin: 0;
  }

  .featureBody strong {
    font-size: 16px;
    line-height: 1.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .infoSection,
  .featureGrid article,
  .featureGrid article::before {
    animation: none;
  }

  .featureGrid article {
    transition: none;
  }

  .featureGrid article:hover {
    transform: none;
  }
}
</style>
