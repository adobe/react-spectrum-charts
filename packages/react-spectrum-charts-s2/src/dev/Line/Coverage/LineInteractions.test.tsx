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
import { workspaceTrendsData } from '../../../storyShared/data/data';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  findMarksByGroupName,
  hoverNthElement,
  render,
  rightClickNthElement,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock';
import { OnClick as OnClickStory, WithStaticPoints, WithStaticPointsAndDialogs } from './LineInteractions.story';

describe('Line', () => {
  test('Static points render', async () => {
    render(<WithStaticPoints {...WithStaticPoints.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const points = await findAllMarksByGroupName(chart, 'line0_staticPoints');
    expect(points.length).toEqual(6);

    expect(points[0].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
    expect(points[1].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
    expect(points[2].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
    expect(points[3].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200
    expect(points[4].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200
    expect(points[5].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200

    expect(points[0].getAttribute('stroke-opacity')).toBeNull();
    expect(points[1].getAttribute('stroke-opacity')).toBeNull();
    expect(points[2].getAttribute('stroke-opacity')).toBeNull();
    expect(points[3].getAttribute('stroke-opacity')).toBeNull();
    expect(points[4].getAttribute('stroke-opacity')).toBeNull();
    expect(points[5].getAttribute('stroke-opacity')).toBeNull();
  });

  describe('Static point highlighting when there are interactive children', () => {
    test('Points show on hover', async () => {
      render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      // hover a place on the line without a static point
      await hoverNthElement(paths, 0);

      const hoverPoints = await findAllMarksByGroupName(chart, 'line0_point_highlight');
      expect(hoverPoints.length).toBe(1);
      expect(hoverPoints[0].getAttribute('fill')).toEqual('white');
      expect(hoverPoints[0].getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
      expect(hoverPoints[0]).toHaveAttribute('stroke-width', '2.5');
      expect(hoverPoints[0].getAttribute('stroke-opacity')).toBeNull();
      expect(hoverPoints[0]).not.toHaveAttribute('fill-opacity');
    });

    test('Static point hovering (currently there is no visible change on hover)', async () => {
      render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const points = await findAllMarksByGroupName(chart, 'line0_staticPoints');
      expect(points.length).toEqual(6);

      expect(points[0].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
      expect(points[1].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
      expect(points[2].getAttribute('fill')).toEqual('#5424DB'); // S2 categorical-100
      expect(points[3].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200
      expect(points[4].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200
      expect(points[5].getAttribute('fill')).toEqual('#D92361'); // S2 categorical-200

      expect(points[0].getAttribute('stroke-opacity')).toBeNull();
      expect(points[1].getAttribute('stroke-opacity')).toBeNull();
      expect(points[2].getAttribute('stroke-opacity')).toBeNull();
      expect(points[3].getAttribute('stroke-opacity')).toBeNull();
      expect(points[4].getAttribute('stroke-opacity')).toBeNull();
      expect(points[5].getAttribute('stroke-opacity')).toBeNull();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      // hover a static point
      await hoverNthElement(paths, 1);

      const hoverPoints = await findAllMarksByGroupName(chart, 'line0_point_highlight');
      expect(hoverPoints.length).toBe(1);
      expect(hoverPoints[0].getAttribute('fill')).toEqual('white');
      expect(hoverPoints[0].getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
      expect(hoverPoints[0]).toHaveAttribute('stroke-width', '2.5');
      expect(hoverPoints[0].getAttribute('stroke-opacity')).toBeNull();
      expect(hoverPoints[0]).not.toHaveAttribute('fill-opacity');
    });
  });

  describe('selected point styling', () => {
    test('points on a line should have no visible change when selected', async () => {
      render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      // hover a static point
      await clickNthElement(paths, 1);

      const point = await findMarksByGroupName(chart, 'line0_point_select');
      expect(point).toBeInTheDocument();

      expect(point.getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
      expect(point.getAttribute('stroke-width')).toEqual('2.5');
    });

    test('standard points should have series color border and background color fill when selected', async () => {
      render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await clickNthElement(paths, 2);

      const point = await findMarksByGroupName(chart, 'line0_point_select');
      expect(point).toBeInTheDocument();

      expect(point.getAttribute('fill')).toEqual('white');
      expect(point.getAttribute('stroke')).toEqual('#5424DB'); // S2 categorical-100
      expect(point.getAttribute('stroke-opacity')).toBeNull();
      expect(point.getAttribute('stroke-width')).toEqual('2.5');
    });
  });

  describe('onClick callback', () => {
    test('should call the onClick function with the expected data', async () => {
      const onClick = jest.fn();
      render(<OnClickStory {...OnClickStory.args} onClick={onClick} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await clickNthElement(paths, 4);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining(workspaceTrendsData[4]));
    });
  });

  describe('onContextMenu callback', () => {
    test('should call the onContextMenu function with event and expected data when right-clicking a point', async () => {
      const onContextMenu = jest.fn();
      render(<OnClickStory {...OnClickStory.args} onContextMenu={onContextMenu} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
      await rightClickNthElement(paths, 4);

      expect(onContextMenu).toHaveBeenCalledTimes(1);
      expect(onContextMenu).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining(workspaceTrendsData[4]));
      expect(onContextMenu.mock.calls[0][0]).toMatchObject(
        expect.objectContaining({ clientX: expect.any(Number), clientY: expect.any(Number) })
      );
    });
  });
});
