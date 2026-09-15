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
import { NavigationRules, Structure } from 'data-navigator';

import { Orientation } from '@spectrum-charts/vega-spec-builder-s2';

/** Shared keyboard navigation rules: Left/Right (and Up/Down synonyms, see {@link addSiblingKeySynonyms}) move between siblings, Enter drills in, Escape drills out. */
export const baseNavigationRules: NavigationRules = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  up: { key: 'ArrowUp', direction: 'source' },
  down: { key: 'ArrowDown', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};

/**
 * Maps physical arrow keys onto the graph's logical axes for the chart's orientation: `left`/`right`
 * is always the stack axis and `up`/`down` the segment axis, so a horizontal chart (stacks running
 * top-to-bottom, segments left-to-right) just rebinds which arrow key drives each without touching the graph.
 */
export const getBaseNavigationRules = (orientation: Orientation = 'vertical'): NavigationRules =>
  orientation === 'horizontal'
    ? {
        // Stack axis on Up/Down (stacks run top-to-bottom); segment axis on Left/Right, in reading order (origin-first).
        left: { key: 'ArrowUp', direction: 'source' },
        right: { key: 'ArrowDown', direction: 'target' },
        up: { key: 'ArrowLeft', direction: 'source' },
        down: { key: 'ArrowRight', direction: 'target' },
        child: { key: 'Enter', direction: 'target' },
        parent: { key: 'Escape', direction: 'source' },
      }
    : baseNavigationRules;

/** `sibling_sibling` is typed as an exact `['left', 'right']` 2-tuple, so Up/Down can't be registered at structure-build time — copy each sibling edge's left/right rule onto its up/down synonym after the fact. */
export const addSiblingKeySynonyms = (structure: Structure): void => {
  for (const edge of Object.values(structure.edges)) {
    if (edge.navigationRules.includes('left') && !edge.navigationRules.includes('up')) {
      edge.navigationRules.push('up');
    }
    if (edge.navigationRules.includes('right') && !edge.navigationRules.includes('down')) {
      edge.navigationRules.push('down');
    }
  }
};
