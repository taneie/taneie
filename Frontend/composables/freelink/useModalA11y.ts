import {
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type Ref,
  type WatchSource,
} from "vue";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null,
  );
}

export function useModalA11y(
  source: WatchSource<boolean>,
  onClose: () => void,
): Ref<HTMLElement | null> {
  const modalRef = ref<HTMLElement | null>(null);
  let previousFocus: HTMLElement | null = null;
  let listening = false;

  function focusFirstElement() {
    const root = modalRef.value;
    if (!root) return;
    const [first] = focusableElements(root);
    (first || root).focus({ preventScroll: true });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!modalRef.value) return;

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusableElements(modalRef.value);
    if (!items.length) {
      event.preventDefault();
      modalRef.value.focus({ preventScroll: true });
      return;
    }

    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function addListener() {
    if (!import.meta.client || listening) return;
    document.addEventListener("keydown", handleKeydown);
    listening = true;
  }

  function removeListener() {
    if (!import.meta.client || !listening) return;
    document.removeEventListener("keydown", handleKeydown);
    listening = false;
  }

  watch(
    source,
    async (open) => {
      if (open) {
        previousFocus = document.activeElement as HTMLElement | null;
        addListener();
        await nextTick();
        focusFirstElement();
        return;
      }

      removeListener();
      previousFocus?.focus?.({ preventScroll: true });
      previousFocus = null;
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    removeListener();
    previousFocus?.focus?.({ preventScroll: true });
  });

  return modalRef;
}
