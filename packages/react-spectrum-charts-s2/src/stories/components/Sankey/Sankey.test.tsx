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
import userEvent from '@testing-library/user-event';

import { Sankey } from '../../../pre-alpha/components/Sankey';
import { findAllMarksByGroupName, findChart, render, rightClickNthElement, screen, waitFor } from '../../../test-utils';
import {
  basicSankeyData,
  singleChainSankeyData,
  threeColumnSankeyData,
  twoColumnSankeyData,
  workspaceFlowSankeyData,
} from './data';
import {
  Basic,
  RightClickInspect,
  SingleChain,
  ThreeColumnFlow,
  TwoColumnFlow,
  WorkspaceFlowExample,
} from './Sankey.story';

describe('Sankey', () => {
  // Sankey is not a real React component. This test just provides test coverage for sonarqube
  test('Sankey pseudo element', () => {
    render(<Sankey />);
  });

  test('Basic renders one rect per unique node and one ribbon per edge', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Home, Ad Campaign, Search, Product, Cart, Wishlist, Checkout, Abandoned -- rects render as <path> in Vega's SVG output.
    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    expect(nodes.length).toEqual(8);

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    expect(links.length).toEqual(basicSankeyData.length);
  });

  // Regression: chartWidth/chartHeight must reach the spec builder as the chart's real size (500x350),
  // not addSankey's 100x100 fallback -- useSpec.tsx used to drop them before forwarding to buildSpec().
  test('Basic lays nodes out across the full chart width, not a 100px fallback', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();

    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    const xPositions = nodes.map((node) => {
      const match = node.getAttribute('d')?.match(/^M(-?\d+(?:\.\d+)?),/);
      return match ? parseFloat(match[1]) : NaN;
    });

    // 5 columns across a 500px chart should reach well past the 100px fallback box.
    expect(Math.max(...xPositions)).toBeGreaterThan(300);
  });

  test('TwoColumnFlow renders one rect per browser/OS and one ribbon per edge', async () => {
    render(<TwoColumnFlow {...TwoColumnFlow.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Chrome, Safari, Firefox, Windows, macOS, Linux, iOS
    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    expect(nodes.length).toEqual(7);

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    expect(links.length).toEqual(twoColumnSankeyData.length);
  });

  test('SingleChain renders one rect per step and one ribbon per edge', async () => {
    render(<SingleChain {...SingleChain.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    expect(nodes.length).toEqual(4);

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    expect(links.length).toEqual(singleChainSankeyData.length);
  });

  test('ThreeColumnFlow renders one rect per source/device/outcome and one ribbon per edge, across exactly 3 columns', async () => {
    render(<ThreeColumnFlow {...ThreeColumnFlow.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Organic Search, Paid Search, Social, Desktop, Mobile, Purchase, Bounce
    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    expect(nodes.length).toEqual(7);

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    expect(links.length).toEqual(threeColumnSankeyData.length);

    const xPositions = nodes.map((node) => {
      const match = node.getAttribute('d')?.match(/^M(-?\d+(?:\.\d+)?),/);
      return match ? parseFloat(match[1]) : NaN;
    });
    expect(new Set(xPositions).size).toEqual(3);
  });

  test('WorkspaceFlowExample renders the root node, a comma-formatted value under it, and the long-tail nodes', async () => {
    render(<WorkspaceFlowExample {...WorkspaceFlowExample.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // "* Project Load", 6 col1 nodes, 3 col2 nodes
    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    expect(nodes.length).toEqual(10);

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    expect(links.length).toEqual(workspaceFlowSankeyData.length);

    // Each label renders as a halo + foreground pair, so its text is duplicated in the DOM --
    // use findAllByText, not findByText (which throws on more than one match).
    expect(await screen.findAllByText('* Project Load')).toHaveLength(2);
    expect(await screen.findAllByText('+466 more')).toHaveLength(2);
    expect(await screen.findAllByText('+430 more')).toHaveLength(2);
    // the root node's value label, comma-formatted (sum of its outgoing edges)
    expect(await screen.findAllByText('1,389,000')).toHaveLength(2);
  });

  // Right-click support is generic RSC plumbing, not sankey-specific -- confirms it holds for both layers.
  test('RightClickInspect opens the popover on right click (not left click) for both nodes and links', async () => {
    render(<RightClickInspect {...RightClickInspect.args} />);
    const chart = await findChart();

    const nodes = await findAllMarksByGroupName(chart, 'sankey0');
    await rightClickNthElement(nodes, 0);
    let popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    await userEvent.click(chart);
    await waitFor(() => expect(popover).not.toBeInTheDocument());

    const links = await findAllMarksByGroupName(chart, 'sankey0_links');
    await rightClickNthElement(links, 0);
    popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
  });
});
