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
import { Line, LinePointAnnotation } from '../../components';
import { findAllMarksByGroupName, findChart, render } from '../../test-utils';
import '../../test-utils/__mocks__/matchMedia.mock';
import { Basic } from './Features/Line.story';
import { LineType, Opacity } from './Features/Styling/LineStyling.story';

describe('LinePointAnnotation', () => {
  // LinePointAnnotation is not a real React component. This test provides coverage for sonarqube
  test('LinePointAnnotation pseudo element', () => {
    render(<LinePointAnnotation />);
  });
});

describe('Line', () => {
  // Line is not a real React component. This is test just provides test coverage for sonarqube
  test('Line pseudo element', () => {
    render(<Line />);
  });

  test('Basic renders', async () => {
    render(<Basic {...Basic.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
  });

  test('LineType renders', async () => {
    render(<LineType {...LineType.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    expect(lines[0].getAttribute('stroke-dasharray')).toEqual('');
    expect(lines[1].getAttribute('stroke-dasharray')).toEqual('7,4');
    expect(lines[2].getAttribute('stroke-dasharray')).toEqual('0,4');
    expect(lines[3].getAttribute('stroke-dasharray')).toEqual('2,3,7,4');
  });

  test('Opacity renders', async () => {
    render(<Opacity {...Opacity.args} name="line0" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    expect(lines[0].getAttribute('stroke-opacity')).toEqual('0.6');
  });
});
