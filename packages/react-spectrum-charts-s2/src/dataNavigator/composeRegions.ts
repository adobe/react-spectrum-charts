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
import { Edges, NodeObject, Nodes, Structure } from 'data-navigator';

import { baseNavigationRules } from './navigationRules';

/** Separator used to namespace an auxiliary region's node/edge ids; unlikely to collide with real data values. */
const REGION_SEPARATOR = '::';

export interface NamedRegion {
  /** Region identifier; read back off `NodeObject.region` by the adapter to decide focus-signal behavior. */
  name: string;
  structure: Structure;
  entryPoint: string | undefined;
  /**
   * When false (chart content), node/edge ids are kept exactly as built, since Vega's focus-ring
   * signal matching compares raw dimension/item ids directly. Auxiliary regions (axes, legend)
   * default to true so their ids can't collide with content's or each other's (e.g. an x-axis tick
   * and a bar both derived from the same dimension field would otherwise share an id).
   */
  namespace?: boolean;
}

export interface ComposedStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const prefixed = (name: string, id: string): string => `${name}${REGION_SEPARATOR}${id}`;

const namespaceRegion = (region: NamedRegion): { nodes: Nodes; edges: Edges; entryPoint: string } => {
  const { name, structure, entryPoint, namespace = true } = region;
  if (!entryPoint) {
    throw new Error(`composeRegions: region "${name}" has no entry point.`);
  }
  const toId = namespace ? (id: string) => prefixed(name, id) : (id: string) => id;

  const nodes: Nodes = {};
  for (const [id, node] of Object.entries(structure.nodes)) {
    const newId = toId(id);
    // Root/division nodes default renderId to their own (pre-namespace) id; without renewing it here it
    // would collide with another region's identically-unprefixed renderId once ids are prefixed below.
    const renderId = namespace ? newId : node.renderId;
    nodes[newId] = { ...node, id: newId, renderId, edges: node.edges.map(toId), region: name };
  }

  const edges: Edges = {};
  for (const [edgeId, edge] of Object.entries(structure.edges)) {
    edges[toId(edgeId)] = {
      ...edge,
      source: typeof edge.source === 'string' ? toId(edge.source) : edge.source,
      target: typeof edge.target === 'string' ? toId(edge.target) : edge.target,
    };
  }

  return { nodes, edges, entryPoint: toId(entryPoint) };
};

/**
 * Merges independently-built region structures (chart content, axes, legend) into one composite
 * structure: each region keeps its own internal navigation untouched, and new sibling edges wire
 * the regions' entry/root nodes together (circularly) so Left/Right also move between regions —
 * the same navIds used for sibling navigation inside a region, since data-navigator resolves valid
 * moves per-node from that node's own edges, not from a global mode.
 */
export const composeRegions = (regions: NamedRegion[]): ComposedStructure => {
  if (regions.length === 0) {
    return { structure: { nodes: {}, edges: {}, navigationRules: baseNavigationRules }, entryPoint: undefined };
  }

  const nodes: Nodes = {};
  const edges: Edges = {};
  const rootIds: string[] = [];

  regions.forEach((region) => {
    const namespaced = namespaceRegion(region);
    Object.assign(nodes, namespaced.nodes);
    Object.assign(edges, namespaced.edges);
    rootIds.push(namespaced.entryPoint);
  });

  rootIds.forEach((rootId, index) => {
    const nextId = rootIds[(index + 1) % rootIds.length];
    if (rootId === nextId) return;
    const edgeId = `region${REGION_SEPARATOR}${rootId}->${nextId}`;
    if (edges[edgeId]) return;
    edges[edgeId] = { source: rootId, target: nextId, navigationRules: ['left', 'right'] };
    nodes[rootId].edges.push(edgeId);
    nodes[nextId].edges.push(edgeId);
  });

  return { structure: { nodes, edges, navigationRules: baseNavigationRules }, entryPoint: rootIds[0] };
};

export const getNodeRegion = (node: NodeObject): string | undefined => node.region as string | undefined;

/**
 * Strips the region namespace prefix that `namespaceRegion` prepended, recovering the node's
 * original (pre-composition) id — e.g. a legend entry's raw series value. Content nodes are never
 * namespaced, so their ids pass through unchanged.
 */
export const stripRegionPrefix = (node: NodeObject): string => {
  const region = getNodeRegion(node);
  if (!region) return node.id;
  const prefix = `${region}${REGION_SEPARATOR}`;
  return node.id.startsWith(prefix) ? node.id.slice(prefix.length) : node.id;
};
