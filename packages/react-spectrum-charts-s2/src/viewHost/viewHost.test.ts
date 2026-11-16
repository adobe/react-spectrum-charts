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
import { Spec, View } from 'vega';
import * as vegaEmbed from 'vega-embed';

import { ANIMATION_TIMER, DRAW_IN_START, TABLE } from '@spectrum-charts/core-s2/constants';

import { VegaEnvironment, vegaViewAdapter } from './vegaViewAdapter.js';
import { ViewAnimation } from './viewAdapter.js';
import { ViewHostAdapter, ViewHostInputs, createViewHost } from './viewHost.js';

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
      environment: { config: {}, locale: 'en-US', padding: 0, renderer: 'svg', tooltip: jest.fn() },
      height: 300,
      onNewView: jest.fn(),
      spec,
      table: [{ x: 1 }],
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
    expect(host.update({ ...base, environment: { ...base.environment } })).toBe('noop');
    expect(embedSpy).toHaveBeenCalledTimes(1);
    expect(fakeViews[0].change).not.toHaveBeenCalled();
  });

  const withEnvironment = (change: Partial<VegaEnvironment>): Partial<ViewHostInputs> => ({
    environment: { ...base.environment, ...change },
  });

  test.each<[string, () => Partial<ViewHostInputs>]>([
    ['the program', () => ({ spec: { ...spec, marks: [{ type: 'symbol', from: { data: TABLE } }] } })],
    ['the config', () => withEnvironment({ config: { background: 'red' } })],
    ['the locale', () => withEnvironment({ locale: 'de-DE' })],
    ['the padding', () => withEnvironment({ padding: 4 })],
    ['the renderer', () => withEnvironment({ renderer: 'canvas' })],
    ['the tooltip handler', () => withEnvironment({ tooltip: jest.fn() })],
    ['onNewView', () => ({ onNewView: jest.fn() })],
  ])('should rebuild when %s changes', async (_, change) => {
    const host = await mount();

    expect(host.update({ ...base, ...change() })).toBe('rebuild');
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
    host.update({ ...base, ...withEnvironment({ padding: 4 }) });

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
    expect(host.update({ ...base, ...withEnvironment({ padding: 4 }) })).toBe('none');
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

  test('should create, update and destroy views through the given adapter', async () => {
    const view = createFakeView() as unknown as View;
    const adapter: ViewHostAdapter = {
      ...vegaViewAdapter,
      createView: jest.fn(() => Promise.resolve(view)),
      startView: jest.fn(),
      updateView: jest.fn(),
      destroyView: jest.fn(),
    };
    const host = createViewHost(document.createElement('div'), adapter);
    host.update(base);
    await flush();
    host.update({ ...base, table: [{ x: 2 }], width: 500 });
    host.destroy();

    expect(adapter.createView).toHaveBeenCalledTimes(1);
    expect(adapter.startView).toHaveBeenCalledWith(view);
    expect(adapter.updateView).toHaveBeenCalledWith(view, {
      signals: [],
      table: [{ x: 2 }],
      size: { width: 500, height: 300 },
    });
    expect(adapter.destroyView).toHaveBeenCalledWith(view);
    expect(embedSpy).not.toHaveBeenCalled();
  });

  describe('animation', () => {
    const animatedSpec: Spec = {
      ...spec,
      data: [{ name: TABLE, values: [{ x: 1 }] }],
      signals: [
        { name: ANIMATION_TIMER, value: 0, on: [{ events: 'timer', update: 'now()' }] },
        { name: DRAW_IN_START, value: 0 },
      ],
    };

    const createAdapter = (animation: ViewHostAdapter['animation']): ViewHostAdapter => ({
      ...vegaViewAdapter,
      animation,
      createView: jest.fn(() => Promise.resolve(createFakeView() as unknown as View)),
      startView: jest.fn(),
    });

    test('should prepare the spec and attach the ticker through the adapter', async () => {
      const detach = jest.fn();
      const animation = {
        ...(vegaViewAdapter.animation as ViewAnimation<Spec, View>),
        prepareSpec: jest.fn(),
        attachTicker: jest.fn(() => detach),
      };
      const container = document.createElement('div');
      const host = createViewHost(container, createAdapter(animation));
      host.update({ ...base, spec: animatedSpec });
      await flush();
      host.destroy();

      expect(animation.prepareSpec).toHaveBeenCalledWith(expect.any(Object), undefined, expect.any(Number));
      expect(animation.attachTicker).toHaveBeenCalledWith(expect.any(Object), container, expect.any(Number));
      expect(detach).toHaveBeenCalledTimes(1);
    });

    test('should not draw in or prepare the spec when the adapter has no animation support', async () => {
      const container = document.createElement('div');
      const adapter = createAdapter(undefined);
      const host = createViewHost(container, adapter);
      host.update({ ...base, spec: animatedSpec });

      expect(container.style.opacity).toBe('');
      await flush();
      const builtSpec = jest.mocked(adapter.createView).mock.calls[0][1];
      expect(builtSpec.signals?.[0]).toHaveProperty('on');
      host.destroy();
    });
  });
});
