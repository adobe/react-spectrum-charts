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
import { PropsWithChildren, createElement } from 'react';

import { renderHook } from '@testing-library/react';
import { View, expressionFunction, parse } from 'vega';

import { TABLE } from '@spectrum-charts/core-s2/constants';
import { buildSpec, getExpressionFunctions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartProvider } from '../../context/RscChartContext.js';
import useNewChartView from '../../hooks/useNewChartView.js';
import { childrenToOptions } from '../../rscToSbAdapter/childrenAdapter.js';
import { getDonutOptions } from '../../rscToSbAdapter/donutAdapter.js';
import { DonutProps, SegmentLabelProps } from '../../types/index.js';
import { getOnMouseInputCallback } from '../../utils/markClickUtils.js';
import { DonutSummary } from '../DonutSummary/index.js';
import { SegmentLabel } from '../SegmentLabel/index.js';
import { Donut } from './Donut.js';

const data = [
  { id: 'alpha', series: 'Alpha', value: 60, shareLabel: '60,0 %', metadata: { key: 'first' } },
  { id: 'beta', series: 'Beta', value: 40, shareLabel: '40,0 %', metadata: { key: 'second' } },
];

test.each([
  { labelKey: 'shareLabel', value: false, percent: false },
  { swatch: true, showValueRow: true, percent: true },
] satisfies SegmentLabelProps[])('routes real arc and label events through the Donut hooks: %o', async (label) => {
  Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
  expressionFunction('rscContainerWidth', (width: number) => width);
  const onMouseOver = jest.fn();
  const onMouseOut = jest.fn();
  const onClick = jest.fn();
  const onContextMenu = jest.fn();
  const props: DonutProps = {
    name: 'segments',
    onMouseOver,
    onMouseOut,
    onClick,
    onContextMenu,
    children: [
      createElement(DonutSummary, { valueText: '100 units', label: 'Total' }),
      createElement(SegmentLabel, label),
    ],
  };
  const mark = getDonutOptions(props, childrenToOptions);
  const spec = buildSpec({ data, idKey: 'id', animations: false, marks: [mark], legends: [{}] });
  const table = spec.data?.find(({ name }) => name === TABLE);
  if (!table || !('values' in table)) throw new Error('Expected inline table data');
  table.values = data.map((datum) => ({ ...datum }));
  expect(spec.usermeta?.interactiveMarks).toContainEqual({ name: 'segments' });
  const container = document.createElement('div');
  container.id = 'donut-interactions';
  document.body.appendChild(container);
  const view = new View(parse(spec), { renderer: 'svg' }).width(600).height(450).initialize(container);
  const chartView = { current: view };
  const wrapper = ({ children }: PropsWithChildren) => (
    <ChartProvider chartId={container.id} chartView={chartView}>
      {children}
    </ChartProvider>
  );
  const hook = renderHook(
    (donutProps: DonutProps) =>
      useNewChartView({ idKey: 'id' }, [createElement(Donut, donutProps)], {
        legendHiddenSeries: [],
        setLegendHiddenSeries: jest.fn(),
      }),
    { initialProps: props, wrapper }
  );
  hook.result.current(view);
  try {
    await view.runAsync();
    const arcs = Array.from(container.querySelectorAll('g.segments path'));
    const labels = Array.from(container.querySelectorAll('g.mark-text, g.mark-symbol'))
      .filter((group) => Array.from(group.classList).some((name) => /segments_.*[sS]egmentLabel/.test(name)))
      .flatMap((group) => Array.from(group.children));
    expect(arcs).toHaveLength(2);
    expect(labels.length).toBeGreaterThan(0);
    if ('labelKey' in label) {
      expect(labels.map((node) => node.textContent)).toEqual(expect.arrayContaining(data.map(({ shareLabel }) => shareLabel)));
    }
    for (const node of [...arcs, ...labels]) {
      onMouseOver.mockClear();
      onMouseOut.mockClear();
      onClick.mockClear();
      onContextMenu.mockClear();
      node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      node.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      await view.runAsync();
      expect(onMouseOver).toHaveBeenCalledTimes(1);
      const datum = onMouseOver.mock.calls[0][0];
      const expected = data.find(({ id }) => id === datum.id);
      if (!expected) throw new Error('Expected the original host row');
      expect(datum).toMatchObject(expected);
      expect(datum.id).toMatch(/alpha|beta/);
      expect(view.signal('segments_hoveredItem')).toHaveProperty('id', datum.id);
      node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(datum);
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 30 });
      node.dispatchEvent(event);
      expect(onContextMenu).toHaveBeenCalledTimes(1);
      expect(onContextMenu).toHaveBeenCalledWith(event, datum);
      expect(event.defaultPrevented).toBe(true);
      node.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      await view.runAsync();
      expect(onMouseOut).toHaveBeenCalledWith(datum);
      expect(view.signal('segments_hoveredItem')).toBeNull();
    }

    expect(container.querySelector('g.segments_summaryValue')).toHaveAttribute('pointer-events', 'none');
    expect(container.querySelector('g.segments_summaryLabel')).toHaveAttribute('pointer-events', 'none');
    onClick.mockClear();
    onMouseOver.mockClear();
    onContextMenu.mockClear();
    const legend = container.querySelector('g.role-legend-symbol path');
    if (!legend) throw new Error('Expected a legend symbol');
    for (const type of ['mouseover', 'click', 'contextmenu']) {
      legend.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    }
    expect(onClick).not.toHaveBeenCalled();
    expect(onMouseOver).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();

    const replacement = jest.fn();
    hook.rerender({ ...props, onMouseOver: replacement });
    arcs[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(onMouseOver).not.toHaveBeenCalled();
    hook.rerender({ name: props.name, children: props.children });
    for (const type of ['mouseover', 'mouseout', 'click', 'contextmenu']) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true });
      arcs[0].dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(onContextMenu).not.toHaveBeenCalled();

    hook.rerender(props);
    hook.unmount();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  } finally {
    hook.unmount();
    view.finalize();
    container.remove();
  }
});

test('enables hover callbacks with no inspect, labels, click, or context-menu handler', async () => {
  Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
  expressionFunction('rscContainerWidth', (width: number) => width);
  const onMouseOver = jest.fn();
  const props: DonutProps = { onMouseOver };
  const mark = getDonutOptions(props, childrenToOptions);
  const spec = buildSpec({ data, animations: false, marks: [mark] });
  expect(spec.usermeta?.interactiveMarks).toContainEqual({ name: 'donut0' });
  expect(spec.signals?.some(({ name }) => name === 'donut0_hoveredItem')).toBe(true);
  expect(mark.chartInspects).toEqual([]);
  const table = spec.data?.find(({ name }) => name === TABLE);
  if (!table || !('values' in table)) throw new Error('Expected inline table data');
  table.values = data.map((datum) => ({ ...datum }));
  const container = document.createElement('div');
  const view = new View(parse(spec), { renderer: 'svg' }).width(400).height(400).initialize(container);
  view.addEventListener('mouseover', getOnMouseInputCallback(undefined, [{ markName: 'donut0', onMouseOver }]));
  try {
    await view.runAsync();
    const arc = container.querySelector('g.donut0 path');
    if (!arc) throw new Error('Expected a donut arc');
    arc.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await view.runAsync();
    expect(onMouseOver).toHaveBeenCalledTimes(1);
    expect(onMouseOver).toHaveBeenCalledWith(expect.objectContaining({ id: 'alpha', shareLabel: '60,0 %' }));
    expect(view.signal('donut0_hoveredItem')).toHaveProperty('id', 'alpha');
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    arc.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  } finally {
    view.finalize();
  }
});
