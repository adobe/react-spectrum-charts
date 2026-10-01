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
import { FADE_FACTOR } from '@spectrum-charts/constants';

import {
  allElementsHaveAttributeValue,
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  getAllLegendEntries,
  hoverNthElement,
  render,
  waitForMarksByGroupName,
} from '../../../../test-utils';
import '../../../../test-utils/__mocks__/matchMedia.mock';
import {
  ControlledHighlight as HoverAnimationControlledHighlight,
  GroupedLegendHover as HoverAnimationGroupedLegendHover,
  LegendHover as HoverAnimationLegendHover,
  OnClick as HoverAnimationOnClick,
  PointHover as HoverAnimationPointHover,
  PopoverSelection as HoverAnimationPopoverSelection,
} from './LineHoverAnimation.story';

describe('Line', () => {
  describe('HoverAnimation', () => {
    test('hovering a data point emphasizes its series and animates the others down to the faded opacity', async () => {
      render(<HoverAnimationPointHover {...HoverAnimationPointHover.args} />);
      const chart = await findChart();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await hoverNthElement(paths, 0);

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        expect(lines[0]).toHaveAttribute('opacity', '1');
        expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
      });
    });

    test('with animations disabled, the fade is applied via the original instant rules instead of the animated signal', async () => {
      render(<HoverAnimationPointHover {...HoverAnimationPointHover.args} animations={false} />);
      const chart = await findChart();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await hoverNthElement(paths, 0);

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines[0]).toHaveAttribute('opacity', '1');
      expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
    });

    test('hovering a legend entry emphasizes the matching series', async () => {
      render(<HoverAnimationLegendHover {...HoverAnimationLegendHover.args} />);
      const chart = await findChart();

      const entries = getAllLegendEntries(chart);
      await hoverNthElement(entries, 0);

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        expect(lines[0]).toHaveAttribute('opacity', '1');
        expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
      });
    });

    test('hovering a grouped legend entry emphasizes every series in that group', async () => {
      render(<HoverAnimationGroupedLegendHover {...HoverAnimationGroupedLegendHover.args} />);
      const chart = await findChart();

      const entries = getAllLegendEntries(chart);
      await hoverNthElement(entries, 0);

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        // the two series in the hovered group stay fully opaque; the other group's two series fade
        const opacities = lines.map((line) => line.getAttribute('opacity'));
        expect(opacities.filter((o) => o === '1')).toHaveLength(2);
        expect(opacities.filter((o) => o === `${FADE_FACTOR}`)).toHaveLength(2);
      });
    });

    test('selecting a point via popover keeps its series emphasized', async () => {
      render(<HoverAnimationPopoverSelection {...HoverAnimationPopoverSelection.args} />);
      const chart = await findChart();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await clickNthElement(paths, 0);

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        expect(lines[0]).toHaveAttribute('opacity', '1');
        expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
      });
    });

    test('the controlled highlightedSeries prop emphasizes that series without any hover', async () => {
      render(<HoverAnimationControlledHighlight {...HoverAnimationControlledHighlight.args} />);
      const chart = await findChart();

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        const opacities = lines.map((line) => line.getAttribute('opacity'));
        expect(opacities.filter((o) => o === '1')).toHaveLength(1);
        expect(opacities.filter((o) => o === `${FADE_FACTOR}`)).toHaveLength(3);
      });
    });

    test('an onClick handler alone makes the line interactive, so hovering still animates the emphasis', async () => {
      render(<HoverAnimationOnClick {...HoverAnimationOnClick.args} />);
      const chart = await findChart();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await hoverNthElement(paths, 0);

      await waitForMarksByGroupName(chart, 'line0', (lines) => {
        expect(lines[0]).toHaveAttribute('opacity', '1');
        expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
      });
    });
  });
});
