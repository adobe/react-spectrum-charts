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
import { DONUT_SUMMARY_MIN_RADIUS } from '@spectrum-charts/core-s2/constants';

import { DonutSummary } from '../../../components/index.js';
import { render, screen } from '../../../test-utils/index.js';
import { Basic, NoLabel, NumberFormat } from './DonutSummaryVariants.story.js';

describe('DonutSummary renders properly', () => {
  // Donut is not a real React component. This is test just provides test coverage for sonarqube
  test('Donut pseudo element', () => {
    render(<DonutSummary />);
  });

  test('metric value should be centered if there is not a label', async () => {
    // The default 350px chart has a 330px outer diameter, which stays in the L tier.
    render(<NoLabel {...NoLabel.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('transform', 'translate(175,186)');
  });

  test('metric value should be above center if there is a label', async () => {
    render(<Basic {...Basic.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('transform', 'translate(175,171.5)');
    expect(screen.getByText('Visitors')).toHaveAttribute('transform', 'translate(175,203.5)');
  });

  test('metric value and label sizes should follow their own independent per-tier font sizes', async () => {
    render(<Basic {...Basic.args} width={220} height={220} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('font-size', '22px');
    const metricLabel = await screen.findByText('Visitors');
    expect(metricLabel).toHaveAttribute('font-size', '16px');
  });
});

describe('NumberFormat ', () => {
  test('shortCurrency', async () => {
    render(<NumberFormat {...NumberFormat.args} numberFormat="shortCurrency" />);
    expect(await screen.findByText('$40.4K')).toBeInTheDocument();
  });
  test('standardNumber', async () => {
    render(<NumberFormat {...NumberFormat.args} numberFormat="standardNumber" />);
    expect(await screen.findByText('40,365')).toBeInTheDocument();
  });
});

describe("Font sizes stay at a named size tier (XS/S/M/L/XL) from its own minimum diameter until the next tier's minimum", () => {
  // Chart sizes include the 10px base inset on each side of the tier's minimum diameter.
  test('S tier (120px diameter): value 20px, label 14px', async () => {
    render(<Basic {...Basic.args} width={140} height={140} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '20px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '14px');
  });

  test('M tier (200px diameter): value 22px, label 16px', async () => {
    render(<Basic {...Basic.args} width={220} height={220} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '22px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '16px');
  });

  test('L tier (280px diameter): value 36px, label 20px', async () => {
    render(<Basic {...Basic.args} width={300} height={300} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '36px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '20px');
  });

  test('XL tier (400px+ diameter): value 50px, label 24px', async () => {
    render(<Basic {...Basic.args} width={420} height={420} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '50px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '24px');
  });

  test("a diameter numerically closer to M than to S stays S, since it has not reached M's own minimum yet", async () => {
    render(<Basic {...Basic.args} width={200} height={200} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '20px');
  });

  test("a diameter just below the next tier's minimum stays at the current tier, not the next one", async () => {
    render(<Basic {...Basic.args} width={299} height={299} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '22px');
  });
});

describe('Small radius', () => {
  test('should hide the summary if the donut inner radius is < DONUT_SUMMARY_MIN_RADIUS', async () => {
    render(<Basic {...Basic.args} width={DONUT_SUMMARY_MIN_RADIUS * 2} height={DONUT_SUMMARY_MIN_RADIUS * 2} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '0px');
  });
});
