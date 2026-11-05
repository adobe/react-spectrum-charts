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
import { View } from 'vega';

import { NavigationInputs, createNavigationController, getStructureKey } from './navigationController.js';
import { NavigationSession, mountNavigationSession } from './navigationSession.js';

jest.mock('./navigationSession.js', () => ({ mountNavigationSession: jest.fn() }));

const mountMock = mountNavigationSession as jest.Mock;

let container: HTMLElement;
let sessions: (NavigationSession & { [K in keyof NavigationSession]: jest.Mock })[];

const inputs = (overrides: Partial<NavigationInputs> = {}): NavigationInputs => ({
  chartType: 'bar',
  data: [{ browser: 'Chrome', downloads: 10 }],
  dimension: 'browser',
  ...overrides,
});

const mockView = () => ({ runAsync: jest.fn().mockResolvedValue(undefined) } as unknown as View);

const flush = () => new Promise((resolve) => setTimeout(resolve));

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  sessions = [];
  mountMock.mockReset().mockImplementation(() => {
    const session = { setActions: jest.fn(), focusEntry: jest.fn(), destroy: jest.fn() };
    sessions.push(session);
    return session;
  });
});

afterEach(() => container.remove());

describe('getStructureKey()', () => {
  test('ignores actions', () => {
    expect(getStructureKey(inputs({ onNodeClick: jest.fn(), hasChartPopover: true }))).toBe(getStructureKey(inputs()));
  });

  test('changes with the data', () => {
    expect(getStructureKey(inputs({ data: [{ browser: 'Firefox' }] }))).not.toBe(getStructureKey(inputs()));
  });
});

describe('createNavigationController()', () => {
  test('mounts without a view so the entry button is available', () => {
    createNavigationController(container, 'chart').update(inputs());

    expect(mountMock).toHaveBeenCalledWith(expect.objectContaining({ container, chartId: 'chart', view: undefined }));
  });

  test('does not mount without data', () => {
    createNavigationController(container, 'chart').update(inputs({ data: [] }));

    expect(mountMock).not.toHaveBeenCalled();
  });

  test('updates actions without remounting when the structure is unchanged', () => {
    const controller = createNavigationController(container, 'chart');
    controller.update(inputs());
    const onNodeClick = jest.fn();

    controller.update(inputs({ onNodeClick }));

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(sessions[0].setActions).toHaveBeenCalledWith(expect.objectContaining({ onNodeClick }));
  });

  test('remounts after the view runs when the structure changes', async () => {
    const view = mockView();
    const controller = createNavigationController(container, 'chart');
    controller.setView(view);
    controller.update(inputs());
    await flush();

    controller.update(inputs({ data: [{ browser: 'Firefox', downloads: 5 }] }));

    expect(sessions[0].destroy).toHaveBeenCalled();
    expect(mountMock).toHaveBeenCalledTimes(1);
    await flush();
    expect(mountMock).toHaveBeenCalledTimes(2);
    expect(view.runAsync).toHaveBeenCalled();
  });

  test('mounts once for the latest of several changes', async () => {
    const controller = createNavigationController(container, 'chart');
    controller.update(inputs());
    controller.setView(mockView());
    controller.setView(mockView());
    await flush();

    expect(mountMock).toHaveBeenCalledTimes(2);
  });

  test('focuses the new entry button when focus was inside the navigation', async () => {
    const controller = createNavigationController(container, 'chart');
    controller.update(inputs());
    const focusable = document.createElement('button');
    container.appendChild(focusable);
    focusable.focus();

    controller.setView(mockView());
    await flush();

    expect(sessions[1].focusEntry).toHaveBeenCalled();
  });

  test('does not take focus when it was outside the navigation', async () => {
    const controller = createNavigationController(container, 'chart');
    controller.update(inputs());

    controller.setView(mockView());
    await flush();

    expect(sessions[1].focusEntry).not.toHaveBeenCalled();
  });

  test.each([
    ['update(undefined)', (c: ReturnType<typeof createNavigationController>) => c.update(undefined)],
    ['destroy()', (c: ReturnType<typeof createNavigationController>) => c.destroy()],
  ])('%s removes the navigation and drops pending mounts', async (_, remove) => {
    const controller = createNavigationController(container, 'chart');
    controller.update(inputs());
    controller.setView(mockView());

    remove(controller);
    await flush();

    expect(sessions[0].destroy).toHaveBeenCalled();
    expect(mountMock).toHaveBeenCalledTimes(1);
  });
});
