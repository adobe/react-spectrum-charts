import type { Env, LegendEntry, LegendSpec } from '../../core/module.js';
import { resolveDirect } from './layout.js';
import type { Model } from './model.js';
import type { LineChartOptions } from './types.js';

function styleLegend(m: Model): boolean {
  return m.styleKeys.length > 1 && m.colorKeys.length < m.seriesKeys.length;
}

/** Legend entries: series, color groups, or color groups plus line-style keys, and the trendline. */
export function lineLegend(m: Model, o: LineChartOptions, env: Env, colorOf: (k: string) => string, seriesColor: (k: string) => string): LegendSpec {
  const lo = typeof o.legend === 'object' ? o.legend : {};
  const direct = resolveDirect(o);
  const multiple = m.seriesKeys.length - m.missing.length > 1;
  const byStyle = styleLegend(m);
  const show =
    !o.minimal &&
    !lo.hidden &&
    (o.legend === true || typeof o.legend === 'object' || (o.legend === undefined && ((multiple && !direct.category) || byStyle)));
  const entries: LegendEntry[] = [];
  if (byStyle) {
    // Color and line style encode different fields. Direct labels already name the colors.
    if (!direct.category) {
      for (const ck of m.colorKeys) {
        if (m.series.filter((x) => x.colorKey === ck).every((x) => x.missing)) continue;
        entries.push({ key: ck, label: ck, color: colorOf(ck), lineStyle: 'solid' });
      }
    }
    for (const sk of m.styleKeys) {
      const s = m.series.find((x) => x.styleKey === sk)!;
      entries.push({ key: `__style:${sk}`, label: sk, color: env.theme.text, lineStyle: s.lineStyle, static: true });
    }
  } else if (o.color != null && m.colorKeys.length < m.seriesKeys.length) {
    // Several series share a color group (e.g. "Other"): one entry per group.
    for (const ck of m.colorKeys) {
      const grp = m.series.filter((x) => x.colorKey === ck);
      if (grp.every((x) => x.missing)) continue;
      entries.push({ key: ck, label: ck, color: colorOf(ck), lineStyle: grp[0].lineStyle });
    }
  } else {
    for (const key of m.seriesKeys) {
      if (m.missing.includes(key)) continue;
      entries.push({ key, label: key, color: seriesColor(key), lineStyle: m.series.find((x) => x.key === key)!.lineStyle });
    }
  }
  if (o.trendline) {
    const label = (typeof o.trendline === 'object' && o.trendline.label) || 'Trend';
    entries.push({ key: '__trend', label, color: env.theme.reference, lineStyle: 'solid', static: true });
  }
  const swatch = lo.swatch ?? (o.trendline || entries.some((e) => e.lineStyle !== 'solid') ? 'line' : 'square');
  return { ...lo, show, entries, swatch };
}
