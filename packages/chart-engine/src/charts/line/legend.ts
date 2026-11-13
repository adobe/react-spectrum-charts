import type { Env, LegendEntry, LegendSpec } from '../../core/module.js';
import { resolveDirect, type ResolvedDirect } from './layout.js';
import type { Model } from './model.js';
import type { LineChartOptions } from './types.js';

/** Key prefix for line-style entries, which don't toggle a series. */
const STYLE_KEY_PREFIX = '__style:';
const TREND_KEY = '__trend';

/** Color and line style encode different fields, so both get legend entries. */
function styleLegend(model: Model): boolean {
  return model.styleKeys.length > 1 && model.colorKeys.length < model.seriesKeys.length;
}

function colorGroupMissing(model: Model, colorKey: string): boolean {
  return model.series.filter((series) => series.colorKey === colorKey).every((series) => series.missing);
}

function legendShown(model: Model, options: LineChartOptions, direct: ResolvedDirect, byStyle: boolean): boolean {
  const legendOptions = typeof options.legend === 'object' ? options.legend : {};
  if (options.minimal || legendOptions.hidden) return false;
  if (options.legend === true || typeof options.legend === 'object') return true;
  const multiple = model.seriesKeys.length - model.missing.length > 1;
  return options.legend === undefined && ((multiple && !direct.category) || byStyle);
}

/** Color-group entries (unless direct labels already name them), then one static entry per line style. */
function styleEntries(model: Model, env: Env, direct: ResolvedDirect, colorOf: (key: string) => string): LegendEntry[] {
  const entries: LegendEntry[] = [];
  if (!direct.category) {
    for (const colorKey of model.colorKeys) {
      if (colorGroupMissing(model, colorKey)) continue;
      entries.push({ key: colorKey, label: colorKey, color: colorOf(colorKey), lineStyle: 'solid' });
    }
  }
  for (const styleKey of model.styleKeys) {
    const series = model.series.find((candidate) => candidate.styleKey === styleKey)!;
    entries.push({ key: `${STYLE_KEY_PREFIX}${styleKey}`, label: styleKey, color: env.theme.text, lineStyle: series.lineStyle, static: true });
  }
  return entries;
}

/** Several series share a color group (e.g. "Other"): one entry per group. */
function colorGroupEntries(model: Model, colorOf: (key: string) => string): LegendEntry[] {
  const entries: LegendEntry[] = [];
  for (const colorKey of model.colorKeys) {
    const members = model.series.filter((series) => series.colorKey === colorKey);
    if (members.every((series) => series.missing)) continue;
    entries.push({ key: colorKey, label: colorKey, color: colorOf(colorKey), lineStyle: members[0].lineStyle });
  }
  return entries;
}

function seriesEntries(model: Model, seriesColor: (key: string) => string): LegendEntry[] {
  const entries: LegendEntry[] = [];
  for (const key of model.seriesKeys) {
    if (model.missing.includes(key)) continue;
    const lineStyle = model.series.find((series) => series.key === key)!.lineStyle;
    entries.push({ key, label: key, color: seriesColor(key), lineStyle });
  }
  return entries;
}

/** Legend entries: series, color groups, or color groups plus line-style keys, and the trendline. */
export function lineLegend(
  model: Model,
  options: LineChartOptions,
  env: Env,
  colorOf: (key: string) => string,
  seriesColor: (key: string) => string,
): LegendSpec {
  const legendOptions = typeof options.legend === 'object' ? options.legend : {};
  const direct = resolveDirect(options);
  const byStyle = styleLegend(model);
  const show = legendShown(model, options, direct, byStyle);
  let entries: LegendEntry[];
  if (byStyle) entries = styleEntries(model, env, direct, colorOf);
  else if (options.color != null && model.colorKeys.length < model.seriesKeys.length) entries = colorGroupEntries(model, colorOf);
  else entries = seriesEntries(model, seriesColor);
  if (options.trendline) {
    const label = (typeof options.trendline === 'object' && options.trendline.label) || 'Trend';
    entries.push({ key: TREND_KEY, label, color: env.theme.reference, lineStyle: 'solid', static: true });
  }
  const usesLineSwatch = options.trendline || entries.some((entry) => entry.lineStyle !== 'solid');
  const swatch = legendOptions.swatch ?? (usesLineSwatch ? 'line' : 'square');
  return { ...legendOptions, show, entries, swatch };
}
