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

/** Wrap the title (bold) and subtitle (regular, secondary color) to the chart width. */
export function layoutTitle(title: string | undefined, subtitle: string | undefined, sizes: SizeTokens, width: number): TitleLayout | null {
  if (!title && !subtitle) return null;
  const lines: TitleLine[] = [];
  let y = 0;
  if (title) {
    const f = font(sizes.titleFont, 700);
    const lh = Math.round(sizes.titleFont * CHROME.titleLineHeight);
    for (const text of wrapText(title, f, width, 3)) {
      lines.push({ text, y, font: f, secondary: false });
      y += lh;
    }
  }
  if (subtitle) {
    if (title) y += 4;
    const f = font(CHROME.subtitleFont);
    const lh = Math.round(CHROME.subtitleFont * CHROME.subtitleLineHeight);
    for (const text of wrapText(subtitle, f, width, 3)) {
      lines.push({ text, y, font: f, secondary: true });
      y += lh;
    }
  }
  return { lines, height: y };
}

export function drawTitle(layout: TitleLayout, x: number, y: number, theme: Theme): SceneNode {
  return group(
    'title',
    layout.lines.map((l, i) => ({
      type: 'text' as const,
      key: `t${i}`,
      x: 0,
      y: l.y,
      text: l.text,
      font: l.font,
      baseline: 'top' as const,
      style: { fill: l.secondary ? theme.textSecondary : theme.text },
    })),
    { x, y },
  );
}
