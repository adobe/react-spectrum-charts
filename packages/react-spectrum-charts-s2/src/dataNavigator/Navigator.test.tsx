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

import { fireEvent, render } from '@testing-library/react';
import { View } from 'vega';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { Navigator } from './Navigator';

const data: SimpleData[] = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
];

const getView = () =>
  ({
    signal: jest.fn(),
    runAsync: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }) as unknown as View;

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

  test('a re-render that only changes markName/specSignalNames does not tear down and rebuild the nav structure', () => {
    const HarnessWithHoverInfo = ({ markName }: { markName: string }): ReactElement => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} data-testid="dn-container" style={{ position: 'relative' }}>
          <Navigator
            chartType="bar"
            data={data}
            dimension="browser"
            chartId="navigator-hover-test"
            containerRef={ref}
            getView={getView}
            markName={markName}
            specSignalNames={new Set([`${markName}_hoveredItem`])}
          />
        </div>
      );
    };
    const { rerender, getByTestId } = render(<HarnessWithHoverInfo markName="bar0" />);
    const entryButtonBefore = getByTestId('dn-container').querySelector('button');
    rerender(<HarnessWithHoverInfo markName="bar1" />);
    const entryButtonAfter = getByTestId('dn-container').querySelector('button');
    expect(entryButtonAfter).toBe(entryButtonBefore);
  });

  test('a re-render that changes the onActivate identity does not rebuild the nav structure, and the latest callback fires', () => {
    const onActivate1 = jest.fn();
    const onActivate2 = jest.fn();
    const HarnessWithActivate = ({ onActivate }: { onActivate: (datum: SimpleData) => void }): ReactElement => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} data-testid="dn-container" style={{ position: 'relative' }}>
          <Navigator
            chartType="bar"
            data={data}
            dimension="browser"
            chartId="navigator-activate-test"
            containerRef={ref}
            getView={getView}
            onActivate={onActivate}
          />
        </div>
      );
    };
    const { rerender, getByTestId } = render(<HarnessWithActivate onActivate={onActivate1} />);
    const entryButton = getByTestId('dn-container').querySelector('button') as HTMLButtonElement;
    entryButton.click();
    fireEvent.keyDown(getByTestId('dn-container').querySelector('.dn-node') as Element, {
      key: 'Enter',
      code: 'Enter',
    }); // drills to the first leaf bar

    // a new onActivate identity, e.g. from a parent re-render — must not tear down and rebuild the structure
    rerender(<HarnessWithActivate onActivate={onActivate2} />);
    expect(getByTestId('dn-container').querySelector('button')).toBe(entryButton);

    fireEvent.keyDown(getByTestId('dn-container').querySelector('.dn-node') as Element, {
      key: 'Enter',
      code: 'Enter',
    }); // activates the focused leaf
    expect(onActivate2).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' }));
    expect(onActivate1).not.toHaveBeenCalled();
  });

  test('a late viewVersion bump (view resolves after attach) preserves tracked focus instead of rebuilding the structure', () => {
    // getView must behave like the real caller's stable useCallback(() => chartView.current, ...):
    // a function whose IDENTITY never changes but whose return value reads live state.
    const currentAddEventListener = jest.fn();
    const viewRef: { current: View | undefined } = { current: undefined }; // simulates the Vega view not being ready yet
    const getLiveView = () => viewRef.current;

    const HarnessWithViewVersion = ({ viewVersion }: { viewVersion: number }): ReactElement => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} data-testid="dn-container" style={{ position: 'relative' }}>
          <Navigator
            chartType="bar"
            data={data}
            dimension="browser"
            chartId="navigator-view-version-test"
            containerRef={ref}
            getView={getLiveView}
            viewVersion={viewVersion}
          />
        </div>
      );
    };

    const { rerender, getByTestId } = render(<HarnessWithViewVersion viewVersion={0} />);
    const entryButton = getByTestId('dn-container').querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const nodeBefore = getByTestId('dn-container').querySelector('.dn-node');
    expect(nodeBefore).toBeTruthy();

    // the view becomes ready later — this must not tear down and rebuild the structure
    viewRef.current = {
      signal: jest.fn(),
      runAsync: jest.fn(),
      addEventListener: currentAddEventListener,
      removeEventListener: jest.fn(),
    } as unknown as View;
    rerender(<HarnessWithViewVersion viewVersion={1} />);

    const nodeAfter = getByTestId('dn-container').querySelector('.dn-node');
    expect(nodeAfter).toBe(nodeBefore);
    // but the view-dependent listeners are still registered once the view becomes available
    expect(currentAddEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(currentAddEventListener).toHaveBeenCalledWith('mouseout', expect.any(Function));
  });
});
