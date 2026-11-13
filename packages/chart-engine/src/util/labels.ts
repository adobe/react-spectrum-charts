export interface LabelBox {
  id: string;
  /** Preferred centre. */
  y: number;
  height: number;
}

/** A run of labels stacked edge to edge (plus gaps), positioned by its top. */
interface Cluster {
  items: LabelBox[];
  top: number;
  size: number;
}

function preferredTop(label: LabelBox): number {
  return label.y - label.height / 2;
}

/** Top that best fits every item's preferred top: the mean offset from its slot in the merged block. */
function mergedTop(items: LabelBox[], gap: number): number {
  let sum = 0;
  let slotOffset = 0;
  for (const item of items) {
    sum += preferredTop(item) - slotOffset;
    slotOffset += item.height + gap;
  }
  return sum / items.length;
}

/** Sweep labels top to bottom, merging each new one into the previous cluster while they overlap. */
function buildClusters(sorted: LabelBox[], gap: number): Cluster[] {
  const clusters: Cluster[] = [];
  for (const label of sorted) {
    clusters.push({ items: [label], top: preferredTop(label), size: label.height });
    while (clusters.length > 1) {
      const lower = clusters[clusters.length - 1];
      const upper = clusters[clusters.length - 2];
      if (upper.top + upper.size + gap <= lower.top) break;
      const items = [...upper.items, ...lower.items];
      const size = upper.size + gap + lower.size;
      clusters.splice(clusters.length - 2, 2, { items, top: mergedTop(items, gap), size });
    }
  }
  return clusters;
}

/** Clamp clusters into [min, max], then push apart any that the clamp made overlap. */
function fitClusters(clusters: Cluster[], min: number, max: number, gap: number): void {
  for (const cluster of clusters) {
    cluster.top = Math.max(min, Math.min(max - cluster.size, cluster.top));
  }
  for (let i = 1; i < clusters.length; i++) {
    const previous = clusters[i - 1];
    clusters[i].top = Math.max(clusters[i].top, previous.top + previous.size + gap);
  }
  for (let i = clusters.length - 2; i >= 0; i--) {
    const next = clusters[i + 1];
    if (next.top + next.size > max) next.top = Math.max(min, max - next.size);
    clusters[i].top = Math.min(clusters[i].top, next.top - gap - clusters[i].size);
  }
}

/**
 * Resolve vertical overlaps between labels while keeping each as close as possible to its
 * preferred position and inside [min, max]. Returns centre positions keyed by id.
 */
export function resolveVertical(labels: LabelBox[], min: number, max: number, gap = 2): Map<string, number> {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const clusters = buildClusters(sorted, gap);
  fitClusters(clusters, min, max, gap);
  const centers = new Map<string, number>();
  for (const cluster of clusters) {
    let top = cluster.top;
    for (const item of cluster.items) {
      centers.set(item.id, top + item.height / 2);
      top += item.height + gap;
    }
  }
  return centers;
}
