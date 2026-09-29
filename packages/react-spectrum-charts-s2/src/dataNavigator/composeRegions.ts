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
import { Edges, NavigationRules, NodeObject, Nodes, Structure } from 'data-navigator';

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

export type RegionArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

/** A spatial move between two regions' roots: `key` on `from` goes to `to`, and the opposite arrow comes back. */
export interface RegionLink {
  from: string;
  to: string;
  key: RegionArrowKey;
}

export interface ComposedStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/** An auxiliary region node's composed id, e.g. `legend::root`. */
export const prefixed = (name: string, id: string): string => `${name}${REGION_SEPARATOR}${id}`;

const namespaceNodes = (
  structure: Structure,
  name: string,
  namespace: boolean,
  toId: (id: string) => string
): Nodes => {
  const nodes: Nodes = {};
  for (const [id, node] of Object.entries(structure.nodes)) {
    const newId = toId(id);
    // Root/division nodes default renderId to their own (pre-namespace) id; without renewing it here it
    // would collide with another region's identically-unprefixed renderId once ids are prefixed below.
    const renderId = namespace ? newId : node.renderId;
    nodes[newId] = { ...node, id: newId, renderId, edges: node.edges.map(toId), region: name };
  }
  return nodes;
};

const namespaceEdges = (structure: Structure, toId: (id: string) => string): Edges => {
  const edges: Edges = {};
  for (const [edgeId, edge] of Object.entries(structure.edges)) {
    edges[toId(edgeId)] = {
      ...edge,
      source: typeof edge.source === 'string' ? toId(edge.source) : edge.source,
      target: typeof edge.target === 'string' ? toId(edge.target) : edge.target,
    };
  }
  return edges;
};

const namespaceRegion = (region: NamedRegion): { nodes: Nodes; edges: Edges; entryPoint: string } => {
  const { name, structure, entryPoint, namespace = true } = region;
  if (!entryPoint) {
    throw new Error(`composeRegions: region "${name}" has no entry point.`);
  }
  const toId = namespace ? (id: string) => prefixed(name, id) : (id: string) => id;

  return {
    nodes: namespaceNodes(structure, name, namespace, toId),
    edges: namespaceEdges(structure, toId),
    entryPoint: toId(entryPoint),
  };
};

/** Chains each region's entry point to the next, in order, via a new sibling edge (no wraparound). */
const chainRegionEntryPoints = (nodes: Nodes, edges: Edges, rootIds: string[]): void => {
  for (let index = 0; index < rootIds.length - 1; index++) {
    const rootId = rootIds[index];
    const nextId = rootIds[index + 1];
    const edgeId = `region${REGION_SEPARATOR}${rootId}->${nextId}`;
    if (rootId === nextId || edges[edgeId]) continue;
    edges[edgeId] = { source: rootId, target: nextId, navigationRules: ['left', 'right', 'up', 'down'] };
    nodes[rootId].edges.push(edgeId);
    nodes[nextId].edges.push(edgeId);
  }
};

const OPPOSITE_KEY: Record<RegionArrowKey, RegionArrowKey> = {
  ArrowLeft: 'ArrowRight',
  ArrowRight: 'ArrowLeft',
  ArrowUp: 'ArrowDown',
  ArrowDown: 'ArrowUp',
};

const ruleForKey = (rules: NavigationRules, key: RegionArrowKey): string | undefined =>
  Object.entries(rules).find(([, rule]) => rule.key === key)?.[0];

/** Links region roots with one edge per link, bound to the rule names `navigationRules` maps its arrow keys to. */
const linkRegionEntryPoints = (
  nodes: Nodes,
  edges: Edges,
  rootByRegion: Record<string, string>,
  links: RegionLink[],
  navigationRules: NavigationRules
): void => {
  for (const { from, to, key } of links) {
    const fromId = rootByRegion[from];
    const toId = rootByRegion[to];
    const forward = ruleForKey(navigationRules, key);
    const back = ruleForKey(navigationRules, OPPOSITE_KEY[key]);
    if (!fromId || !toId || fromId === toId || !forward || !back) continue;
    const forwardIsTarget = navigationRules[forward].direction === 'target';
    const source = forwardIsTarget ? fromId : toId;
    const target = forwardIsTarget ? toId : fromId;
    const edgeId = `region${REGION_SEPARATOR}${source}->${target}`;
    if (edges[edgeId]) continue;
    edges[edgeId] = { source, target, navigationRules: [forward, back] };
    nodes[fromId].edges.push(edgeId);
    nodes[toId].edges.push(edgeId);
  }
};

/**
 * Merges independently-built region structures (chart content, axes, legend) into one composite structure:
 * each region keeps its own internal navigation untouched, and new edges join the regions' root nodes.
 * With `links`, each link binds one arrow key (and its opposite back) between two roots; without them,
 * roots are chained in order on every arrow key (no wraparound). data-navigator resolves valid moves
 * per-node from that node's own edges, so these don't interfere with navigation inside a region.
 */
export const composeRegions = (
  regions: NamedRegion[],
  links?: RegionLink[],
  navigationRules: NavigationRules = baseNavigationRules
): ComposedStructure => {
  if (regions.length === 0) {
    return { structure: { nodes: {}, edges: {}, navigationRules }, entryPoint: undefined };
  }

  const nodes: Nodes = {};
  const edges: Edges = {};
  const rootIds: string[] = [];
  const rootByRegion: Record<string, string> = {};

  for (const region of regions) {
    const namespaced = namespaceRegion(region);
    Object.assign(nodes, namespaced.nodes);
    Object.assign(edges, namespaced.edges);
    rootIds.push(namespaced.entryPoint);
    rootByRegion[region.name] = namespaced.entryPoint;
  }
  if (links) {
    linkRegionEntryPoints(nodes, edges, rootByRegion, links, navigationRules);
  } else {
    chainRegionEntryPoints(nodes, edges, rootIds);
  }

  return { structure: { nodes, edges, navigationRules }, entryPoint: rootIds[0] };
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
