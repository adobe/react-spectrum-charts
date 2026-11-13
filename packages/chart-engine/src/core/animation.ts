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
  const easing = ease === 'out' ? easeCubicOut : easeCubicInOut;
  if (duration <= 0 || typeof requestAnimationFrame !== 'function') {
    step(1);
    done?.();
    return { cancel() {} };
  }
  let frameRequest = 0;
  let startTime: number | null = null;
  let cancelled = false;
  const frame = (now: number): void => {
    if (cancelled) return;
    if (startTime == null) startTime = now;
    const progress = Math.min(1, (now - startTime) / duration);
    step(easing(progress));
    if (progress < 1) frameRequest = requestAnimationFrame(frame);
    else done?.();
  };
  frameRequest = requestAnimationFrame(frame);
  return {
    cancel() {
      cancelled = true;
      cancelAnimationFrame(frameRequest);
    },
  };
}
