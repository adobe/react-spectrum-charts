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

// A branching pathing-style flow with multiple nodes per column (2 entry points, 2 columns that
// narrow through a single hub, then re-branch), so the story actually shows the classic Sankey
// look of parallel bands rather than a single dominant node per column.
export const basicSankeyData = [
  { source: 'Home', target: 'Search', value: 8 },
  { source: 'Home', target: 'Product', value: 12 },
  { source: 'Ad Campaign', target: 'Search', value: 5 },
  { source: 'Ad Campaign', target: 'Product', value: 3 },
  { source: 'Search', target: 'Product', value: 6 },
  { source: 'Search', target: 'Cart', value: 2 },
  { source: 'Product', target: 'Cart', value: 10 },
  { source: 'Product', target: 'Wishlist', value: 4 },
  { source: 'Cart', target: 'Checkout', value: 9 },
  { source: 'Cart', target: 'Abandoned', value: 3 },
  { source: 'Wishlist', target: 'Checkout', value: 2 },
];

// The classic two-column ("two stack") flow, closest to the canonical Kibana/Elastic Sankey example
// (https://www.elastic.co/blog/sankey-visualization-with-vega-in-kibana): a single source column
// flowing into a single destination column, no re-branching in between. Good first example to look
// at since there's only one thing happening -- browsers fanning out into operating systems.
export const twoColumnSankeyData = [
  { source: 'Chrome', target: 'Windows', value: 40 },
  { source: 'Chrome', target: 'macOS', value: 25 },
  { source: 'Chrome', target: 'Linux', value: 5 },
  { source: 'Safari', target: 'macOS', value: 30 },
  { source: 'Safari', target: 'iOS', value: 20 },
  { source: 'Firefox', target: 'Windows', value: 15 },
  { source: 'Firefox', target: 'Linux', value: 10 },
];

// The simplest possible Sankey: a single, unbranched path. One node per column by construction, so
// (as expected -- see the note in sankeyUtils.ts on the global value-to-pixel scale) each node fills
// its entire column since there's nothing else in that column competing for space.
export const singleChainSankeyData = [
  { source: 'Step 1: Visit', target: 'Step 2: Add to cart', value: 100 },
  { source: 'Step 2: Add to cart', target: 'Step 3: Checkout', value: 80 },
  { source: 'Step 3: Checkout', target: 'Step 4: Purchase', value: 60 },
];

// Approximates a real Analysis Workspace Flow visualization: a single "*"-prefixed focus/root node
// (Workspace's own convention for a pinned entry point), large comma-formatted path-view counts, and
// a "+N more" aggregate node per column standing in for the long tail beyond Workspace's configured
// "items expanded per column" -- see FlowConfigAdvancedSettings.js in aaui-web-spa, and the research
// doc at planning/research/sankey-workspace-flow-feasibility/sankey-workspace-flow-feasibility.md.
// Node/edge values aren't meant to reconcile exactly column to column, just to be Workspace-scale.
export const workspaceFlowSankeyData = [
  { source: '* Project Load', target: 'Project Loaded without Anomaly Detection', value: 524000 },
  { source: '* Project Load', target: 'Project Fully Loaded', value: 200000 },
  { source: '* Project Load', target: 'Frames Per Second', value: 167000 },
  { source: '* Project Load', target: 'Table of Contents opened', value: 79000 },
  { source: '* Project Load', target: 'Open component rail', value: 78000 },
  { source: '* Project Load', target: '+466 more', value: 341000 },

  { source: 'Project Loaded without Anomaly Detection', target: 'Project Fully Loaded (2)', value: 262000 },
  { source: 'Project Loaded without Anomaly Detection', target: 'Frames Per Second (2)', value: 157000 },
  { source: 'Project Loaded without Anomaly Detection', target: '+430 more', value: 105000 },

  { source: 'Project Fully Loaded', target: 'Project Fully Loaded (2)', value: 100000 },
  { source: 'Project Fully Loaded', target: 'Frames Per Second (2)', value: 60000 },
  { source: 'Project Fully Loaded', target: '+430 more', value: 40000 },

  { source: 'Frames Per Second', target: 'Project Fully Loaded (2)', value: 83000 },
  { source: 'Frames Per Second', target: 'Frames Per Second (2)', value: 50000 },
  { source: 'Frames Per Second', target: '+430 more', value: 34000 },

  { source: 'Table of Contents opened', target: 'Project Fully Loaded (2)', value: 39000 },
  { source: 'Table of Contents opened', target: 'Frames Per Second (2)', value: 24000 },
  { source: 'Table of Contents opened', target: '+430 more', value: 16000 },

  { source: 'Open component rail', target: 'Project Fully Loaded (2)', value: 39000 },
  { source: 'Open component rail', target: 'Frames Per Second (2)', value: 23000 },
  { source: 'Open component rail', target: '+430 more', value: 16000 },

  { source: '+466 more', target: 'Project Fully Loaded (2)', value: 170000 },
  { source: '+466 more', target: 'Frames Per Second (2)', value: 102000 },
  { source: '+466 more', target: '+430 more', value: 69000 },
];

// A clean 3-column flow with multiple nodes per column throughout (3 -> 2 -> 2), so every column
// actually branches/merges rather than narrowing to a single node: traffic source -> device -> outcome.
export const threeColumnSankeyData = [
  { source: 'Organic Search', target: 'Desktop', value: 30 },
  { source: 'Organic Search', target: 'Mobile', value: 20 },
  { source: 'Paid Search', target: 'Desktop', value: 15 },
  { source: 'Paid Search', target: 'Mobile', value: 25 },
  { source: 'Social', target: 'Mobile', value: 10 },
  { source: 'Desktop', target: 'Purchase', value: 25 },
  { source: 'Desktop', target: 'Bounce', value: 20 },
  { source: 'Mobile', target: 'Purchase', value: 20 },
  { source: 'Mobile', target: 'Bounce', value: 35 },
];
