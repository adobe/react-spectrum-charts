import type { Env, LegendEntry, LegendSpec } from '../../core/module.js';
import { colorOfFor, formattersFor } from './layout.js';
import { labelStyle } from './labels.js';
import type { DonutModel, Segment } from './model.js';
import type { DonutChartOptions } from './types.js';

function sumValues(segments: Segment[]): number {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}

/** Legends show by default only for non-binary donuts with several categories and no direct labels. */
function isLegendShown(model: DonutModel, options: DonutChartOptions, hidden: boolean | undefined, entryCount: number): boolean {
  if (hidden || model.empty) return false;
  if (options.legend === true || typeof options.legend === 'object') return true;
  return options.legend === undefined && !model.binary && entryCount > 1 && !labelStyle(options);
}

/** One entry per category; single donuts append the share ("Phone – 65.2%"). */
export function donutLegend(model: DonutModel, options: DonutChartOptions, env: Env): LegendSpec {
  const legendOptions = typeof options.legend === 'object' ? options.legend : {};
  const colorOf = colorOfFor(model, options, env);
  const { formatPercent } = formattersFor(options, env);
  const singlePie = model.pies.length === 1 ? model.pies[0] : null;
  const total = singlePie ? sumValues(singlePie.segments) : 0;
  const showValues = legendOptions.values ?? !!singlePie;
  const entries: LegendEntry[] = model.categories.map((category) => {
    const categorySegments = singlePie?.segments.filter((segment) => segment.category === category);
    const value = categorySegments ? sumValues(categorySegments) : 0;
    const hasShare = showValues && singlePie && total > 0;
    return {
      key: category,
      label: category,
      color: colorOf(category),
      ...(hasShare ? { value: formatPercent(value / total) } : {}),
    };
  });
  const show = isLegendShown(model, options, legendOptions.hidden, entries.length);
  const defaultPosition = options.variant === 'semicircle' ? 'bottom' : 'right';
  const position = legendOptions.position ?? defaultPosition;
  return { ...legendOptions, position, show, entries, swatch: legendOptions.swatch ?? 'square' };
}
