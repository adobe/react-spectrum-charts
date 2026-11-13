import { CHROME } from './assumptions.js';
import { Notice } from './overlay.js';
import type { Theme } from './theme.js';

/** Heading level of the chart's screen-reader title. */
const HEADING_LEVEL = '3';

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
  heading.setAttribute('aria-level', HEADING_LEVEL);
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
export function applyChrome(dom: ChartDom, chrome: ChromeInput): void {
  const { root } = dom;
  applyThemeVars(root, chrome.theme);
  root.classList.toggle('s2c-minimal', chrome.minimal);
  root.style.width = chrome.width != null ? `${chrome.width}px` : '';
  root.style.height = rootHeight(chrome);
  applyAccessibleName(dom, chrome);
  dom.notice.update(chrome.minimal ? '' : chrome.notice);
  dom.desc.textContent = chrome.description;
}

/** The fixed height, a default when the container has none, or empty to fill the container. */
function rootHeight(chrome: ChromeInput): string {
  if (chrome.height != null) return `${chrome.height}px`;
  if (chrome.containerHeight) return '';
  const defaultHeight = chrome.minimal ? CHROME.minimalHeight : CHROME.defaultHeight;
  return `${defaultHeight}px`;
}

/** Labels the figure by its title heading, or by the chart type's name when there is no title. */
function applyAccessibleName(dom: ChartDom, chrome: ChromeInput): void {
  const { root } = dom;
  dom.heading.textContent = chrome.title ?? '';
  if (chrome.title) {
    root.setAttribute('aria-labelledby', dom.heading.id);
    root.removeAttribute('aria-label');
  } else {
    root.removeAttribute('aria-labelledby');
    root.setAttribute('aria-label', chrome.name);
  }
}

function applyThemeVars(element: HTMLElement, theme: Theme): void {
  const style = element.style;
  element.dataset.theme = theme.name;
  style.setProperty('--s2c-bg', theme.background);
  style.setProperty('--s2c-text', theme.text);
  style.setProperty('--s2c-text2', theme.textSecondary);
  style.setProperty('--s2c-border', theme.surfaceBorder);
  style.setProperty('--s2c-focus', theme.focus);
  style.setProperty('--s2c-surface', theme.surface);
}
