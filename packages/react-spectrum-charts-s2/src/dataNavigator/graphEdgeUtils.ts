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
import { Edges, Nodes } from 'data-navigator';

/** Adds a single edge, attached to both nodes, so either end can traverse it in either bound direction. */
export const addSiblingEdge = (edges: Edges, nodes: Nodes, a: string, b: string, navIds: string[]): void => {
  if (a === b) return;
  const edgeId = `${a}<->${b}`;
  edges[edgeId] = { source: a, target: b, navigationRules: [...navIds] };
  nodes[a]?.edges.push(edgeId);
  nodes[b]?.edges.push(edgeId);
};

/** Adds an edge attached to only one side — used for parent/child links, which are inherently one-directional. */
export const addOneSidedEdge = (
  edges: Edges,
  nodes: Nodes,
  attachTo: string,
  source: string,
  target: string,
  navIds: string[]
): void => {
  const edgeId = `${source}->${target}:${navIds.join(',')}`;
  edges[edgeId] = { source, target, navigationRules: [...navIds] };
  nodes[attachTo]?.edges.push(edgeId);
};
