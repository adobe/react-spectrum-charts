import { group, type SceneNode } from '../render/scene.js';
import { wrapText } from '../util/text.js';
import { CHROME } from './assumptions.js';
import { font, type SizeTokens, type Theme } from './theme.js';

export interface TitleLine {
  text: string;
  y: number;
  font: string;
  secondary: boolean;
}

export interface TitleLayout {
  lines: TitleLine[];
  height: number;
}

/** Gap between the last title line and the subtitle, in px. */
const SUBTITLE_GAP = 4;
/** Title and subtitle each wrap to at most this many lines. */
const MAX_LINES = 3;
const TITLE_WEIGHT = 700;

/** Wraps `text` and appends its lines from `y`; returns the y below the last line. */
function appendLines(lines: TitleLine[], text: string, textFont: string, width: number, lineHeight: number, y: number, secondary: boolean): number {
  for (const lineText of wrapText(text, textFont, width, MAX_LINES)) {
    lines.push({ text: lineText, y, font: textFont, secondary });
    y += lineHeight;
  }
  return y;
}

/** Wrap the title (bold) and subtitle (regular, secondary color) to the chart width. */
export function layoutTitle(title: string | undefined, subtitle: string | undefined, sizes: SizeTokens, width: number): TitleLayout | null {
  if (!title && !subtitle) return null;
  const lines: TitleLine[] = [];
  let y = 0;
  if (title) {
    const titleFont = font(sizes.titleFont, TITLE_WEIGHT);
    const lineHeight = Math.round(sizes.titleFont * CHROME.titleLineHeight);
    y = appendLines(lines, title, titleFont, width, lineHeight, y, false);
  }
  if (subtitle) {
    if (title) y += SUBTITLE_GAP;
    const subtitleFont = font(CHROME.subtitleFont);
    const lineHeight = Math.round(CHROME.subtitleFont * CHROME.subtitleLineHeight);
    y = appendLines(lines, subtitle, subtitleFont, width, lineHeight, y, true);
  }
  return { lines, height: y };
}

export function drawTitle(layout: TitleLayout, x: number, y: number, theme: Theme): SceneNode {
  return group(
    'title',
    layout.lines.map((line, i) => ({
      type: 'text' as const,
      key: `t${i}`,
      x: 0,
      y: line.y,
      text: line.text,
      font: line.font,
      baseline: 'top' as const,
      style: { fill: line.secondary ? theme.textSecondary : theme.text },
    })),
    { x, y },
  );
}
