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
import { ReactElement } from 'react';

import { act, fireEvent, render as renderElement, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Provider } from '@react-spectrum/s2';
import { ROUNDED_SQUARE_PATH } from '@spectrum-charts/core-s2/constants';
import { ADOBE_CLEAN_FONT, spectrum2Colors } from '@spectrum-charts/core-s2/tokens';
import { legendSymbolShape } from '@spectrum-charts/vega-spec-builder-s2';

import '../../test-utils/__mocks__/matchMedia.mock.js';
import { Legend } from './Legend.js';

const render = (element: ReactElement) =>
  renderElement(element, {
    wrapper: ({ children }) => <Provider colorScheme="light">{children}</Provider>,
  });

const items = [
  { seriesName: 'a', label: 'Alpha', color: 'categorical-100', description: 'Full Alpha description' },
  { seriesName: 'b', label: 'Beta', color: 'categorical-200' },
];

afterEach(() => jest.restoreAllMocks());

test.each(['light', 'dark'] as const)(
  'uses the native hidden symbol and controlled state in %s mode',
  async (colorScheme) => {
    const onClick = jest.fn();
    const { rerender } = render(
      <Legend items={items} hiddenSeries={['a', 'b']} colorScheme={colorScheme} onClick={onClick} />
    );
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    const symbol = alpha.querySelector('path');
    expect(alpha).toHaveAttribute('aria-pressed', 'false');
    expect(alpha).toHaveAccessibleDescription('Full Alpha description');
    expect(symbol).toHaveAttribute('d', legendSymbolShape(ROUNDED_SQUARE_PATH, true));
    expect(symbol).toHaveAttribute('fill', spectrum2Colors[colorScheme]['gray-500']);
    expect(screen.getByText('Alpha')).not.toHaveStyle({ textDecoration: 'line-through' });
    await userEvent.click(alpha);
    expect(onClick).toHaveBeenLastCalledWith('a');
    expect(alpha).toHaveAttribute('aria-pressed', 'false');
    rerender(<Legend items={items} hiddenSeries={['b']} colorScheme={colorScheme} onClick={onClick} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBe(alpha);
    expect(alpha).toHaveFocus();
    expect(alpha).toHaveAttribute('aria-pressed', 'true');
    expect(symbol).toHaveAttribute('d', legendSymbolShape(ROUNDED_SQUARE_PATH, false));
    expect(symbol).toHaveAttribute('fill', spectrum2Colors[colorScheme]['categorical-100']);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  }
);

test('forwards pointer and keyboard focus without changing hidden state', async () => {
  const onMouseOver = jest.fn(),
    onMouseOut = jest.fn();
  render(<Legend items={items} onMouseOver={onMouseOver} onMouseOut={onMouseOut} />);
  const alpha = screen.getByRole('button', { name: 'Alpha' });
  await userEvent.hover(alpha);
  expect(onMouseOver).toHaveBeenLastCalledWith('a');
  await userEvent.unhover(alpha);
  expect(onMouseOut).toHaveBeenLastCalledWith('a');
  await userEvent.tab();
  expect(alpha).toHaveFocus();
  expect(onMouseOver).toHaveBeenLastCalledWith('a');
  await userEvent.tab();
  expect(onMouseOut).toHaveBeenLastCalledWith('a');
});

test.each(['right-click', 'Shift+F10', 'ContextMenu'])(
  'opens a context dialog with %s and restores focus',
  async (trigger) => {
    const onClick = jest.fn(),
      onContextMenu = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <div onContextMenu={onContextMenu}>
        <Legend
          items={items}
          onClick={onClick}
          renderContextMenu={(name, close) => <button onClick={close}>{name}</button>}
        />
      </div>
    );
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    if (trigger === 'right-click') fireEvent.contextMenu(alpha);
    else {
      await userEvent.tab();
      fireEvent.keyDown(alpha, {
        key: trigger === 'Shift+F10' ? 'F10' : 'ContextMenu',
        shiftKey: trigger === 'Shift+F10',
      });
    }
    expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(alpha).toHaveFocus();
    expect(consoleError).not.toHaveBeenCalled();
  }
);

test('does not intercept the browser context menu without a custom renderer', () => {
  render(<Legend items={items} onClick={jest.fn()} />);
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  fireEvent(screen.getByRole('button', { name: 'Alpha' }), event);
  expect(event.defaultPrevented).toBe(false);
});

test('renders complete static entries without controls, including when every series is hidden', () => {
  render(<Legend items={items} hiddenSeries={['a', 'b']} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByText('Beta')).toBeVisible();
});

