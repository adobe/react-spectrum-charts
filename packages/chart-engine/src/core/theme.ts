import { CONTRAST_FADE_OPACITY, DARK_THEME, LIGHT_EXTRAS } from './assumptions.js';
import type { ChartSize, ThemeName } from './types.js';

export interface Theme {
  name: 'light' | 'dark' | 'contrast';
  background: string;
  text: string;
  textSecondary: string;
  axisLabel: string;
  faded: string;
  grid: string;
  baseline: string;
  tick: string;
  reference: string;
  crosshair: string;
  neutral: string;
  positive: string;
  negative: string;
  focus: string;
  surface: string;
  surfaceBorder: string;
  /** Gray remainder segment of binary donuts. */
  secondary: string;
  legendHover: string;
  palette: string[];
  /** Opacity applied to de-emphasized series. */
  fadeOpacity: number;
  areaOpacity: number;
}

export const FONT_FAMILY =
  "adobe-clean, 'Adobe Clean', 'Source Sans Pro', 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Light values and the categorical palette come from the design file; see assumptions.ts for the rest.
export const LIGHT: Theme = {
  name: 'light',
  background: '#ffffff',
  text: '#292929',
  textSecondary: '#505050',
  axisLabel: '#505050',
  faded: '#dadada',
  grid: '#e1e1e1',
  baseline: '#292929',
  tick: '#717171',
  reference: '#292929',
  crosshair: '#292929',
  neutral: '#717171',
  positive: '#079355',
  negative: '#d73220',
  focus: '#3b63fb',
  surface: '#ffffff',
  surfaceBorder: '#e1e1e1',
  palette: ['#5424db', '#d92361', '#e86a00', '#5d89ff', '#9a47e2', '#f24cb8'],
  ...LIGHT_EXTRAS,
};

export const DARK: Theme = { name: 'dark', ...DARK_THEME };

const systemColorCache = new Map<string, string>();

/** Resolve a CSS system color keyword (e.g. CanvasText) to a concrete rgb() for canvas use. */
function resolveSystemColor(keyword: string, fallback: string): string {
  if (typeof document === 'undefined' || !document.body) return fallback;
  const cached = systemColorCache.get(keyword);
  if (cached) return cached;
  const probe = document.createElement('span');
  probe.style.color = keyword;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color || fallback;
  probe.remove();
  systemColorCache.set(keyword, value);
  return value;
}

export function clearSystemColorCache(): void {
  systemColorCache.clear();
}

function contrastTheme(base: Theme): Theme {
  const text = resolveSystemColor('CanvasText', base.text);
  const bg = resolveSystemColor('Canvas', base.background);
  const gray = resolveSystemColor('GrayText', base.neutral);
  const highlight = resolveSystemColor('Highlight', base.focus);
  return {
    ...base,
    name: 'contrast',
    background: bg,
    surface: bg,
    surfaceBorder: text,
    text,
    textSecondary: text,
    axisLabel: text,
    faded: gray,
    grid: gray,
    baseline: text,
    tick: text,
    reference: text,
    crosshair: text,
    neutral: gray,
    secondary: gray,
    legendHover: bg,
    focus: highlight,
    fadeOpacity: CONTRAST_FADE_OPACITY,
  };
}

export function matches(query: string): boolean {
  return typeof matchMedia === 'function' && matchMedia(query).matches;
}

export function resolveTheme(name: ThemeName | undefined): Theme {
  const dark = name === 'dark' || (name === 'auto' && matches('(prefers-color-scheme: dark)'));
  const base = dark ? DARK : LIGHT;
  return matches('(forced-colors: active)') ? contrastTheme(base) : base;
}

export interface SizeTokens {
  lineWidth: number;
  axisFont: number;
  labelFont: number;
  titleFont: number;
  facetFont: number;
  legendFont: number;
  pointRadius: number;
}

export const SIZES: Record<ChartSize, SizeTokens> = {
  L: { lineWidth: 3, axisFont: 14, labelFont: 18, titleFont: 22, facetFont: 14, legendFont: 14, pointRadius: 4.5 },
  M: { lineWidth: 2, axisFont: 14, labelFont: 16, titleFont: 18, facetFont: 14, legendFont: 14, pointRadius: 4 },
  S: { lineWidth: 1.5, axisFont: 12, labelFont: 14, titleFont: 16, facetFont: 12, legendFont: 12, pointRadius: 3 },
};

export function font(size: number, weight: number | string = 400): string {
  return `${weight} ${size}px ${FONT_FAMILY}`;
}
