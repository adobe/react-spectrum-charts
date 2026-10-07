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
import { coloredThresholdsData, quarterlyKpiThresholdsData } from '../../../storyShared/data/bulletData';
import { findChart, render } from '../../../test-utils';
import {
  ChartInspect,
  MetricLabel,
  NumberFormat,
  TargetLabel,
  ThresholdBarColor,
  Thresholds,
  Track,
} from './BulletFeatures.story';

const expectChart = async () => {
  const chart = await findChart();
  expect(chart).toBeInTheDocument();
};

describe('Bullet background', () => {
  test('Thresholds renders properly', async () => {
    render(<Thresholds {...Thresholds.args} />);
    await expectChart();
  });

  test('ThresholdBarColor renders properly', async () => {
    render(<ThresholdBarColor {...ThresholdBarColor.args} thresholds={coloredThresholdsData} />);
    await expectChart();
  });

  test('Track renders properly', async () => {
    render(<Track {...Track.args} />);
    await expectChart();
  });
});

describe('Bullet custom labels', () => {
  test('MetricLabel renders properly', async () => {
    render(<MetricLabel {...MetricLabel.args} />);
    await expectChart();
  });

  test('MetricLabel side position renders properly', async () => {
    render(<MetricLabel {...MetricLabel.args} labelPosition="side" />);
    await expectChart();
  });

  test('TargetLabel renders properly', async () => {
    render(<TargetLabel {...TargetLabel.args} />);
    await expectChart();
  });

  test('TargetLabel row direction renders properly', async () => {
    render(<TargetLabel {...TargetLabel.args} metricLabel="currentAmountLabel" direction="row" />);
    await expectChart();
  });
});

describe('Bullet ChartInspect', () => {
  test('ChartInspect renders properly', async () => {
    render(<ChartInspect {...ChartInspect.args} />);
    await expectChart();
  });

  test('ChartInspect with thresholds renders properly', async () => {
    render(<ChartInspect {...ChartInspect.args} thresholds={quarterlyKpiThresholdsData} />);
    await expectChart();
  });

  test('ChartInspect with track renders properly', async () => {
    render(<ChartInspect {...ChartInspect.args} track />);
    await expectChart();
  });
});

describe('Bullet NumberFormat', () => {
  test.each([undefined, 'shortNumber', 'shortCurrency', 'currency', ',.1f', '.0%'])(
    '%s renders properly',
    async (format) => {
      render(<NumberFormat {...NumberFormat.args} numberFormat={format} showTargetValue />);
      await expectChart();
    }
  );
});
