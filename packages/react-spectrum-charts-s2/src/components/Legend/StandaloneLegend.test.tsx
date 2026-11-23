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

import { fireEvent, render as renderElement, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Provider } from '@react-spectrum/s2';
import { ROUNDED_SQUARE_PATH } from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';
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

test('rejects duplicate identities and uncontrolled standalone toggling', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    expect(() => render(<Legend items={[items[0], items[0]]} />)).toThrow('unique nonempty series names');
    expect(() => render(<Legend items={items} isToggleable />)).toThrow('Standalone legends are controlled');
  } finally {
    error.mockRestore();
  }
});
