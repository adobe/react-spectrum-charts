import { Chart } from '../../core/chart.js';
import type { ChartModule } from '../../core/module.js';
import { listFormat } from '../../util/data.js';
import { drawDonutMarks, drawDonutOverlay } from './draw.js';
import { layoutDonut, snapshotDonut, type ArcLayout, type DonutGeometry, type DonutSnapshot } from './layout.js';
import { hitDonut, hoverForDonut } from './hit.js';
import { donutLegend } from './legend.js';
import { buildDonutModel, type DonutModel } from './model.js';
import { describeArc, donutNav } from './nav.js';
import type { DonutChartOptions, DonutHoverContext, DonutItem } from './types.js';

function toItem(a: ArcLayout): DonutItem {
  return {
    category: a.category,
    value: a.value,
    percent: a.percent,
    total: a.pie.total,
    index: a.segment.index,
    datum: a.segment.datum,
    ...(a.pie.facet != null ? { facet: a.pie.facet } : {}),
  };
}

/** Donut chart: everything that differs from other chart types. */
export const donutModule: ChartModule<DonutChartOptions, DonutModel, DonutGeometry, ArcLayout, DonutItem, DonutSnapshot> = {
  name: 'Donut chart',
  dataKeys: ['data', 'category', 'value', 'facet', 'sort', 'binary', 'variant'],

  prepare: (o) => buildDonutModel(o),
  legend: donutLegend,
  notice: (m) => (m.empty ? 'There are no data available.' : ''),
  description: (m, o) => {
    const n = m.categories.length;
    const kind = o.variant === 'semicircle' ? 'Semicircle donut chart' : 'Donut chart';
    const facets = m.pies.length > 1 ? ` in ${m.pies.length} small multiples` : '';
    return `${kind}${facets} with ${n} segment${n === 1 ? '' : 's'}${n ? `: ${listFormat(m.categories)}` : ''}. Use the arrow keys to explore values.`;
  },

  layout: layoutDonut,
  snapshot: snapshotDonut,
  marks: (g, state, env) => drawDonutMarks(g, state, env),
  overlay: (g, state, env) => drawDonutOverlay(g, state, env),

  hoverMode: () => 'point',
  hit: (g, x, y) => {
    const a = hitDonut(g, x, y);
    return a ? hoverForDonut(g, a) : null;
  },
  hoverFor: (g, a) => hoverForDonut(g, a),

  key: (a) => a.key,
  group: (a) => a.category,
  item: (_g, a) => toItem(a),
  find: (g, item) => {
    for (const p of g.pies) {
      if (item.facet != null && p.facet !== item.facet) continue;
      const a = p.arcs.find((x) => x.category === item.category);
      if (a && a.end > a.start) return a;
    }
    return null;
  },
  anchor: (_g, a) => {
    const mid = (a.start + a.end) / 2;
    const p = a.pie;
    return { x: p.cx + Math.sin(mid) * p.outer, y: p.cy - Math.cos(mid) * p.outer };
  },
  describe: describeArc,
  nav: (g) => donutNav(g),

  context: (g, hover): DonutHoverContext => ({
    item: toItem(hover.primary),
    items: hover.items.map(toItem),
    mode: hover.mode,
    colorOf: (k) => (k === hover.primary.category ? hover.primary.color : g.colorOf(k)),
    formatValue: g.formatValue,
    formatPercent: g.formatPercent,
  }),
  tooltip: (c) => {
    const ctx = c as DonutHoverContext;
    const it = ctx.item;
    return {
      ...(it.facet != null ? { title: it.facet } : {}),
      rows: [{ color: ctx.colorOf(it.category), name: it.category, value: `${ctx.formatPercent(it.percent)} (${ctx.formatValue(it.value)})` }],
    };
  },
  legendEmphasis: (hover, selected) => {
    const keys = new Set(selected.map((a) => a.category));
    if (hover) keys.add(hover.primary.category);
    return keys.size ? [...keys] : null;
  },
  multiSelect: (o) => o.multiSelect ?? true,
};

/** A Spectrum 2 donut chart. */
export class DonutChart extends Chart<DonutChartOptions, DonutItem> {
  constructor(container: HTMLElement, options: DonutChartOptions) {
    super(container, options, donutModule);
  }
}

export function createDonutChart(container: HTMLElement, options: DonutChartOptions): DonutChart {
  return new DonutChart(container, options);
}
