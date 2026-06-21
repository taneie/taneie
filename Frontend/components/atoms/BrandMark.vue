<template>
  <img
    src="/brand/tryangle-logo.svg"
    alt="TRYANGLE FREELANCE"
    :class="$style.brandLogo"
    width="240"
    height="60"
  />
</template>

<style module>
.brandLogo {
  display: block;
  width: clamp(176px, 18vw, 240px);
  height: auto;
  flex: 0 0 auto;
  object-fit: contain;
  object-position: left center;
}

@media (max-width: 620px) {
  .brandLogo {
    width: min(210px, 62vw);
  }
}
</style>
