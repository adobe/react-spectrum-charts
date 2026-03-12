/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { CSSProperties } from 'react';

import { Padding, View } from 'vega';

import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder';

import { getItemBounds } from '../utils/markClickUtils';

export interface KeyboardTarget {
  datum: Datum;
  vegaBounds: MarkBounds;
  style: CSSProperties;
  markName: string;
  ariaLabel: string;
}

// Keys added by RSC that should not appear in aria labels
const RSC_KEY_PATTERN = /^rsc/i;

/**
 * Traverses the Vega scenegraph after a render and collects one KeyboardTarget
 * per bar item for the given bar component names.
 *
 * Bar mark names follow the convention `${componentName}` (exact match — not
 * `_background`, `_dimensionHoverArea`, `_selectRect`, etc.).
 */
export function extractBarKeyboardTargets(
  view: View,
  padding: Padding,
  barComponentNames: string[]
): KeyboardTarget[] {
  if (!barComponentNames.length) return [];

  const leftPadding = typeof padding === 'number' ? padding : ((padding as { left?: number }).left ?? 0);
  const topPadding = typeof padding === 'number' ? padding : ((padding as { top?: number }).top ?? 0);
  const origin = view.origin();

  const targets: KeyboardTarget[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (view.scenegraph() as any).root;
  collectBarItems(root?.items ?? [], barComponentNames, targets, leftPadding, topPadding, origin);
  return targets;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectBarItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marks: any[],
  barComponentNames: string[],
  targets: KeyboardTarget[],
  leftPadding: number,
  topPadding: number,
  origin: number[]
): void {
  if (!marks?.length) return;

  for (const node of marks) {
    if (!node) continue;

    if (node.marktype === 'group') {
      // Mark for a group: node.items are SceneGroup instances, each with .items = Mark[]
      for (const groupItem of node.items ?? []) {
        collectBarItems(groupItem.items ?? [], barComponentNames, targets, leftPadding, topPadding, origin);
      }
    } else if (node.marktype === 'rect' && barComponentNames.includes(node.name)) {
      // Mark for a rect: node.items are SceneItem instances (rendered bar rects)
      for (const item of node.items ?? []) {
        if (!item.datum) continue;
        const vegaBounds = getItemBounds(item);
        targets.push({
          datum: item.datum as Datum,
          vegaBounds,
          style: {
            position: 'absolute',
            left: vegaBounds.x1 + leftPadding + origin[0],
            top: vegaBounds.y1 + topPadding + origin[1],
            width: vegaBounds.x2 - vegaBounds.x1,
            height: vegaBounds.y2 - vegaBounds.y1,
          },
          markName: node.name as string,
          ariaLabel: generateAriaLabel(item.datum as Datum),
        });
      }
    } else if (!node.marktype && Array.isArray(node.items)) {
      // SceneGroup (GroupItem): no marktype, but has .items = Mark[] — recurse into child marks.
      // This handles the root scenegraph structure where root.items[0] is a SceneGroup,
      // not a Mark, and the actual spec marks are inside it.
      collectBarItems(node.items, barComponentNames, targets, leftPadding, topPadding, origin);
    }
  }
}

function generateAriaLabel(datum: Datum): string {
  return Object.entries(datum)
    .filter(([key]) => !RSC_KEY_PATTERN.test(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}
