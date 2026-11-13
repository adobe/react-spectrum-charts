import { animate, prefersReducedMotion, type Animation } from './animation.js';
import { MOTION } from './assumptions.js';
import type { BaseChartOptions } from './types.js';

type AnimationSetting = BaseChartOptions<unknown>['animation'];

export interface MotionHooks {
  /** A reveal frame is ready to paint. */
  reveal(): void;
  /** An update frame needs layout and paint. */
  tween(): void;
  /** The update animation finished. */
  settle(): void;
}

/** The initial reveal and data update animations. */
export class Motion<S> {
  /** Initial reveal progress, 0..1. */
  reveal = 1;
  /** Fade-in progress of marks that appeared in the current update. */
  enter = 1;
  /** What the current update animates from, and its progress. */
  tween: { from: S; t: number } | null = null;
  private revealed = false;
  private revealAnim: Animation | null = null;
  private dataAnim: Animation | null = null;

  constructor(
    private readonly setting: () => AnimationSetting,
    private readonly hooks: MotionHooks,
  ) {}

  /** The configured duration, the given default, or 0 when animation is off or reduced motion is preferred. */
  private duration(base: number): number {
    const setting = this.setting();
    if (setting === false || prefersReducedMotion()) return 0;
    if (typeof setting === 'object' && setting.duration != null) return setting.duration;
    return base;
  }

  startReveal(): void {
    const duration = this.duration(MOTION.revealMs);
    if (this.revealed || duration === 0) {
      this.reveal = 1;
      this.revealed = true;
      return;
    }
    this.revealed = true;
    this.reveal = 0;
    this.revealAnim = animate(
      duration,
      (progress) => {
        this.reveal = progress;
        this.hooks.reveal();
      },
      MOTION.revealEase,
    );
  }

  /** Animates the next layouts from `snapshot()`; without a snapshot, updates apply immediately. */
  startTween(snapshot: (() => S) | null): void {
    const duration = this.duration(MOTION.updateMs);
    this.dataAnim?.cancel();
    if (!snapshot || duration === 0) {
      this.tween = null;
      this.enter = 1;
      return;
    }
    this.tween = { from: snapshot(), t: 0 };
    this.enter = 0;
    this.dataAnim = animate(
      duration,
      (progress) => {
        if (!this.tween) return;
        this.tween.t = progress;
        this.enter = progress;
        this.hooks.tween();
      },
      MOTION.updateEase,
      () => {
        this.tween = null;
        this.enter = 1;
        this.dataAnim = null;
        this.hooks.settle();
      },
    );
  }

  cancel(): void {
    this.dataAnim?.cancel();
    this.revealAnim?.cancel();
  }
}
