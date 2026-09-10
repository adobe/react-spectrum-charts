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
import { Structure } from 'data-navigator';

/** Follows a chain of edge-tagged moves manually, mirroring how data-navigator's input.move() resolves them. */
export const move = (structure: Structure, from: string, navId: string): string | undefined => {
  const node = structure.nodes[from];
  for (const edgeId of node.edges) {
    const edge = structure.edges[edgeId];
    if (!edge.navigationRules.includes(navId)) continue;
    const rule = structure.navigationRules?.[navId];
    if (!rule) continue;
    const resolved = rule.direction === 'source' ? edge.source : edge.target;
    if (typeof resolved === 'string' && resolved !== from) return resolved;
  }
  return undefined;
};
