import { POPOVER, TOOLTIP } from './assumptions.js';
import type { TooltipModel, TooltipRow } from './module.js';
import type { ContentResult } from './types.js';

/** Minimum distance kept between an overlay and the viewport edge, in px. */
const VIEWPORT_MARGIN = 4;
/** Default gap between the anchor point and the overlay, in px. */
const DEFAULT_ANCHOR_GAP = 12;
const FOCUSABLE_SELECTOR = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
const MULTIPLICATION_SIGN = '\u00d7';

/** Replaces the element's content; returns false when there is nothing to show. */
function setContent(element: HTMLElement, content: ContentResult): boolean {
  if (content == null || content === '') {
    element.replaceChildren();
    return false;
  }
  if (typeof content === 'string') element.textContent = content;
  else element.replaceChildren(content);
  return true;
}

/** Place a box next to an anchor point inside `host`, flipping and clamping so it stays visible. */
function place(
  element: HTMLElement,
  host: HTMLElement,
  anchorX: number,
  anchorY: number,
  prefer: 'side' | 'above',
  gap = DEFAULT_ANCHOR_GAP,
): void {
  const hostRect = host.getBoundingClientRect();
  const boxWidth = element.offsetWidth;
  const boxHeight = element.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  // Bounds in host coordinates: the viewport, so overlays may overhang a small chart.
  const minX = -hostRect.left + VIEWPORT_MARGIN;
  const maxX = viewportWidth - hostRect.left - VIEWPORT_MARGIN;
  const minY = -hostRect.top + VIEWPORT_MARGIN;
  const maxY = viewportHeight - hostRect.top - VIEWPORT_MARGIN;
  let x: number;
  let y: number;
  if (prefer === 'side') {
    x = anchorX + gap;
    if (x + boxWidth > maxX) x = anchorX - gap - boxWidth;
    y = anchorY - boxHeight / 2;
  } else {
    x = anchorX - boxWidth / 2;
    y = anchorY - gap - boxHeight;
    if (y < minY) y = anchorY + gap;
  }
  x = Math.max(minX, Math.min(maxX - boxWidth, x));
  y = Math.max(minY, Math.min(maxY - boxHeight, y));
  element.style.left = `${Math.round(x)}px`;
  element.style.top = `${Math.round(y)}px`;
}

export class Tooltip {
  readonly element: HTMLElement;

  constructor(private host: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 's2c-tooltip';
    this.element.setAttribute('role', 'presentation');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.hidden = true;
    host.append(this.element);
  }

  show(content: ContentResult, x: number, y: number): void {
    if (!setContent(this.element, content)) {
      this.hide();
      return;
    }
    this.element.hidden = false;
    place(this.element, this.host, x, y, 'side', TOOLTIP.offset);
  }

  hide(): void {
    this.element.hidden = true;
  }
}

function tooltipRow(row: TooltipRow): HTMLElement {
  const element = document.createElement('div');
  element.className = 's2c-tt-row' + (row.total ? ' s2c-tt-total' : '');
  if (row.color) {
    const swatch = document.createElement('span');
    swatch.className = 's2c-swatch';
    swatch.style.background = row.color;
    element.append(swatch);
  }
  const name = document.createElement('span');
  name.className = 's2c-tt-name';
  name.textContent = row.name;
  const value = document.createElement('span');
  value.className = 's2c-tt-value';
  value.textContent = row.value;
  element.append(name, value);
  return element;
}

/** Default tooltip markup for a chart type's tooltip model. */
export function renderTooltip(model: TooltipModel): HTMLElement {
  const root = document.createElement('div');
  if (model.title) {
    const header = document.createElement('div');
    header.className = 's2c-tt-header';
    header.textContent = model.title;
    root.append(header);
  }
  for (const row of model.rows) root.append(tooltipRow(row));
  return root;
}

export class Popover {
  readonly element: HTMLElement;
  private restoreFocus: HTMLElement | null = null;
  // Presses inside the chart are handled by its click logic (select another mark, Shift-add, or clear).
  private onDocumentPointerDown = (event: Event): void => {
    if (!this.host.contains(event.target as Node)) this.onDismiss();
  };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      this.onDismiss();
    }
  };

  constructor(
    private host: HTMLElement,
    private onDismiss: () => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 's2c-popover';
    this.element.setAttribute('role', 'dialog');
    this.element.tabIndex = -1;
    this.element.hidden = true;
    host.append(this.element);
  }

  get open(): boolean {
    return !this.element.hidden;
  }

  show(content: ContentResult, x: number, y: number, label: string, focus: boolean): void {
    if (!setContent(this.element, content)) {
      this.hide();
      return;
    }
    const wasOpen = this.open;
    this.element.setAttribute('aria-label', label);
    this.element.hidden = false;
    place(this.element, this.host, x, y, 'above', POPOVER.offset);
    if (!wasOpen) this.onOpen(focus);
  }

  private onOpen(focus: boolean): void {
    // Defer so the click that opened the popover doesn't immediately dismiss it.
    setTimeout(() => {
      if (!this.open) return;
      document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
      document.addEventListener('keydown', this.onKeyDown, true);
    }, 0);
    if (focus) {
      this.restoreFocus = document.activeElement as HTMLElement | null;
      const firstFocusable = this.element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? this.element).focus();
    }
  }

  reposition(x: number, y: number): void {
    if (this.open) place(this.element, this.host, x, y, 'above', POPOVER.offset);
  }

  hide(): void {
    if (!this.open) return;
    this.element.hidden = true;
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    if (this.restoreFocus?.isConnected && this.element.contains(document.activeElement)) this.restoreFocus.focus();
    this.restoreFocus = null;
  }

  destroy(): void {
    this.hide();
    this.element.remove();
  }
}

export class Notice {
  readonly element: HTMLElement;
  private text: HTMLElement;
  private dismissedFor = '';
  private current = '';

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 's2c-notice';
    this.element.setAttribute('role', 'status');
    this.element.hidden = true;
    this.text = document.createElement('span');
    this.text.className = 's2c-notice-text';
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = MULTIPLICATION_SIGN;
    close.addEventListener('click', () => {
      this.dismissedFor = this.current;
      this.element.hidden = true;
    });
    this.element.append(this.text, close);
  }

  /** Returns true when the visibility changed (layout must be recomputed). */
  update(message: string): boolean {
    const wasHidden = this.element.hidden;
    this.current = message;
    if (!message || message === this.dismissedFor) this.element.hidden = true;
    else {
      this.text.textContent = message;
      this.element.hidden = false;
    }
    return wasHidden !== this.element.hidden;
  }
}
