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

import { DimensionScaleType, XScale } from './scales.js';
import { RuleNode, SceneNode, group } from './scene.js';
import { Theme } from './theme.js';
import { ResolvedChartOptions } from './types.js';

interface BaselineContext {
  options: ResolvedChartOptions;
  theme: Theme;
  width: number;
  height: number;
  xScale: XScale;
  xScaleType: DimensionScaleType;
  yScale: ScaleLinear<number, number>;
}

/**
 * Gets the baseline rules of axes with `baseline`, drawn at `baselineOffset` when the opposing scale is linear.
 * @param ctx
 * @param offset whether to get baselines at a non-zero offset (drawn under the marks) or at zero (drawn over them)
 * @returns baseline nodes
 */
export const getBaselines = (ctx: BaselineContext, offset: boolean): SceneNode[] =>
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
