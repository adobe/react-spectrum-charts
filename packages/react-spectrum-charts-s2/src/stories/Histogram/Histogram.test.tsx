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
import { ComponentType } from 'react';

import userEvent from '@testing-library/user-event';

import { Histogram } from '../../lab/index.js';
import {
  customerAgeData,
  deliveryData,
  examScoreData,
  homeSaleData,
  orderData,
  residentAgeData,
  responseTimeData,
  salaryData,
  sessionData,
} from '../../storyShared/Histogram/data.js';
import { findChart, render, screen } from '../../test-utils/index.js';
import * as features from './Features/HistogramFeatures.story.js';
import * as examples from './HistogramExamples.story.js';

type Story = ComponentType<object> & { args?: object };

// Animations renders one chart per draw-in effect, so it has its own test
const getStories = (module: Record<string, unknown>): [string, Story][] =>
  Object.entries(module).filter(([name]) => name !== 'default' && name !== 'Animations') as [string, Story][];

describe('Histogram stories', () => {
  // Histogram is not a real React component. This test just provides test coverage for sonarqube
  test('Histogram pseudo element', () => {
    render(<Histogram />);
  });

  test.each([...getStories(features), ...getStories(examples)])('%s renders', async (_, Story) => {
    render(<Story {...Story.args} />);
    expect(await findChart()).toBeInTheDocument();
  });

  test('Animations renders a chart per draw-in effect and replays them', async () => {
    const { Animations } = features;
    render(<Animations {...Animations.args} />);
    expect(await screen.findAllByRole('graphics-document')).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }));
    expect(await screen.findAllByRole('graphics-document')).toHaveLength(4);
  });
});

describe('Histogram story data', () => {
  test('has a few hundred right-skewed response times', () => {
    expect(responseTimeData.length).toBeGreaterThanOrEqual(300);
    const times = responseTimeData.map(({ responseTime }) => responseTime).sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    expect(mean).toBeGreaterThan(median);
  });

  test('keeps customer ages inside the age bands', () => {
    expect(customerAgeData.every(({ age }) => age >= 18 && age < 85)).toBe(true);
  });

  test('keeps example values in realistic ranges', () => {
    expect(salaryData.every(({ salary }) => salary >= 38000 && salary <= 195000)).toBe(true);
    expect(orderData.every(({ quantity }) => Number.isInteger(quantity) && quantity >= 1)).toBe(true);
    expect(deliveryData.every(({ deliveryDays }) => deliveryDays > 0 && deliveryDays < 14)).toBe(true);
    expect(examScoreData.every(({ score }) => score >= 0 && score < 100)).toBe(true);
    expect(residentAgeData.every(({ age }) => Number.isInteger(age) && age >= 0 && age < 100)).toBe(true);
    expect(sessionData.every(({ pagesViewed }) => Number.isInteger(pagesViewed) && pagesViewed >= 1)).toBe(true);
    expect(homeSaleData.every(({ price }) => price >= 120000 && price <= 1190000)).toBe(true);
  });

  test('gives every example dataset unique row ids', () => {
    [salaryData, orderData, deliveryData, examScoreData, residentAgeData, sessionData, homeSaleData].forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
    });
  });
});
