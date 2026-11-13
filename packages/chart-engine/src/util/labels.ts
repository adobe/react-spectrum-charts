export interface LabelBox {
  id: string;
  /** Preferred centre. */
  y: number;
  height: number;
}

/**
 * Resolve vertical overlaps between labels while keeping each as close as possible to its
 * preferred position and inside [min, max]. Returns centre positions keyed by id.
 */
export function resolveVertical(labels: LabelBox[], min: number, max: number, gap = 2): Map<string, number> {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const out = sorted.map((l) => ({ ...l, pos: l.y }));
  // Merge overlapping labels into clusters centred on their mean preferred position.
  type Cluster = { items: typeof out; top: number; size: number; want: number };
  const clusters: Cluster[] = [];
  for (const item of out) {
    const c: Cluster = { items: [item], top: item.y - item.height / 2, size: item.height, want: item.y - item.height / 2 };
    clusters.push(c);
    while (clusters.length > 1) {
      const b = clusters[clusters.length - 1];
      const a = clusters[clusters.length - 2];
      if (a.top + a.size + gap <= b.top) break;
      const items = [...a.items, ...b.items];
      const size = a.size + gap + b.size;
      // Average offset of each item's preferred top from its slot in the merged block.
      let acc = 0;
      let offset = 0;
      for (const it of items) {
        acc += it.y - it.height / 2 - offset;
        offset += it.height + gap;
      }
      const top = acc / items.length;
      clusters.splice(clusters.length - 2, 2, { items, top, size, want: top });
    }
  }
  for (const c of clusters) {
    c.top = Math.max(min, Math.min(max - c.size, c.top));
  }
  // Clamping can reintroduce overlaps at the edges; sweep both directions.
  for (let i = 1; i < clusters.length; i++) {
    const prev = clusters[i - 1];
    clusters[i].top = Math.max(clusters[i].top, prev.top + prev.size + gap);
  }
  for (let i = clusters.length - 2; i >= 0; i--) {
    const next = clusters[i + 1];
    if (next.top + next.size > max) next.top = Math.max(min, max - next.size);
    clusters[i].top = Math.min(clusters[i].top, next.top - gap - clusters[i].size);
  }
  const result = new Map<string, number>();
  for (const c of clusters) {
    let t = c.top;
    for (const it of c.items) {
      result.set(it.id, t + it.height / 2);
      t += it.height + gap;
    }
  }
  return result;
}
