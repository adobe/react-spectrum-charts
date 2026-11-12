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
import { translate, union } from './bounds.js';
import { defineComponent } from './component.js';
import { GroupNode, TextNode, group } from './scene.js';
import { Bounds, textBounds } from './text.js';
import { Theme } from './theme.js';
import { ResolvedChartOptions, TitleOptions } from './types.js';

const ALIGN = { start: 'left', middle: 'center', end: 'right' } as const;
const ANGLE = { top: 0, bottom: 0, left: -90, right: 90 } as const;

/**
 * Resolves the chart title like the S2 spec builder: a `Title` child wins over the chart `title` prop.
 * @param options
 * @returns title options, or undefined when the chart has no title
 */
const getTitleOptions = (
  options: ResolvedChartOptions
): (Required<Omit<TitleOptions, 'text'>> & { text: string }) | undefined => {
  const title = options.titles?.[0];
  if (title) return { fontWeight: 700, fontSize: 24, position: 'start', orient: 'top', ...title };
  if (!options.title) return undefined;
  return { text: options.title, fontWeight: 'bold', fontSize: 0, position: 'start', orient: 'top' };
};

/**
 * Builds and places the chart title outside the view bounds, like Vega's `titleLayout` with `frame: group`.
 * @param options
 * @param theme
 * @param width plot width
 * @param height plot height
 * @param viewBounds bounds of everything else in the view
 * @returns the title node and its bounds, or undefined
 */
export const buildTitle = (
  options: ResolvedChartOptions,
  theme: Theme,
  width: number,
  height: number,
  viewBounds: Bounds
): { node: GroupNode; bounds: Bounds } | undefined => {
  const title = getTitleOptions(options);
  if (!title) return undefined;
  const { orient, position } = title;
  const text: TextNode = {
    type: 'text',
    key: 'title-text',
    role: 'title-text',
    x: 0,
    y: 0,
    text: title.text,
    fill: theme.title.color,
    font: theme.font,
    fontSize: title.fontSize || theme.title.fontSize,
    fontWeight: title.fontWeight,
    align: ALIGN[position],
    baseline: 'top',
    angle: ANGLE[orient],
  };
  const tb = textBounds(text);
  const vertical = orient === 'left' || orient === 'right';
  let [start, end] = [0, vertical ? height : width];
  if (orient === 'left') [start, end] = [height, 0];
  const anchors: Partial<Record<string, number>> = { start, end };
  const pos = anchors[position] ?? (start + end) / 2;
  const { offset } = theme.title;
  let x = pos;
  let y = pos;
  if (orient === 'top') y = viewBounds.y1 - (tb.y2 - tb.y1) - offset;
  else if (orient === 'bottom') y = viewBounds.y2 + offset;
  else if (orient === 'left') x = viewBounds.x1 - (tb.x2 - tb.x1) - offset;
  else x = viewBounds.x2 + (tb.x2 - tb.x1) + offset;
  return { node: group('title', [text], { role: 'title', x, y }), bounds: translate(tb, x, y) };
};

/** The chart title, placed outside everything else in the view. */
export const titleComponent = defineComponent<GroupNode | undefined>({
  name: 'title',
  stage: 'title',
  layer: 6,
  layout: (ctx) => {
    const title = buildTitle(ctx.options, ctx.theme, ctx.width, ctx.height, ctx.bounds.view);
    if (title) union(ctx.bounds.view, title.bounds);
    return title?.node;
  },
  scene: (node) => (node ? [node] : []),
});
