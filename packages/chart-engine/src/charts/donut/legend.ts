import type { Env, LegendEntry, LegendSpec } from '../../core/module.js';
import { colorOfFor, formattersFor } from './layout.js';
import { labelStyle } from './labels.js';
import type { DonutModel } from './model.js';
import type { DonutChartOptions } from './types.js';

/** One entry per category; single donuts append the share ("Phone – 65.2%"). */
export function donutLegend(m: DonutModel, o: DonutChartOptions, env: Env): LegendSpec {
  const lo = typeof o.legend === 'object' ? o.legend : {};
  const colorOf = colorOfFor(m, o, env);
  const { formatPercent } = formattersFor(o, env);
  const single = m.pies.length === 1 ? m.pies[0] : null;
  const total = single ? single.segments.reduce((a, s) => a + s.value, 0) : 0;
  const values = lo.values ?? !!single;
  const entries: LegendEntry[] = m.categories.map((c) => {
    const v = single?.segments.filter((s) => s.category === c).reduce((a, s) => a + s.value, 0) ?? 0;
    return {
      key: c,
      label: c,
      color: colorOf(c),
      ...(values && single && total > 0 ? { value: formatPercent(v / total) } : {}),
    };
  });
  const show =
    !lo.hidden &&
    !m.empty &&
    (o.legend === true || typeof o.legend === 'object' || (o.legend === undefined && !m.binary && entries.length > 1 && !labelStyle(o)));
  const position = lo.position ?? (o.variant === 'semicircle' ? 'bottom' : 'right');
  return { ...lo, position, show, entries, swatch: lo.swatch ?? 'square' };
}
