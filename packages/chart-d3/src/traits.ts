/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { deemphasisOpacity } from './animation.js';
import { MarkOutput } from './charts/chartType.js';
import { SceneNode } from './scene.js';

/** Overflow past the draw-in sweep, so strokes on the plot edges aren't cut. */
const DRAW_IN_CLIP_OVERFLOW = 1000;

/** Per-frame values node traits read. */
export interface TraitFrame {
  /** Animated hover fraction per series while hover animates. */
  fraction?: (key: string) => number;
  /** Draw-in sweep position while drawing in. */
  drawInX?: number;
  height: number;
}

const applyNode = (node: SceneNode, frame: TraitFrame): SceneNode => {
  let next = node;
  if (node.type === 'group') {
    let changed = false;
    const children = node.children.map((child) => {
      const applied = applyNode(child, frame);
      changed ||= applied !== child;
      return applied;
    });
    if (changed) next = { ...node, children };
  }
  const { traits } = node;
  if (!traits) return next;
  const { fraction, drawInX, height } = frame;
  let { opacity } = next;
  if (fraction && traits.emphasis !== undefined) opacity = deemphasisOpacity(fraction(traits.emphasis));
  if (drawInX !== undefined && traits.revealX !== undefined && drawInX < traits.revealX - 0.5) opacity = 0;
  if (opacity !== next.opacity) next = { ...next, opacity };
  if (drawInX !== undefined && traits.drawInClip && next.type === 'group') {
    const { fixedHeight } = traits.drawInClip;
    const clip = {
      x: -DRAW_IN_CLIP_OVERFLOW,
      y: fixedHeight === undefined ? -DRAW_IN_CLIP_OVERFLOW : 0,
      width: drawInX + DRAW_IN_CLIP_OVERFLOW,
      height: fixedHeight ?? height + 2 * DRAW_IN_CLIP_OVERFLOW,
    };
    next = { ...next, clip };
  }
  return next;
};

/**
 * Applies node traits for a frame: hover emphasis opacity, draw-in reveal and the draw-in clip.
 * @param output a mark's output built for the current state
 * @param frame
 * @returns the output with traits applied; unchanged nodes keep their identity
 */
export const applyTraits = (output: MarkOutput, frame: TraitFrame): MarkOutput => {
  if (!frame.fraction && frame.drawInX === undefined) return output;
  return {
    ...output,
    marks: output.marks.map((node) => applyNode(node, frame)),
    overlay: output.overlay.map((node) => applyNode(node, frame)),
  };
};
