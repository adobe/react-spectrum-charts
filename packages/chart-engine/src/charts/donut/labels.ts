import { DONUT } from '../../core/assumptions.js';
import { font } from '../../core/theme.js';
import { resolveVertical } from '../../util/labels.js';
import { measureText } from '../../util/text.js';
import type { DonutGeometry, PieLayout } from './layout.js';
import type { DonutChartOptions, DonutDirectLabelOptions } from './types.js';

export interface DirectLabel {
  /** Arc key. */
  key: string;
  category: string;
  style: 'lightweight' | 'advanced';
  side: 'left' | 'right';
  /** Left edge and vertical centre of the label block. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Distance kept between the ring and the label. */
  offset: number;
  name: string;
  percent: string;
  /** "3,926 out of 6,458" (advanced labels). */
  detail: string | null;
  color: string;
  /** Polyline from the label to the ring, when drawn. */
  leader: [number, number][] | null;
}

export const LIGHT_LINE = { name: DONUT.labelNameFont, value: DONUT.labelValueFont };
export const ADVANCED = {
  name: DONUT.advancedNameFont,
  value: DONUT.advancedValueFont,
  detail: DONUT.advancedDetailFont,
  gap: DONUT.advancedSwatchGap,
};

function lineH(size: number): number {
  return Math.round(size * 1.3);
}

export function labelOptions(o: DonutChartOptions): DonutDirectLabelOptions | null {
  const d = o.directLabels;
  if (!d) return null;
  if (d === true) return { style: 'lightweight' };
  if (typeof d === 'string') return { style: d };
  return d;
}

export function labelStyle(o: DonutChartOptions): 'lightweight' | 'advanced' | null {
  const d = labelOptions(o);
  return d ? (d.style ?? 'lightweight') : null;
}

/** Measured lightweight label block (name over percentage). */
export function lightweightSize(name: string, percent: string): { width: number; height: number } {
  return {
    width: Math.max(measureText(name, font(LIGHT_LINE.name)), measureText(percent, font(LIGHT_LINE.value, 700))),
    height: lineH(LIGHT_LINE.name) + lineH(LIGHT_LINE.value),
  };
}

/**
 * Place direct labels beside the ring. Lightweight labels sit next to their segment and get a leader line when
 * they have to move to avoid overlap. Advanced labels line up in a column on each side, always with a leader.
 */
export function layoutLabels(
  p: PieLayout,
  o: DonutChartOptions,
  g: DonutGeometry,
  bounds: { x: number; y: number; width: number; height: number },
): DirectLabel[] {
  const opts = labelOptions(o);
  if (!opts) return [];
  const labels: (DirectLabel & { want: number })[] = [];
  for (const a of p.arcs) {
    if (a.end - a.start <= 0) continue;
    if (opts.include && !opts.include.includes(a.category)) continue;
    const style = opts.style === 'advanced' || opts.advanced?.includes(a.category) ? 'advanced' : 'lightweight';
    const mid = (a.start + a.end) / 2;
    const side = Math.sin(mid) >= 0 ? 'right' : 'left';
    const percent = g.formatPercent(a.percent);
    const detail = style === 'advanced' ? `${g.formatValue(a.value)} out of ${g.formatValue(p.total)}` : null;
    let width: number;
    let height: number;
    if (style === 'advanced') {
      width = Math.max(
        DONUT.advancedSwatch + ADVANCED.gap + measureText(a.category, font(ADVANCED.name)),
        measureText(percent, font(ADVANCED.value, 700)),
        measureText(detail!, font(ADVANCED.detail)),
      );
      height = lineH(ADVANCED.name) + lineH(ADVANCED.value) + lineH(ADVANCED.detail);
    } else {
      ({ width, height } = lightweightSize(a.category, percent));
    }
    const offset = style === 'advanced' ? DONUT.advancedColumnGap : DONUT.labelOffset;
    const [rx, ry] = [Math.sin(mid), -Math.cos(mid)];
    const ringY = p.cy + ry * p.outer;
    let x: number;
    let want: number;
    if (style === 'advanced') {
      x = side === 'right' ? p.cx + p.outer + offset : p.cx - p.outer - offset - width;
      want = ringY;
    } else {
      const ax = p.cx + rx * (p.outer + offset);
      const ay = p.cy + ry * (p.outer + offset);
      x = side === 'right' ? ax : ax - width;
      // Labels near the top or bottom sit beyond the ring rather than across it.
      want = ay + ry * (height / 2) * Math.abs(ry);
    }
    labels.push({
      key: a.key,
      category: a.category,
      style,
      side,
      x,
      y: want,
      want,
      width,
      height,
      offset,
      name: a.category,
      percent,
      detail,
      color: a.color,
      leader: null,
    });
  }

  for (const side of ['left', 'right'] as const) {
    const group = labels.filter((l) => l.side === side);
    const placed = resolveVertical(
      group.map((l) => ({ id: l.key, y: l.want, height: l.height })),
      bounds.y,
      bounds.y + bounds.height,
      4,
    );
    for (const l of group) {
      l.y = placed.get(l.key) ?? l.want;
      const arc = p.arcs.find((a) => a.key === l.key)!;
      const mid = (arc.start + arc.end) / 2;
      const px = p.cx + Math.sin(mid) * (p.outer + 2);
      const py = p.cy - Math.cos(mid) * (p.outer + 2);
      const edge = side === 'right' ? l.x - 4 : l.x + l.width + 4;
      if (l.style === 'advanced') {
        const ly = l.y - l.height / 2 + lineH(ADVANCED.name) / 2;
        l.leader = Math.abs(ly - py) < 1 ? [[edge, ly], [px, py]] : [[edge, ly], [px, ly], [px, py]];
      } else if (Math.abs(l.y - l.want) > DONUT.leaderThreshold) {
        // Pushed away from its segment: keep hugging the ring at the new height and connect with a leader.
        const r = p.outer + l.offset;
        const dy = Math.min(r, Math.max(0, Math.abs(l.y - p.cy) - l.height / 2));
        const dx = Math.sqrt(r * r - dy * dy);
        l.x = side === 'right' ? p.cx + dx : p.cx - dx - l.width;
        const e = side === 'right' ? l.x - 4 : l.x + l.width + 4;
        l.leader = [[e, l.y], [px, py]];
      }
    }
  }
  return labels.map(({ want: _w, ...l }) => l);
}
