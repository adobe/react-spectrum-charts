import { CHROME } from './assumptions.js';
import { Notice } from './overlay.js';
import type { Theme } from './theme.js';

/** The chart's DOM: an accessible figure with a hidden heading and description around the drawing stage. */
export interface ChartDom {
  root: HTMLElement;
  heading: HTMLElement;
  desc: HTMLElement;
  notice: Notice;
  stage: HTMLElement;
}

export function createChartDom(id: string): ChartDom {
  const root = document.createElement('div');
  root.className = 's2c-root';
  root.setAttribute('role', 'figure');

  const heading = document.createElement('div');
  heading.className = 's2c-sr-only';
  heading.id = `${id}-title`;
  heading.setAttribute('role', 'heading');
  heading.setAttribute('aria-level', '3');
  const desc = document.createElement('p');
  desc.className = 's2c-sr-only';
  desc.id = `${id}-desc`;
  root.setAttribute('aria-describedby', desc.id);

  const stage = document.createElement('div');
  stage.className = 's2c-stage';
  stage.id = `${id}-stage`;
  const notice = new Notice();
  root.append(heading, notice.element, stage, desc);
  return { root, heading, desc, notice, stage };
}

export interface ChromeInput {
  theme: Theme;
  minimal: boolean;
  width?: number;
  height?: number;
  /** Height of the host container; 0 when it doesn't set one. */
  containerHeight: number;
  title?: string;
  /** Accessible name when there is no title. */
  name: string;
  notice: string;
  description: string;
}

/** Applies theme variables, sizing and accessible text. */
export function applyChrome(dom: ChartDom, c: ChromeInput): void {
  const { root } = dom;
  applyThemeVars(root, c.theme);
  root.classList.toggle('s2c-minimal', c.minimal);
  root.style.width = c.width != null ? `${c.width}px` : '';
  if (c.height != null) root.style.height = `${c.height}px`;
  else if (!c.containerHeight) root.style.height = `${c.minimal ? CHROME.minimalHeight : CHROME.defaultHeight}px`;
  else root.style.height = '';

  dom.heading.textContent = c.title ?? '';
  if (c.title) {
    root.setAttribute('aria-labelledby', dom.heading.id);
    root.removeAttribute('aria-label');
  } else {
    root.removeAttribute('aria-labelledby');
    root.setAttribute('aria-label', c.name);
  }
  dom.notice.update(c.minimal ? '' : c.notice);
  dom.desc.textContent = c.description;
}

function applyThemeVars(el: HTMLElement, t: Theme): void {
  const s = el.style;
  el.dataset.theme = t.name;
  s.setProperty('--s2c-bg', t.background);
  s.setProperty('--s2c-text', t.text);
  s.setProperty('--s2c-text2', t.textSecondary);
  s.setProperty('--s2c-border', t.surfaceBorder);
  s.setProperty('--s2c-focus', t.focus);
  s.setProperty('--s2c-surface', t.surface);
}
