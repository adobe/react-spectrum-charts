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

/** Shared keyboard navigation rules: Left/Right (and Up/Down synonyms, see {@link addSiblingKeySynonyms}) move between siblings, Enter drills in, Escape drills out. */
export const baseNavigationRules: NavigationRules = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  up: { key: 'ArrowUp', direction: 'source' },
  down: { key: 'ArrowDown', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};

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
