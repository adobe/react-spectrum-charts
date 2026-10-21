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
import { Spec } from 'vega';
import * as vegaEmbed from 'vega-embed';

import { TABLE } from '@spectrum-charts/core-s2/constants';

import { ViewHostInputs, createViewHost } from './viewHost.js';

type FakeView = { [K in 'signal' | 'change' | 'resize' | 'runAsync' | 'width' | 'height' | 'finalize']: jest.Mock };

const createFakeView = (): FakeView => {
  const view = {} as FakeView;
  for (const method of ['signal', 'change', 'resize', 'width', 'height', 'finalize'] as const) {
    view[method] = jest.fn(() => view);
  }
  view.runAsync = jest.fn(() => Promise.resolve(view));
  return view;
};

const spec: Spec = {
  data: [{ name: TABLE, values: [] }],
  signals: [{ name: 'highlightedSeries', value: null }],
  marks: [{ type: 'rect', from: { data: TABLE } }],
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createViewHost()', () => {
  let embedSpy: jest.SpyInstance;
  let fakeViews: FakeView[];
  let resolvers: (() => void)[];
  let base: ViewHostInputs;

  beforeEach(() => {
    fakeViews = [];
    resolvers = [];
    embedSpy = jest.spyOn(vegaEmbed, 'default').mockImplementation(
      () =>
        new Promise((resolve) => {
          const view = createFakeView();
          fakeViews.push(view);
          resolvers.push(() => resolve({ view } as unknown as vegaEmbed.Result));
        })
    );
    base = {
      config: {},
      height: 300,
      locale: 'en-US',
      onNewView: jest.fn(),
      padding: 0,
      renderer: 'svg',
      spec,
      table: [{ x: 1 }],
      tooltip: jest.fn(),
      width: 400,
    };
  });

  afterEach(() => {
    embedSpy.mockRestore();
  });

  const mount = async (inputs = base) => {
    const host = createViewHost(document.createElement('div'));
    expect(host.update(inputs)).toBe('rebuild');
    resolvers.at(-1)?.();
    await flush();
    return host;
  };

  test('should embed once and call onNewView with the new view', async () => {
    await mount();

    expect(embedSpy).toHaveBeenCalledTimes(1);
    expect(base.onNewView).toHaveBeenCalledWith(fakeViews[0]);
  });

  test('should return none when the size is zero', () => {
    const host = createViewHost(document.createElement('div'));

    expect(host.update({ ...base, width: 0 })).toBe('none');
    expect(embedSpy).not.toHaveBeenCalled();
  });

  test('should do nothing for the same inputs or equal inputs', async () => {
    const host = await mount();

    expect(host.update(base)).toBe('noop');
    expect(host.update({ ...base, table: [{ x: 1 }] })).toBe('noop');
    expect(embedSpy).toHaveBeenCalledTimes(1);
    expect(fakeViews[0].change).not.toHaveBeenCalled();
  });

  test.each<[string, Partial<ViewHostInputs>]>([
    ['the program', { spec: { ...spec, marks: [{ type: 'symbol', from: { data: TABLE } }] } }],
    ['the config', { config: { background: 'red' } }],
    ['the locale', { locale: 'de-DE' }],
    ['the padding', { padding: 4 }],
    ['the renderer', { renderer: 'canvas' }],
    ['the tooltip handler', { tooltip: jest.fn() }],
    ['onNewView', { onNewView: jest.fn() }],
  ])('should rebuild when %s changes', async (_, change) => {
    const host = await mount();

    expect(host.update({ ...base, ...change })).toBe('rebuild');
    expect(embedSpy).toHaveBeenCalledTimes(2);
    expect(fakeViews[0].finalize).toHaveBeenCalled();
  });

  test('should apply a signal change to the current view', async () => {
    const host = await mount();

    expect(host.update({ ...base, signals: { highlightedSeries: 'a' } })).toBe('incremental');
    expect(fakeViews[0].signal).toHaveBeenCalledWith('highlightedSeries', 'a');
    expect(fakeViews[0].change).not.toHaveBeenCalled();
    expect(embedSpy).toHaveBeenCalledTimes(1);
  });

  test('should apply a data change to the current view', async () => {
    const host = await mount();

    expect(host.update({ ...base, table: [{ x: 2 }] })).toBe('incremental');
    expect(fakeViews[0].change).toHaveBeenCalledWith(TABLE, expect.anything());
    expect(fakeViews[0].signal).not.toHaveBeenCalled();
    expect(embedSpy).toHaveBeenCalledTimes(1);
  });

  test('should resize the current view', async () => {
    const host = await mount();

    expect(host.update({ ...base, width: 500 })).toBe('incremental');
    expect(fakeViews[0].width).toHaveBeenCalledWith(500);
    expect(embedSpy).toHaveBeenCalledTimes(1);
  });

  test('should apply updates that arrive during an embed once it resolves', async () => {
    const host = createViewHost(document.createElement('div'));
    host.update(base);

    expect(host.update({ ...base, table: [{ x: 2 }] })).toBe('deferred');

    resolvers[0]();
    await flush();

    expect(fakeViews[0].change).toHaveBeenCalledTimes(1);
    expect(embedSpy).toHaveBeenCalledTimes(1);
  });

  test('should discard a view whose embed resolves after a rebuild', async () => {
    const host = createViewHost(document.createElement('div'));
    host.update(base);
    host.update({ ...base, padding: 4 });

    resolvers[0]();
    resolvers[1]();
    await flush();

    expect(fakeViews[0].finalize).toHaveBeenCalled();
    expect(base.onNewView).toHaveBeenCalledTimes(1);
    expect(base.onNewView).toHaveBeenCalledWith(fakeViews[1]);
  });

  test('should rebuild on the next update after a failed embed', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    embedSpy.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    const host = createViewHost(document.createElement('div'));
    host.update(base);
    await flush();

    expect(consoleError).toHaveBeenCalledWith('Failed to render chart:', expect.any(Error));
    expect(host.update({ ...base, table: [{ x: 2 }] })).toBe('rebuild');
    consoleError.mockRestore();
  });

  test('should finalize the view and ignore updates after destroy', async () => {
    const host = await mount();
    host.destroy();

    expect(fakeViews[0].finalize).toHaveBeenCalled();
    expect(host.update({ ...base, padding: 4 })).toBe('none');
    expect(embedSpy).toHaveBeenCalledTimes(1);
  });

  test('should discard a view whose embed resolves after destroy', async () => {
    const host = createViewHost(document.createElement('div'));
    host.update(base);
    host.destroy();
    resolvers[0]();
    await flush();

    expect(fakeViews[0].finalize).toHaveBeenCalled();
    expect(base.onNewView).not.toHaveBeenCalled();
  });
});
