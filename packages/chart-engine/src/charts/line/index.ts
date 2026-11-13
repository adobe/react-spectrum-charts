import { drawAxes, drawAxisHover, drawReferenceLines } from '../../core/cartesian/draw.js';
import { Chart } from '../../core/chart.js';
import type { ChartModule, TooltipRow } from '../../core/module.js';
import { listFormat } from '../../util/data.js';
import { drawLineMarks, drawLineOverlay } from './draw.js';
import { hitLine, hoverForLine, type LineHit } from './hit.js';
import { layoutLine, snapshotLine, type LineGeometry, type LineSnapshot } from './layout.js';
import { lineLegend } from './legend.js';
import { buildModel, type Model } from './model.js';
import { lineNav } from './nav.js';
import { colorsFor } from './layout.js';
import type { LineChartOptions, LineHoverContext, LineItem } from './types.js';

function toItem(hit: LineHit): LineItem {
  const { s } = hit.series;
  const p = hit.pt.p;
  return {
    series: s.key,
    color: s.colorKey,
    x: p.xRaw,
    y: p.y,
    index: p.index,
    datum: p.datum,
    estimated: p.estimated,
    axis: s.axis,
    ...(s.facet ? { facet: s.facet } : {}),
  };
}

/** Line chart: everything that differs from other chart types. */
export const lineModule: ChartModule<LineChartOptions, Model, LineGeometry, LineHit, LineItem, LineSnapshot> = {
  name: 'Line chart',
  dataKeys: ['data', 'x', 'y', 'series', 'color', 'lineStyle', 'estimated', 'facet', 'layout', 'y2Axis'],

  model: {
    prepare: (o) => buildModel(o),
    legend: (m, o, env) => {
      const c = colorsFor(m, o, env);
      return lineLegend(m, o, env, c.colorOf, c.seriesColor);
    },
    notice: (m) =>
      m.series.every((s) => s.missing)
        ? 'There are no data available.'
        : m.missing.length
          ? `There are no data available for ${listFormat(m.missing)}.`
          : '',
    description: (m) => {
      const keys = m.seriesKeys.filter((k) => !m.missing.includes(k));
      const n = keys.length;
      return `Line chart with ${n} ${n === 1 ? 'line' : 'lines'}${n ? `: ${listFormat(keys)}` : ''}. Use the arrow keys to explore values.`;
    },
    minimal: (o) => !!o.minimal,
  },

  geometry: {
    layout: layoutLine,
    snapshot: snapshotLine,
  },

  draw: {
    back: (g, o, env) => drawAxes(g.frame, o, env.theme, env.sizes),
    marks: drawLineMarks,
    front: (g, o, env) => drawReferenceLines(g.frame, o, env.theme, env.sizes),
    overlay: (g, state, env) => {
      const h = state.hover?.primary;
      const axis = h ? drawAxisHover(g.frame, { panel: h.panel.index, x: h.pt.x, label: g.frame.formatX(h.pt.p.xRaw) }, env.theme, env.sizes) : [];
      return [...axis, ...drawLineOverlay(g, state, env)];
    },
  },

  identity: {
    key: (h) => `${h.series.s.id}#${h.pt.p.index}`,
    group: (h) => h.series.s.key,
    item: (_g, h) => toItem(h),
    find: (g, item) => {
      for (const panel of g.panels) {
        if (item.facet != null && panel.facet !== item.facet) continue;
        for (const series of panel.series) {
          if (series.s.key !== item.series) continue;
          const pt = series.pts.find((p) => p.p.index === item.index) ?? series.pts.find((p) => p.p.x === g.frame.xValue(item.x));
          if (pt && pt.y != null) return { panel, series, pt };
        }
      }
      return null;
    },
    anchor: (_g, h) => ({ x: h.panel.x + h.pt.x, y: h.panel.y + (h.pt.y ?? 0) }),
    describe: (g, h) => `${h.series.s.key}, ${g.frame.formatX(h.pt.p.xRaw)}, ${g.frame.formatY(h.pt.value, h.series.s.axis)}`,
  },

  interaction: {
    hoverMode: (o) => o.hover ?? 'point',
    hit: hitLine,
    hoverFor: (_g, mark, mode) => hoverForLine(mark, mode),
    context: (g, hover): LineHoverContext => ({
      item: toItem(hover.primary),
      items: hover.items.map(toItem),
      mode: hover.mode,
      colorOf: g.colorOf,
      formatX: g.frame.formatX,
      formatY: g.frame.formatY,
      seriesColor: g.seriesColor,
    }),
    tooltip: (c) => {
      const ctx = c as LineHoverContext;
      const items = ctx.mode === 'x' ? ctx.items : [ctx.item];
      const rows: TooltipRow[] = items.map((it) => ({
        color: ctx.seriesColor(it.series),
        name: it.series,
        value: ctx.formatY(it.y, it.axis) + (it.estimated ? ' (estimated)' : ''),
      }));
      if (items.length > 1 && items.every((i) => i.axis === 'y')) {
        rows.push({ name: 'Total', value: ctx.formatY(items.reduce((s, i) => s + (i.y ?? 0), 0)), total: true });
      }
      return { title: ctx.formatX(ctx.item.x), rows };
    },
  },

  nav: (g) => lineNav(g),
};

/** A Spectrum 2 line chart. */
export class LineChart extends Chart<LineChartOptions, LineItem, Model, LineGeometry, LineHit, LineSnapshot> {
  constructor(container: HTMLElement, options: LineChartOptions) {
    super(container, options, lineModule);
  }
}

export function createLineChart(container: HTMLElement, options: LineChartOptions): LineChart {
  return new LineChart(container, options);
}
