import type { BaseChartOptions, ChartState } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Options<I> = BaseChartOptions<I, any>;

/** Hidden, highlighted and selected state: read from `options.state` when controlled, kept here otherwise. */
export class InteractionState<I> {
  private internal: { selected: I[]; highlighted: string | null; hidden: string[] } = { selected: [], highlighted: null, hidden: [] };

  constructor(private readonly options: () => Options<I>) {}

  controlled(key: keyof ChartState<I>): boolean {
    const state = this.options().state;
    return !!state && key in state;
  }

  hidden(): Set<string> {
    return new Set(this.controlled('hidden') ? (this.options().state!.hidden ?? []) : this.internal.hidden);
  }

  highlighted(): string | null {
    return this.controlled('highlighted') ? (this.options().state!.highlighted ?? null) : this.internal.highlighted;
  }

  selected(): I[] {
    return this.controlled('selected') ? (this.options().state!.selected ?? []) : this.internal.selected;
  }

  /** Returns false when hidden state is controlled. */
  setHidden(keys: string[]): boolean {
    if (this.controlled('hidden')) return false;
    this.internal.hidden = [...keys];
    return true;
  }

  setHighlighted(key: string | null): void {
    if (!this.controlled('highlighted')) this.internal.highlighted = key;
  }

  setSelected(items: I[]): void {
    if (!this.controlled('selected')) this.internal.selected = items;
  }
}
