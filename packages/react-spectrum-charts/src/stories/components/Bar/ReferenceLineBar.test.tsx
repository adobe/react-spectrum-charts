/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React from 'react';

import { findAllMarksByGroupName, findChart, findMarksByGroupName, render } from '../../../test-utils';
import {
  Basic,
  HorizontalIcon,
  HorizontalLabel,
  HorizontalSupreme,
  Icon,
  Label,
  Supreme,
} from './ReferenceLineBar.story';

describe('AxisReferenceLine', () => {
  describe('Centered', () => {
    test('Reference line renders', async () => {
      render(<Basic {...Basic.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
      expect(axisReferenceLine).toBeInTheDocument();
      expect(axisReferenceLine).toHaveAttribute('transform', 'translate(298,0)');
    });

    test('Icon renders', async () => {
      render(<Icon {...Icon.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(298,290)');
    });

    test('Label renders', async () => {
      render(<Label {...Label.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(298,295)');
    });

    test('Supreme renders bars', async () => {
      render(<Supreme {...Supreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);
    });

    test('Supreme renders icon', async () => {
      render(<Supreme {...Supreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(298,269)');
    });

    test('Supreme renders label', async () => {
      render(<Supreme {...Supreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(298,295)');
    });
  });

  describe('Before', () => {
    test('Reference line renders', async () => {
      render(<Basic {...{ ...Basic.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
      expect(axisReferenceLine).toBeInTheDocument();
      expect(axisReferenceLine).toHaveAttribute('transform', 'translate(238.4,0)');
    });

    test('Icon renders', async () => {
      render(<Icon {...{ ...Icon.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(238.4,290)');
    });

    test('Label renders', async () => {
      render(<Label {...{ ...Label.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(238.4,295)');
    });

    test('Supreme renders bars', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);
    });

    test('Supreme renders icon', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(238.4,269)');
    });

    test('Supreme renders label', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'before' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(238.4,295)');
    });
  });

  describe('After', () => {
    test('Reference line renders', async () => {
      render(<Basic {...{ ...Basic.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
      expect(axisReferenceLine).toBeInTheDocument();
      expect(axisReferenceLine).toHaveAttribute('transform', 'translate(357.59999999999997,0)');
    });

    test('Icon renders', async () => {
      render(<Icon {...{ ...Icon.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(357.59999999999997,290)');
    });

    test('Label renders', async () => {
      render(<Label {...{ ...Label.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(357.59999999999997,295)');
    });

    test('Supreme renders bars', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);
    });

    test('Supreme renders icon', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(357.59999999999997,269)');
    });

    test('Supreme renders label', async () => {
      render(<Supreme {...{ ...Supreme.args, position: 'after' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(357.59999999999997,295)');
    });
  });

  describe('Horizontal', () => {
    test('Label', async () => {
      render(<HorizontalLabel {...HorizontalLabel.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(-40,111.60000000000001)');
    });

    test('Icon', async () => {
      render(<HorizontalIcon {...HorizontalIcon.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(-24,107.60000000000001)');
    });

    test('Supreme renders bars', async () => {
      render(<HorizontalSupreme {...HorizontalSupreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // get bars
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.length).toEqual(5);
    });

    test('Supreme renders icon', async () => {
      render(<HorizontalSupreme {...HorizontalSupreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
      expect(axisReferenceLineIcon).toBeInTheDocument();
      expect(axisReferenceLineIcon).toHaveAttribute('transform', 'translate(-24,107.60000000000001)');
    });

    test('Supreme renders label', async () => {
      render(<HorizontalSupreme {...HorizontalSupreme.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('transform', 'translate(-65,111.60000000000001)');
    });
  });

  describe('Label styling', () => {
    test('Default', async () => {
      render(<Label {...Label.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('font-weight', 'normal');
    });

    test('Bold', async () => {
      render(<Label {...{ ...Label.args, labelFontWeight: 'bold' }} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const axisReferenceLineLabel = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
      expect(axisReferenceLineLabel).toHaveAttribute('font-weight', 'bold');
    });
  });
});
