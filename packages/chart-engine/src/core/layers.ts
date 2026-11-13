import { CanvasRenderer } from '../render/canvas.js';
import type { Renderer } from '../render/renderer.js';
import { group, type GroupNode, type LayerId, type SceneNode } from '../render/scene.js';
import { SvgRenderer } from '../render/svg.js';
import type { ChartFrame } from './frame.js';
import { drawLegend, type LegendDrawState } from './legend.js';
import type { DrawHooks, DrawState, Env } from './module.js';
import { drawTitle } from './title.js';
import type { RendererType } from './types.js';

/** What every layer builder needs. */
export interface LayerInput<O, G, K> {
  draw: DrawHooks<O, G, K>;
  geometry: G;
  options: O;
  env: Env;
  frame: ChartFrame;
}

function plotGroup(frame: ChartFrame, key: string, children: SceneNode[]): GroupNode {
  return group(key, children, { x: frame.plot.x, y: frame.plot.y });
}

/** Title and the module's background content, e.g. axes. */
export function backLayer<O, G, K>(i: LayerInput<O, G, K>): GroupNode {
  const nodes: SceneNode[] = [];
  const f = i.frame;
  if (f.title) nodes.push(drawTitle(f.title.layout, f.title.x, f.title.y, i.env.theme));
  if (i.draw.back) nodes.push(plotGroup(f, 'axes', i.draw.back(i.geometry, i.options, i.env)));
  return group('back', nodes);
}

export function marksLayer<O, G, K>(i: LayerInput<O, G, K>, state: DrawState<K>): GroupNode {
  return group('marks', [plotGroup(i.frame, 'plot', i.draw.marks(i.geometry, state, i.env, i.options))]);
}

/** The module's foreground content, e.g. reference lines, and the legend. */
export function frontLayer<O, G, K>(i: LayerInput<O, G, K>, legend: LegendDrawState): GroupNode {
  const nodes: SceneNode[] = [];
  if (i.draw.front) nodes.push(plotGroup(i.frame, 'refs', i.draw.front(i.geometry, i.options, i.env)));
  if (i.frame.legend) nodes.push(drawLegend(i.frame.legend, legend, i.env.theme, i.env.sizes));
  return group('front', nodes);
}

export function overlayLayer<O, G, K>(i: LayerInput<O, G, K>, state: DrawState<K>): GroupNode {
  return group('overlay', [plotGroup(i.frame, 'plot', i.draw.overlay(i.geometry, state, i.env, i.options))]);
}

/** The renderer and its layers. Layers other than the overlay redraw only when their signature changes. */
export class LayerStack {
  private renderer: Renderer | null = null;
  private type: RendererType | null = null;
  private signatures = new Map<LayerId, string>();
  /** Last size the renderer was set to. */
  size = { width: -1, height: -1, background: '' };

  constructor(private readonly stage: HTMLElement) {}

  /** Switches to a renderer of the given type, if it isn't already in use. */
  use(type: RendererType): void {
    if (type === this.type) return;
    this.renderer?.destroy();
    this.renderer = type === 'canvas' ? new CanvasRenderer() : new SvgRenderer();
    this.type = type;
    this.stage.prepend(this.renderer.element);
    this.invalidate();
  }

  /** Applies a new size or background; either change redraws every layer. */
  resize(width: number, height: number, background: string): void {
    const s = this.size;
    if (width === s.width && height === s.height && background === s.background) return;
    this.size = { width, height, background };
    this.renderer!.setSize(width, height, background);
    this.signatures.clear();
  }

  /** Forces the next `resize` to apply, e.g. after a pixel ratio change. */
  invalidate(): void {
    this.size = { width: -1, height: -1, background: '' };
  }

  draw(id: LayerId, signature: string, build: () => GroupNode): void {
    if (id !== 'overlay' && this.signatures.get(id) === signature) return;
    this.signatures.set(id, signature);
    this.renderer!.renderLayer(id, build());
  }

  destroy(): void {
    this.renderer?.destroy();
  }
}
