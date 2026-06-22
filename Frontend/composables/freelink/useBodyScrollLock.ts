import { onBeforeUnmount, watch, type WatchSource } from "vue";

let lockCount = 0;
let lockedScrollY = 0;
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyWidth = "";
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

function lockBodyScroll() {
  if (!import.meta.client) return;
  lockCount += 1;
  if (lockCount > 1) return;

  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  previousBodyPosition = document.body.style.position;
  previousBodyTop = document.body.style.top;
  previousBodyWidth = document.body.style.width;
  previousBodyOverflow = document.body.style.overflow;
  previousHtmlOverflow = document.documentElement.style.overflow;

  document.documentElement.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  if (!import.meta.client || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  document.documentElement.style.overflow = previousHtmlOverflow;
  document.body.style.position = previousBodyPosition;
  document.body.style.top = previousBodyTop;
  document.body.style.width = previousBodyWidth;
  document.body.style.overflow = previousBodyOverflow;
  window.scrollTo(0, lockedScrollY);
}

export function useBodyScrollLock(source: WatchSource<boolean>) {
  let lockedByInstance = false;

  watch(
    source,
    (shouldLock) => {
      if (shouldLock && !lockedByInstance) {
        lockBodyScroll();
        lockedByInstance = true;
        return;
      }
      if (!shouldLock && lockedByInstance) {
        unlockBodyScroll();
        lockedByInstance = false;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (!lockedByInstance) return;
    unlockBodyScroll();
    lockedByInstance = false;
  });
}
