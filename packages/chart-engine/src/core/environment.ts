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
  const isStopped = (): boolean => stopped;
  const cleanup: (() => void)[] = [];
  cleanup.push(watchMedia('(prefers-color-scheme: dark)', () => hooks.colorScheme()));
  cleanup.push(watchMedia('(forced-colors: active)', () => hooks.forcedColors()));
  cleanup.push(watchPixelRatio(hooks, isStopped));
  const stopFonts = watchFonts(hooks, isStopped);
  if (stopFonts) cleanup.push(stopFonts);

  return () => {
    stopped = true;
    for (const stop of cleanup) stop();
  };
}

function watchMedia(query: string, onChange: () => void): () => void {
  const mediaQuery = matchMedia(query);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

/** A resolution query matches only the current ratio, so it is re-created after every change. */
function watchPixelRatio(hooks: EnvironmentHooks, isStopped: () => boolean): () => void {
  let stopCurrent = (): void => {};
  const watchCurrentRatio = (): void => {
    const mediaQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onChange = (): void => {
      mediaQuery.removeEventListener('change', onChange);
      if (isStopped()) return;
      hooks.pixelRatio();
      watchCurrentRatio();
    };
    mediaQuery.addEventListener('change', onChange);
    stopCurrent = () => mediaQuery.removeEventListener('change', onChange);
  };
  watchCurrentRatio();
  return () => stopCurrent();
}

function watchFonts(hooks: EnvironmentHooks, isStopped: () => boolean): (() => void) | null {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return null;
  const onFonts = (): void => {
    if (!isStopped()) hooks.fonts();
  };
  fonts.ready.then(onFonts);
  fonts.addEventListener?.('loadingdone', onFonts);
  return () => fonts.removeEventListener?.('loadingdone', onFonts);
}
