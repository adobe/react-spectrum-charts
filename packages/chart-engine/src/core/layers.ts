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

/** A size no real layout matches, so the next `resize` always applies. */
function unsetSize(): { width: number; height: number; background: string } {
  return { width: -1, height: -1, background: '' };
}

function plotGroup(frame: ChartFrame, key: string, children: SceneNode[]): GroupNode {
  return group(key, children, { x: frame.plot.x, y: frame.plot.y });
}

/** Title and the module's background content, e.g. axes. */
export function backLayer<O, G, K>(input: LayerInput<O, G, K>): GroupNode {
  const nodes: SceneNode[] = [];
  const { frame } = input;
  if (frame.title) nodes.push(drawTitle(frame.title.layout, frame.title.x, frame.title.y, input.env.theme));
  if (input.draw.back) {
    const axes = input.draw.back(input.geometry, input.options, input.env);
    nodes.push(plotGroup(frame, 'axes', axes));
  }
  return group('back', nodes);
}

export function marksLayer<O, G, K>(input: LayerInput<O, G, K>, state: DrawState<K>): GroupNode {
  const marks = input.draw.marks(input.geometry, state, input.env, input.options);
  return group('marks', [plotGroup(input.frame, 'plot', marks)]);
}

/** The module's foreground content, e.g. reference lines, and the legend. */
export function frontLayer<O, G, K>(input: LayerInput<O, G, K>, legend: LegendDrawState): GroupNode {
  const nodes: SceneNode[] = [];
  if (input.draw.front) {
    const references = input.draw.front(input.geometry, input.options, input.env);
    nodes.push(plotGroup(input.frame, 'refs', references));
  }
  if (input.frame.legend) nodes.push(drawLegend(input.frame.legend, legend, input.env.theme, input.env.sizes));
  return group('front', nodes);
}

export function overlayLayer<O, G, K>(input: LayerInput<O, G, K>, state: DrawState<K>): GroupNode {
  const overlay = input.draw.overlay(input.geometry, state, input.env, input.options);
  return group('overlay', [plotGroup(input.frame, 'plot', overlay)]);
}

/** The renderer and its layers. Layers other than the overlay redraw only when their signature changes. */
export class LayerStack {
  private renderer: Renderer | null = null;
  private type: RendererType | null = null;
  private signatures = new Map<LayerId, string>();
  /** Last size the renderer was set to. */
  size = unsetSize();

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
    const current = this.size;
    if (width === current.width && height === current.height && background === current.background) return;
    this.size = { width, height, background };
    this.renderer!.setSize(width, height, background);
    this.signatures.clear();
  }

  /** Forces the next `resize` to apply, e.g. after a pixel ratio change. */
  invalidate(): void {
    this.size = unsetSize();
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
