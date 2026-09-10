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
import { DONUT_SUMMARY_MIN_RADIUS } from '@spectrum-charts/constants';

import { DonutSummary } from '../../../pre-alpha';
import { render, screen } from '../../../test-utils';
import { Basic, NoLabel, NumberFormat } from './DonutSummary.story';

describe('DonutSummary renders properly', () => {
  // Donut is not a real React component. This is test just provides test coverage for sonarqube
  test('Donut pseudo element', () => {
    render(<DonutSummary />);
  });

  test('metric value should be centered if there is not a label', async () => {
    // default story size is 350x350 -> 346px outer diameter, which is now L tier (200-399), not
    // XL (400+) - DONUT_SIZE_TIER_CUTPOINTS' top cutpoint moved from 300 to 400 (XL's own minimum)
    render(<NoLabel {...NoLabel.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('transform', 'translate(175,186)');
  });

  test('metric value should be above center if there is a label', async () => {
    render(<Basic {...Basic.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('transform', 'translate(175,175)');
  });

  test('metric value and label sizes should follow their own independent per-tier font sizes', async () => {
    // 200px diameter -> 196px outer diameter -> falls in the M tier bucket (160-199), just under
    // L's own 200px minimum (value 22px, label 16px)
    render(<Basic {...Basic.args} width={200} height={200} />);
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

describe('Font sizes stay at a named size tier (XS/S/M/L/XL) from its own minimum diameter until the next tier\'s minimum', () => {
  // width/height chosen so outer diameter (width - 4, from DONUT_RADIUS's -2px pad doubled)
  // lands exactly on each tier's own defining (minimum) diameter, safely inside that tier's bucket.
  // XS (60px diameter) is omitted: at the default holeRatio, its inner radius can never
  // clear DONUT_SUMMARY_MIN_RADIUS, so its own font size is never actually rendered/observable.
  test('S tier (120px diameter): value 20px, label 14px', async () => {
    render(<Basic {...Basic.args} width={124} height={124} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '20px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '14px');
  });

  test('M tier (160px diameter): value 22px, label 16px', async () => {
    render(<Basic {...Basic.args} width={164} height={164} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '22px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '16px');
  });

  test('L tier (200px diameter): value 36px, label 20px', async () => {
    render(<Basic {...Basic.args} width={204} height={204} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '36px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '20px');
  });

  test('XL tier (400px+ diameter): value 50px, label 24px', async () => {
    render(<Basic {...Basic.args} width={404} height={404} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '50px');
    expect(await screen.findByText('Visitors')).toHaveAttribute('font-size', '24px');
  });

  test('a diameter numerically closer to M than to S stays S, since it has not reached M\'s own minimum yet', async () => {
    // outer diameter ~150 sits between S(120) and M(160), and is numerically closer to M - but a
    // tier is sticky from its own minimum, not nearest-neighbor, so this must still be S (20px)
    render(<Basic {...Basic.args} width={154} height={154} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '20px');
  });

  test('a diameter just below the next tier\'s minimum stays at the current tier, not the next one', async () => {
    // 199px outer diameter is 1px short of L's 200px minimum - must still render as M (22px)
    render(<Basic {...Basic.args} width={203} height={203} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '22px');
  });
});

describe('Small radius', () => {
  test('should hide the summary if the donut inner radius is < DONUT_SUMMARY_MIN_RADIUS', async () => {
    render(<Basic {...Basic.args} width={DONUT_SUMMARY_MIN_RADIUS * 2} height={DONUT_SUMMARY_MIN_RADIUS * 2} />);
    expect(await screen.findByText('40K')).toHaveAttribute('font-size', '0px');
  });
});
