/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Bullet } from '../../../alpha';
import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { Basic } from './Bullet.story';
import {
  ShortNumberWithTarget,
  ShortNumberWithAxis,
  CurrencyWithTarget,
  StandardNumberWithAxis,
} from './BulletNumberFormat.story';
import { CustomLabels, CustomLabelsSidePosition, CustomTargetLabel } from './BulletCustomLabels.story';

describe('Bullet', () => {
  // Bullet is not a real React component. This is test just provides test coverage for sonarqube
  test('Bullet pseudo element', () => {
    render(<Bullet />);
  });

  test('Basic bullet renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const rects = await findAllMarksByGroupName(chart, 'bullet0Rect');
    expect(rects.length).toEqual(2);

    rects.forEach((rect) => {
      // Expect blue-900 color
      expect(rect).toHaveAttribute('fill', 'rgb(2, 101, 220)');
    });

    const barLabels = await findAllMarksByGroupName(chart, 'bullet0Label', 'text');
    expect(barLabels.length).toEqual(2);

    const amountLabels = await findAllMarksByGroupName(chart, 'bullet0ValueLabel', 'text');
    expect(amountLabels.length).toEqual(2);

    const rules = await findAllMarksByGroupName(chart, 'bullet0Target', 'line');
    expect(rules.length).toEqual(2);
  });

  describe('Number formatting', () => {
    test('shortNumber format renders K/M/B/T suffixes on target labels', async () => {
      render(<ShortNumberWithTarget {...ShortNumberWithTarget.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const targetLabels = await findAllMarksByGroupName(chart, 'bullet0TargetValueLabel', 'text');
      expect(targetLabels.length).toEqual(4); // K, M, B, T examples
      
      // Check for K, M, B, T suffixes in target labels
      const targetText = targetLabels.map(label => label.textContent).join(' ');
      expect(targetText).toMatch(/K/);
      expect(targetText).toMatch(/M/);
      expect(targetText).toMatch(/B/);
      expect(targetText).toMatch(/T/);
    });

    test('shortNumber format renders on metric axis', async () => {
      render(<ShortNumberWithAxis {...ShortNumberWithAxis.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Bullet metric axis renders at the bottom - look for all text elements
      const allText = chart.querySelectorAll('text');
      const textContents = Array.from(allText).map(el => el.textContent);
      
      // At least one text element should have K/M/B/T suffix (axis labels)
      expect(textContents.some(text => text && /[KMBT]$/.test(text))).toBe(true);
    });

    test('currency format renders with $ symbol and decimal places', async () => {
      render(<CurrencyWithTarget {...CurrencyWithTarget.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const targetLabels = await findAllMarksByGroupName(chart, 'bullet0TargetValueLabel', 'text');
      expect(targetLabels.length).toEqual(2);
      
      const targetText = targetLabels.map(label => label.textContent).join(' ');
      // Check for $ symbol
      expect(targetText).toMatch(/\$/);
      // Check for decimal places (e.g., .00)
      expect(targetText).toMatch(/\.\d{2}/);
    });

    test('standardNumber format renders with thousands separators', async () => {
      render(<StandardNumberWithAxis {...StandardNumberWithAxis.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Bullet metric axis renders at the bottom - look for all text elements
      const allText = chart.querySelectorAll('text');
      const textContents = Array.from(allText).map(el => el.textContent);
      
      // At least one text element should have commas (axis labels for numbers >= 1000)
      expect(textContents.some(text => text && text.includes(','))).toBe(true);
    });

    test('Value labels render with K/M/B/T formatting', async () => {
      render(<ShortNumberWithTarget {...ShortNumberWithTarget.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const valueLabels = await findAllMarksByGroupName(chart, 'bullet0ValueLabel', 'text');
      expect(valueLabels.length).toEqual(4); // K, M, B, T examples
      
      // Check for K, M, B, T suffixes in value labels
      const valueText = valueLabels.map(label => label.textContent).join(' ');
      expect(valueText).toMatch(/K/);
      expect(valueText).toMatch(/M/);
      expect(valueText).toMatch(/B/);
      expect(valueText).toMatch(/T/);
    });
  });

  describe('Custom labels', () => {
    test('custom metricLabel renders pre-formatted strings', async () => {
      render(<CustomLabels {...CustomLabels.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const valueLabels = await findAllMarksByGroupName(chart, 'bullet0ValueLabel', 'text');
      expect(valueLabels.length).toEqual(3); // 3 rows in customLabelBulletData
      
      // Check for custom formatted values with units (GB, req/sec, ms)
      const valueText = valueLabels.map(label => label.textContent).join(' ');
      expect(valueText).toContain('750 GB');
      expect(valueText).toContain('85K req/sec');
      expect(valueText).toContain('245ms');
    });

    test('custom labels work with side label position', async () => {
      render(<CustomLabelsSidePosition {...CustomLabelsSidePosition.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      // Side labels render on right axis
      const allText = chart.querySelectorAll('text');
      const textContents = Array.from(allText).map(el => el.textContent).join(' ');
      
      // Check for custom formatted values with units in axis labels
      expect(textContents).toContain('750 GB');
      expect(textContents).toContain('85K req/sec');
      expect(textContents).toContain('245ms');
    });

    test('custom targetLabel renders pre-formatted strings', async () => {
      render(<CustomTargetLabel {...CustomTargetLabel.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const targetLabels = await findAllMarksByGroupName(chart, 'bullet0TargetValueLabel', 'text');
      expect(targetLabels.length).toEqual(3); // 3 rows in customLabelBulletData
      
      // Check for custom formatted target values with units
      const targetText = targetLabels.map(label => label.textContent).join(' ');
      expect(targetText).toContain('1 TB');
      expect(targetText).toContain('100K req/sec');
      expect(targetText).toContain('200ms (goal)');
    });
  });
});
