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
import { View } from 'vega';

import { MARK_ID, SERIES_ID } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { DonutDialogContent, getDonutSwatchColor } from './ChartDialogContent';

const datum = (fields: Record<string, unknown>): Datum => ({ [MARK_ID]: 0, [SERIES_ID]: '', ...fields });

const getColor = jest.fn(() => '#ff0000');
const keys = { colorKey: 'browser', metricKey: 'count', percentKey: 'donut0_arcPercent' };

describe('DonutDialogContent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders the swatch, series, and percent of total', () => {
    render(
      <DonutDialogContent
        {...keys}
        datum={datum({ browser: 'Chrome', count: 23456, donut0_arcPercent: 0.652 })}
        getColor={getColor}
      />
    );
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('65.2% (23K)')).toBeInTheDocument();
    expect(screen.getByTestId('donut-dialog-swatch')).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(getColor).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' }));
  });

  test('does not render a standalone raw value row', () => {
    const { container } = render(
      <DonutDialogContent
        {...keys}
        datum={datum({ browser: 'Chrome', count: 23456, donut0_arcPercent: 0.652 })}
        getColor={getColor}
      />
    );
    expect(screen.queryByText('23456')).not.toBeInTheDocument();
    expect(container.firstElementChild?.children).toHaveLength(3);
  });

  test('formats the percent with the chart locale', () => {
    const { container } = render(
      <DonutDialogContent
        {...keys}
        datum={datum({ browser: 'Chrome', count: 23456, donut0_arcPercent: 0.652 })}
        getColor={getColor}
        locale="fr-FR"
      />
    );
    expect(container.querySelector('.rsc-donut-dialog-percent-value')?.textContent).toBe('65,2\u202f% (23\u00a0k)');
  });

  test('renders empty text when the series, metric, and percent are missing', () => {
    const { container } = render(<DonutDialogContent {...keys} datum={datum({})} getColor={() => undefined} />);
    expect(container.querySelector('.rsc-donut-dialog-series')).toHaveTextContent('');
    expect(container.querySelector('.rsc-donut-dialog-percent-value')).toHaveTextContent('');
    expect(screen.getByTestId('donut-dialog-swatch').style.backgroundColor).toBe('');
  });

  test('renders zero values instead of treating them as missing', () => {
    render(
      <DonutDialogContent {...keys} datum={datum({ browser: 0, count: 0, donut0_arcPercent: 0 })} getColor={getColor} />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0% (0)')).toBeInTheDocument();
  });
});

describe('getDonutSwatchColor()', () => {
  const booleanKeys = { ...keys, booleanDataName: 'donut0_booleanData' };
  const segment = datum({ [MARK_ID]: 1, browser: 'Chrome' });
  const view = (primaryId: number) =>
    ({ data: () => [{ [MARK_ID]: primaryId }], scale: () => () => '#ff0000' } as unknown as View);

  test('returns undefined without a view', () => {
    expect(getDonutSwatchColor(undefined, keys, segment, MARK_ID, 'light')).toBeUndefined();
  });

  test('uses the color scale for non-boolean donuts', () => {
    expect(getDonutSwatchColor(view(0), keys, segment, MARK_ID, 'light')).toBe('#ff0000');
  });

  test('uses the color scale for the primary segment of a boolean donut', () => {
    expect(getDonutSwatchColor(view(1), booleanKeys, segment, MARK_ID, 'light')).toBe('#ff0000');
  });

  test('uses gray for the secondary segment of a boolean donut', () => {
    expect(getDonutSwatchColor(view(0), booleanKeys, segment, MARK_ID, 'light')).toBe(
      getS2ColorValue('gray-400', 'light')
    );
  });
});
