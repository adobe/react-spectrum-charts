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
import { render, screen } from '@testing-library/react';

import { MARK_ID, SERIES_ID } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { DonutDialogContent } from './ChartDialogContent';

const datum = (fields: Record<string, unknown>): Datum => ({ [MARK_ID]: 0, [SERIES_ID]: '', ...fields });

const getColor = jest.fn(() => '#ff0000');

describe('DonutDialogContent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders the swatch, series, and raw value', () => {
    render(<DonutDialogContent colorKey="browser" metricKey="count" datum={datum({ browser: 'Chrome', count: 10390 })} getColor={getColor} />);
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('10390')).toBeInTheDocument();
    expect(screen.getByTestId('donut-dialog-swatch')).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(getColor).toHaveBeenCalledWith('Chrome');
  });

  test('renders empty text when the series and metric are missing', () => {
    const { container } = render(<DonutDialogContent colorKey="browser" metricKey="count" datum={datum({})} getColor={() => undefined} />);
    expect(container.querySelector('.rsc-donut-dialog-series')).toHaveTextContent('');
    expect(container.querySelector('.rsc-donut-dialog-value')).toHaveTextContent('');
    expect(screen.getByTestId('donut-dialog-swatch').style.backgroundColor).toBe('');
  });

  test('renders zero values instead of treating them as missing', () => {
    render(<DonutDialogContent colorKey="browser" metricKey="count" datum={datum({ browser: 0, count: 0 })} getColor={getColor} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  test('does not render the custom container without children', () => {
    const { container } = render(
      <DonutDialogContent colorKey="browser" metricKey="count" datum={datum({ browser: 'Chrome', count: 1 })} getColor={getColor} />
    );
    expect(container.querySelector('.rsc-donut-dialog-custom')).not.toBeInTheDocument();
  });

  test('renders children below the default content', () => {
    const { container } = render(
      <DonutDialogContent colorKey="browser" metricKey="count" datum={datum({ browser: 'Chrome', count: 1 })} getColor={getColor}>
        <span>custom content</span>
      </DonutDialogContent>
    );
    const custom = container.querySelector('.rsc-donut-dialog-custom');
    expect(custom).toHaveTextContent('custom content');
    expect(container.firstElementChild?.lastElementChild).toBe(custom);
  });
});
