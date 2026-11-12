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
import { GroupNode, TextNode, group } from './scene.js';
import { textBounds } from './text.js';
import { Theme } from './theme.js';
import { Position, ResolvedChartOptions, TitleOptions } from './types.js';

const ALIGN = { start: 'left', middle: 'center', end: 'right' } as const;
const ANGLE = { top: 0, bottom: 0, left: -90, right: 90 } as const;

export interface TitleResult {
  orient: Position;
  position: 'start' | 'middle' | 'end';
  node: GroupNode;
  /** Space the title takes outside the plot. */
  thickness: number;
}

/**
 * Resolves the chart title a `Title` child wins over the chart `title` prop.
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
 * Builds the chart title, unplaced.
 * @param options
 * @param theme
 * @returns TitleResult, or undefined when the chart has no title
 */
export const buildTitle = (options: ResolvedChartOptions, theme: Theme): TitleResult | undefined => {
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
  const b = textBounds(text);
  const vertical = orient === 'left' || orient === 'right';
  const thickness = Math.ceil(vertical ? b.x2 - b.x1 : b.y2 - b.y1);
  return { orient, position, thickness, node: group('title', [text], { role: 'title' }) };
};

/**
 * Places the title along its side of the plot, `distance` pixels out from the plot edge.
 * @param title
 * @param width plot width
 * @param height plot height
 * @param distance
 */
export const placeTitle = ({ orient, position, node, thickness }: TitleResult, width: number, height: number, distance: number) => {
  const vertical = orient === 'left' || orient === 'right';
  const length = vertical ? height : width;
  // rotated text reads bottom-to-top on the left, so its start is at the bottom
  const flip = orient === 'left';
  const along = { start: flip ? length : 0, middle: length / 2, end: flip ? 0 : length }[position];
  if (vertical) {
    node.y = along;
    node.x = orient === 'left' ? -distance : width + distance;
  } else {
    node.x = along;
    node.y = orient === 'top' ? -distance : height + distance - thickness;
  }
};
