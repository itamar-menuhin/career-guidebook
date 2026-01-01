import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_TIMEOUT_MS = 1500;

const scrollToElement = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return false;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  return true;
};

export const useScrollToHash = (disabled = false) => {
  const location = useLocation();

  useEffect(() => {
    if (disabled || !location.hash) return;

    const targetId = decodeURIComponent(location.hash.replace('#', ''));
    if (!targetId) return;

    let rafId: number | null = null;
    let stopped = false;
    const startTime = performance.now();

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };

    const tryScroll = () => {
      if (stopped) return true;
      const reached = scrollToElement(targetId);
      const expired = performance.now() - startTime > SCROLL_TIMEOUT_MS;

      if (reached || expired) {
        stop();
        return true;
      }

      return false;
    };

    const observer = new MutationObserver(() => {
      tryScroll();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const tick = () => {
      if (!tryScroll()) {
        rafId = requestAnimationFrame(tick);
      }
    };

    // Try immediately in case the element is already present
    tryScroll();
    rafId = requestAnimationFrame(tick);

    return stop;
  }, [disabled, location.pathname, location.hash]);
};
