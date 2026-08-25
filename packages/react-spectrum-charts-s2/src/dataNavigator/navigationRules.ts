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
import { NavigationRules } from 'data-navigator';

/**
 * The single set of keyboard navigation rules shared by every region (chart content, axes,
 * legend) and by the top-level region strip that connects them: Left/Right move between
 * siblings, Enter drills into a region or a group, Escape drills back out. data-navigator
 * resolves valid moves per-node from that node's own edges, so reusing the same four
 * bindings at every depth is unambiguous and keeps the whole widget's key handling uniform.
 */
export const baseNavigationRules: NavigationRules = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};
