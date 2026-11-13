import { easeCubicInOut, easeCubicOut } from 'd3-ease';
import { matches } from './theme.js';

export function prefersReducedMotion(): boolean {
  return matches('(prefers-reduced-motion: reduce)');
}

export interface Animation {
  cancel(): void;
}

/** Drive `step(t)` from 0 to 1 over `duration` ms with easing; runs the final step synchronously when duration is 0. */
export function animate(
  duration: number,
  step: (t: number) => void,
  ease: 'inOut' | 'out' = 'inOut',
  done?: () => void,
): Animation {
  const fn = ease === 'out' ? easeCubicOut : easeCubicInOut;
  if (duration <= 0 || typeof requestAnimationFrame !== 'function') {
    step(1);
    done?.();
    return { cancel() {} };
  }
  let raf = 0;
  let start: number | null = null;
  let cancelled = false;
  const frame = (now: number): void => {
    if (cancelled) return;
    if (start == null) start = now;
    const t = Math.min(1, (now - start) / duration);
    step(fn(t));
    if (t < 1) raf = requestAnimationFrame(frame);
    else done?.();
  };
  raf = requestAnimationFrame(frame);
  return {
    cancel() {
      cancelled = true;
      cancelAnimationFrame(raf);
    },
  };
}
