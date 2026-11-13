import { POPOVER, TOOLTIP } from './assumptions.js';
import type { TooltipModel } from './module.js';
import type { ContentResult } from './types.js';

function setContent(el: HTMLElement, content: ContentResult): boolean {
  if (content == null || content === '') {
    el.replaceChildren();
    return false;
  }
  if (typeof content === 'string') el.textContent = content;
  else el.replaceChildren(content);
  return true;
}

/** Place a box next to an anchor point inside `host`, flipping and clamping so it stays visible. */
function place(el: HTMLElement, host: HTMLElement, ax: number, ay: number, prefer: 'side' | 'above', gap = 12): void {
  const hostRect = host.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  // Bounds in host coordinates: the viewport, so overlays may overhang a small chart.
  const minX = -hostRect.left + 4;
  const maxX = vw - hostRect.left - 4;
  const minY = -hostRect.top + 4;
  const maxY = vh - hostRect.top - 4;
  let x: number;
  let y: number;
  if (prefer === 'side') {
    x = ax + gap;
    if (x + w > maxX) x = ax - gap - w;
    y = ay - h / 2;
  } else {
    x = ax - w / 2;
    y = ay - gap - h;
    if (y < minY) y = ay + gap;
  }
  x = Math.max(minX, Math.min(maxX - w, x));
  y = Math.max(minY, Math.min(maxY - h, y));
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
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

/** Default tooltip markup for a chart type's tooltip model. */
export function renderTooltip(model: TooltipModel): HTMLElement {
  const root = document.createElement('div');
  if (model.title) {
    const header = document.createElement('div');
    header.className = 's2c-tt-header';
    header.textContent = model.title;
    root.append(header);
  }
  for (const r of model.rows) {
    const row = document.createElement('div');
    row.className = 's2c-tt-row' + (r.total ? ' s2c-tt-total' : '');
    if (r.color) {
      const sw = document.createElement('span');
      sw.className = 's2c-swatch';
      sw.style.background = r.color;
      row.append(sw);
    }
    const n = document.createElement('span');
    n.className = 's2c-tt-name';
    n.textContent = r.name;
    const v = document.createElement('span');
    v.className = 's2c-tt-value';
    v.textContent = r.value;
    row.append(n, v);
    root.append(row);
  }
  return root;
}

export class Popover {
  readonly element: HTMLElement;
  private restoreFocus: HTMLElement | null = null;
  // Presses inside the chart are handled by its click logic (select another mark, Shift-add, or clear).
  private onDocDown = (e: Event): void => {
    if (!this.host.contains(e.target as Node)) this.onDismiss();
  };
  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
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
    if (!wasOpen) {
      // Defer so the click that opened the popover doesn't immediately dismiss it.
      setTimeout(() => {
        if (!this.open) return;
        document.addEventListener('pointerdown', this.onDocDown, true);
        document.addEventListener('keydown', this.onKey, true);
      }, 0);
      if (focus) {
        this.restoreFocus = document.activeElement as HTMLElement | null;
        const first = this.element.querySelector<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        (first ?? this.element).focus();
      }
    }
  }

  reposition(x: number, y: number): void {
    if (this.open) place(this.element, this.host, x, y, 'above', POPOVER.offset);
  }

  hide(): void {
    if (!this.open) return;
    this.element.hidden = true;
    document.removeEventListener('pointerdown', this.onDocDown, true);
    document.removeEventListener('keydown', this.onKey, true);
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
    close.textContent = '\u00d7';
    close.addEventListener('click', () => {
      this.dismissedFor = this.current;
      this.element.hidden = true;
    });
    this.element.append(this.text, close);
  }

  /** Returns true when the visibility changed (layout must be recomputed). */
  update(message: string): boolean {
    const was = this.element.hidden;
    this.current = message;
    if (!message || message === this.dismissedFor) this.element.hidden = true;
    else {
      this.text.textContent = message;
      this.element.hidden = false;
    }
    return was !== this.element.hidden;
  }
}
