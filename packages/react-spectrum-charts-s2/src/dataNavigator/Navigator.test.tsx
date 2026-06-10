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
import { ReactElement, useRef } from 'react';

import { render } from '@testing-library/react';
import { View } from 'vega';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { Navigator } from './Navigator';

const data: SimpleData[] = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
];

const getView = () => ({ signal: jest.fn(), runAsync: jest.fn() }) as unknown as View;

const Harness = ({ chartData }: { chartData: SimpleData[] }): ReactElement => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} data-testid="dn-container" style={{ position: 'relative' }}>
      <Navigator
        chartType="bar"
        data={chartData}
        dimension="browser"
        chartId="navigator-test"
        containerRef={ref}
        getView={getView}
      />
    </div>
  );
};

describe('Navigator', () => {
  test('renders no DOM of its own', () => {
    const { container } = render(<Navigator chartType="bar" data={data} dimension="browser" chartId="t" containerRef={{ current: null }} getView={getView} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('attaches the data-navigator entry button into the container', () => {
    const { getByTestId } = render(<Harness chartData={data} />);
    expect(getByTestId('dn-container').querySelector('button')).toBeTruthy();
  });

  test('does not attach navigation when there is no data', () => {
    const { getByTestId } = render(<Harness chartData={[]} />);
    expect(getByTestId('dn-container').querySelector('button')).toBeFalsy();
  });
});
