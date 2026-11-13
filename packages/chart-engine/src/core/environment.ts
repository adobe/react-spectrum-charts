export interface EnvironmentHooks {
  /** The system light/dark preference changed. */
  colorScheme(): void;
  /** Forced colors (high contrast) turned on or off. */
  forcedColors(): void;
  /** Device pixel ratio changed (zoom, moving between displays). */
  pixelRatio(): void;
  /** Web fonts finished loading. */
  fonts(): void;
}

/** Watches system settings that change how the chart draws. Returns a function that stops watching. */
export function watchEnvironment(hooks: EnvironmentHooks): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  let stopped = false;
  const cleanup: (() => void)[] = [];
  const watch = (query: string, fn: () => void): void => {
    const mq = matchMedia(query);
    mq.addEventListener('change', fn);
    cleanup.push(() => mq.removeEventListener('change', fn));
  };
  watch('(prefers-color-scheme: dark)', () => hooks.colorScheme());
  watch('(forced-colors: active)', () => hooks.forcedColors());

  let stopRatio = (): void => {};
  const watchRatio = (): void => {
    const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const fn = (): void => {
      mq.removeEventListener('change', fn);
      if (stopped) return;
      hooks.pixelRatio();
      watchRatio();
    };
    mq.addEventListener('change', fn);
    stopRatio = () => mq.removeEventListener('change', fn);
  };
  watchRatio();
  cleanup.push(() => stopRatio());

  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts) {
    const onFonts = (): void => {
      if (!stopped) hooks.fonts();
    };
    fonts.ready.then(onFonts);
    fonts.addEventListener?.('loadingdone', onFonts);
    cleanup.push(() => fonts.removeEventListener?.('loadingdone', onFonts));
  }

  return () => {
    stopped = true;
    for (const fn of cleanup) fn();
  };
}