test('pages entries independently of series visibility and preserves their supplied colors', async () => {
  const onClick = jest.fn();
  const { rerender } = render(<Legend items={items} hiddenEntries={['b']} hiddenSeries={['b']} onClick={onClick} />);
  expect(screen.queryByRole('button', { name: 'Beta' })).not.toBeInTheDocument();
  rerender(<Legend items={items} hiddenEntries={['a']} hiddenSeries={['b']} onClick={onClick} />);
  const beta = screen.getByRole('button', { name: 'Beta' });
  expect(beta).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(beta);
  expect(onClick).toHaveBeenLastCalledWith('b');
  expect(screen.queryByRole('button', { name: 'Alpha' })).not.toBeInTheDocument();
});

test('rejects duplicate identities and uncontrolled standalone toggling', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    expect(() => render(<Legend items={[items[0], items[0]]} />)).toThrow('unique nonempty series names');
    expect(() => render(<Legend items={items} isToggleable />)).toThrow('Standalone legends are controlled');
    expect(() => render(<Legend items={items} preferredColumns={[0]} />)).toThrow('positive integers');
  } finally {
    error.mockRestore();
  }
});

describe('measured standalone pagination', () => {
  const originalObserver = globalThis.ResizeObserver;
  const observers = new Map<Element, (width: number) => void>();
  const entries = Array.from({ length: 25 }, (_, index) => ({
    seriesName: String(index),
    label: `Category ${index}`,
    color: 'categorical-100',
  }));
  beforeEach(() => {
    globalThis.ResizeObserver = class implements ResizeObserver {
      constructor(private callback: ResizeObserverCallback) {}
      observe(target: Element) {
        observers.set(target, (width) =>
          this.callback(
            [
              {
                target,
                contentRect: { ...target.getBoundingClientRect(), width },
                borderBoxSize: [],
                contentBoxSize: [],
                devicePixelContentBoxSize: [],
              },
            ],
            this
          )
        );
      }
      unobserve(target: Element) {
        observers.delete(target);
      }
      disconnect() {}
    };
  });
  afterEach(() => {
    globalThis.ResizeObserver = originalObserver;
    observers.clear();
    jest.useRealTimers();
  });
  const resize = (width: number) => act(() => observers.get(screen.getByTestId('measured'))?.(width));

  test.each([true, false])(
    'uses measured typography and only planned line breaks when interactive=%s',
    (interactive) => {
      const dates = ['Nov 5, 2026', 'Nov 17, 2026', 'Nov 16, 2026'].map((label, index) => ({
        seriesName: String(index),
        label,
        color: 'categorical-100',
      }));
      render(
        <Legend
          items={dates}
          preferredColumns={[5, 3]}
          maxRows={2}
          labelWrap={3}
          dataTestId="measured"
          onClick={interactive ? jest.fn() : undefined}
        />
      );
      resize(1680);
      for (const { label } of dates) {
        expect(screen.getByText(label)).toHaveStyle({ fontFamily: ADOBE_CLEAN_FONT, whiteSpace: 'pre' });
        if (interactive) expect(screen.getByRole('button', { name: label })).toHaveStyle({ columnGap: '0' });
      }
    }
  );

  test('reports native pages, caps rows, and pages separately from controlled visibility', async () => {
    const onPagesChange = jest.fn(),
      onClick = jest.fn();
    const props = {
      items: entries,
      preferredColumns: [5, 3],
      maxRows: 2,
      labelWrap: 3,
      dataTestId: 'measured',
      onPagesChange,
      onClick,
    };
    const { rerender } = render(<Legend {...props} hiddenSeries={['12']} />);
    resize(800);
    expect(onPagesChange).toHaveBeenLastCalledWith([
      { columns: 5, start: 0, end: 9 },
      { columns: 5, start: 10, end: 19 },
      { columns: 5, start: 20, end: 24 },
    ]);
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    rerender(
      <Legend
        {...props}
        hiddenSeries={['12']}
        hiddenEntries={entries.filter((_, index) => index < 10 || index > 19).map((item) => item.seriesName)}
      />
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    const hidden = screen.getByRole('button', { name: 'Category 12' });
    expect(hidden).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(hidden);
    expect(onClick).toHaveBeenLastCalledWith('12');
    expect(onPagesChange).toHaveBeenCalledTimes(1);
  });

  test('settles resize bursts for 150ms and does not report unchanged page plans', () => {
    jest.useFakeTimers();
    const onPagesChange = jest.fn();
    render(
      <Legend
        items={entries}
        preferredColumns={[5, 3]}
        maxRows={2}
        labelWrap={3}
        dataTestId="measured"
        onPagesChange={onPagesChange}
      />
    );
    resize(800);
    resize(200);
    resize(600);
    act(() => jest.advanceTimersByTime(150));
    expect(onPagesChange).toHaveBeenCalledTimes(1);
    resize(200);
    act(() => jest.advanceTimersByTime(149));
    expect(onPagesChange).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1));
    expect(onPagesChange).toHaveBeenCalledTimes(2);
    expect(onPagesChange.mock.lastCall[0]).toHaveLength(5);
  });
});
