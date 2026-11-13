/** Font size assumed when the font string has no px size. */
const FALLBACK_FONT_SIZE = 12;
/** Average glyph width as a share of the font size, used when no canvas is available. */
const BOLD_CHAR_WIDTH = 0.58;
const REGULAR_CHAR_WIDTH = 0.53;
/** The cache is cleared once it holds more than this many entries. */
const MAX_CACHE_ENTRIES = 5000;
const ELLIPSIS = '\u2026';
const FONT_SIZE_PX = /(\d+(?:\.\d+)?)px/;
/** Weights 600–900 or the `bold` keyword. */
const BOLD_FONT = /^(6|7|8|9)00|bold/;

let canvasContext: CanvasRenderingContext2D | null | undefined;
const widthCache = new Map<string, number>();

/** Lazily created 2D context for measuring text; null outside the browser. */
function context(): CanvasRenderingContext2D | null {
  if (canvasContext !== undefined) return canvasContext;
  canvasContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  return canvasContext;
}

function estimateWidth(text: string, font: string): number {
  const size = Number(FONT_SIZE_PX.exec(font)?.[1] ?? FALLBACK_FONT_SIZE);
  const isBold = BOLD_FONT.test(font);
  return text.length * size * (isBold ? BOLD_CHAR_WIDTH : REGULAR_CHAR_WIDTH);
}

/** Width of `text` in pixels for a CSS font shorthand. Falls back to an estimate outside the browser. */
export function measureText(text: string, font: string): number {
  const cacheKey = font + '\u0000' + text;
  const cached = widthCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const canvas = context();
  let width: number;
  if (canvas) {
    canvas.font = font;
    width = canvas.measureText(text).width;
  } else {
    width = estimateWidth(text, font);
  }
  if (widthCache.size > MAX_CACHE_ENTRIES) widthCache.clear();
  widthCache.set(cacheKey, width);
  return width;
}

export function clearTextCache(): void {
  widthCache.clear();
}

/** Truncate with an ellipsis so the text fits in `max` pixels. */
export function truncate(text: string, font: string, max: number): string {
  if (measureText(text, font) <= max) return text;
  // Binary search for the longest prefix that still fits with the ellipsis.
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (measureText(text.slice(0, mid) + ELLIPSIS, font) <= max) low = mid;
    else high = mid - 1;
  }
  return low === 0 ? '' : text.slice(0, low) + ELLIPSIS;
}

/** Greedy word wrap into lines no wider than `max`. Words longer than a line are truncated. */
export function wrapText(text: string, font: string, max: number, maxLines = Infinity): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measureText(candidate, font) <= max) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  const fitted = lines.map((line) => truncate(line, font, max));
  if (fitted.length <= maxLines) return fitted;
  // Overflowing text is joined into the last kept line and truncated there.
  const kept = fitted.slice(0, maxLines);
  const overflow = lines.slice(maxLines - 1).join(' ');
  kept[maxLines - 1] = truncate(overflow, font, max);
  return kept;
}
