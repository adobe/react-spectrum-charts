let ctx: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();

function context(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  return ctx;
}

/** Width of `text` in pixels for a CSS font shorthand. Falls back to an estimate outside the browser. */
export function measureText(text: string, font: string): number {
  const key = font + '\u0000' + text;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const c = context();
  let width: number;
  if (c) {
    c.font = font;
    width = c.measureText(text).width;
  } else {
    const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12);
    const bold = /^(6|7|8|9)00|bold/.test(font);
    width = text.length * size * (bold ? 0.58 : 0.53);
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, width);
  return width;
}

export function clearTextCache(): void {
  cache.clear();
}

/** Truncate with an ellipsis so the text fits in `max` pixels. */
export function truncate(text: string, font: string, max: number): string {
  if (measureText(text, font) <= max) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (measureText(text.slice(0, mid) + '\u2026', font) <= max) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? '' : text.slice(0, lo) + '\u2026';
}

/** Greedy word wrap into lines no wider than `max`. Words longer than a line are truncated. */
export function wrapText(text: string, font: string, max: number, maxLines = Infinity): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (!cur || measureText(next, font) <= max) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  const out = lines.map((l) => truncate(l, font, max));
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines);
    kept[maxLines - 1] = truncate(lines.slice(maxLines - 1).join(' '), font, max);
    return kept;
  }
  return out;
}
