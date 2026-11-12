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
import { ScaleLinear } from 'd3-scale';

import { nodeBounds, union } from './bounds.js';
import { ComponentContext, defineComponent } from './component.js';
import { RuleNode, SceneNode, group } from './scene.js';

/**
 * Gets the baseline rules axes with `baseline` draw at `baselineOffset` when the opposing scale is linear, like Vega.
 * @param ctx
 * @param offset whether to get the offset baselines Vega draws under the marks, or the zero baselines it draws over them
 * @returns baseline nodes
 */
const getBaselines = (ctx: ComponentContext, offset: boolean): SceneNode[] =>
  (ctx.options.axes ?? []).flatMap((axis) => {
    const { width, height, xScale, xScaleType, yScale } = ctx;
    const vertical = axis.position === 'left' || axis.position === 'right';
    if (!axis.baseline || (vertical && xScaleType !== 'linear')) return [];
    const value = axis.baselineOffset ?? 0;
    if ((value !== 0) !== offset) return [];
    const scale = (vertical ? xScale : yScale) as ScaleLinear<number, number>;
    const at = scale(value);
    const key = vertical ? 'yBaseline' : 'xBaseline';
    const rule: RuleNode = {
      type: 'rule',
      key,
      role: 'rule',
      ...(vertical ? { x: at, y: 0, x2: at, y2: height } : { x: 0, y: at, x2: width, y2: at }),
      stroke: ctx.theme.ruleColor,
      strokeWidth: 1,
    };
    const [d0, d1] = scale.domain();
    const inDomain = value >= Math.min(d0, d1) && value <= Math.max(d0, d1);
    return [inDomain ? rule : group(`${key}Clip`, [rule], { clip: { x: 0, y: 0, width, height } })];
  });

const baselineComponent = (offset: boolean) =>
  defineComponent<SceneNode[]>({
    name: offset ? 'offsetBaselines' : 'baselines',
    stage: 'plot',
    layer: offset ? -1 : 2,
    layout: (ctx) => {
      const nodes = getBaselines(ctx, offset);
      for (const node of nodes) union(ctx.bounds.view, nodeBounds(node));
      return nodes;
    },
    scene: (nodes) => nodes,
  });

/** Baselines at a non-zero offset, which Vega draws under the marks. */
export const offsetBaselinesComponent = baselineComponent(true);
/** Zero baselines, which Vega draws over the marks. */
export const baselinesComponent = baselineComponent(false);
