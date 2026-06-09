<template>
  <div :class="$style.brandMark">T</div>
</template>

<style module>
.brandMark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 68%, rgba(255, 255, 255, 0.3), transparent 36%),
    conic-gradient(from 145deg, #0f8ca8, #1d5fd3, #0b3f95, #0f8ca8);
  color: white;
  font-size: 15px;
  font-weight: 900;
  clip-path: polygon(50% 4%, 96% 86%, 4% 86%);
}

@media (max-width: 620px) {
  .brandMark {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
}
</style>
