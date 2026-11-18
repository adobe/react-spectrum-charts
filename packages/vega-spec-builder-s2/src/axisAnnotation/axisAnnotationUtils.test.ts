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
import { View, expressionFunction, parse } from 'vega';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { AxisAnnotationSpecOptions } from '../types/index.js';
import {
  addAxisAnnotationAxis,
  addAxisAnnotationData,
  addAxisAnnotationMarks,
  addAxisAnnotationSignals,
  applyDefaultAxisAnnotationOptions,
} from './axisAnnotationUtils.js';

const testAxisAnnotation: AxisAnnotationSpecOptions = {
  chartPopovers: [],
  chartInspects: [],
  name: 'annotation0',
  dataKey: 'anids',
  color: 'gray-600',
  options: [],
  offset: 100,
  axisName: 'axis0',
  format: 'span',
  colorScheme: 'light',
};

const testAxisAnnotationWithOptions: AxisAnnotationSpecOptions = {
  chartPopovers: [],
  chartInspects: [],
  name: 'annotation0',
  dataKey: 'anids',
  color: 'gray-600',
  colorScheme: 'light',
  offset: 80,
  axisName: 'axis0',
  format: 'span',
  options: [
    { id: '1', color: 'magenta-600' },
    { id: '2', color: 'fuchsia-600' },
    { id: '3', color: 'yellow-600' },
    { id: '4', color: 'celery-600' },
  ],
};

const testAxisAnnotationSummary: AxisAnnotationSpecOptions = {
  chartPopovers: [],
  chartInspects: [],
  name: 'annotation0',
  dataKey: 'anids',
  color: 'gray-600',
  colorScheme: 'light',
  offset: 100,
  axisName: 'axis0',
  format: 'summary',
  options: [
    { id: '1', color: 'magenta-600' },
    { id: '2', color: 'fuchsia-600' },
    { id: '3', color: 'yellow-600' },
    { id: '4', color: 'celery-600' },
  ],
};

test.each(['datetime', 'timestamp'])(
  'time-axis annotations use %s for point/range coordinates through resize',
  async (dimension) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', () => 400);
    const start = Date.UTC(2026, 0, 1);
    const end = Date.UTC(2026, 0, 3);
    const rows = [
      { [dimension]: start, value: 1, annotations: ['range', 'point'] },
      { [dimension]: end, value: 2, annotations: ['range'] },
    ];
    const spec = buildSpec({
      data: rows,
      animations: false,
      axes: [{ position: 'bottom', labelFormat: 'time', axisAnnotations: [{}] }],
      marks: [{ markType: 'line', dimension }],
    });
    const view = new View(parse(JSON.parse(JSON.stringify(spec))), { renderer: 'none' }).insert('table', rows);
    try {
      let previousTransforms: string[] | undefined;
      for (const width of [400, 520]) {
        await view.width(width).height(240).runAsync();
        expect(
          view.data('axis0Annotation0_aggregate').map(({ id, lower, upper, center }) => ({
            id,
            lower: Number(lower),
            upper: Number(upper),
            center,
          }))
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'range', lower: start, upper: end, center: (start + end) / 2 }),
            expect.objectContaining({ id: 'point', lower: start, upper: start, center: start }),
          ])
        );
        const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
        const paths = Array.from(svg.querySelectorAll('.axis0Annotation0_icon path'));
        expect(paths).toHaveLength(2);
        const transforms = paths.map((path) => path.getAttribute('transform') ?? '');
        expect(transforms.join(' ')).not.toMatch(/NaN|Infinity/);
        if (previousTransforms) expect(transforms).not.toEqual(previousTransforms);
        previousTransforms = transforms;
      }
    } finally {
      view.finalize();
    }
  }
);

describe('Spec builder, AxisAnnotation', () => {
  describe('addAxisAnnotationData()', () => {
    test('test', () => {
      const data = [];
      addAxisAnnotationData(data, testAxisAnnotation);
      expect(data.length).toEqual(3);
      expect(data[0]).toMatchObject({ name: 'annotation0_details' });
      expect(data[1]).toMatchObject({ name: 'annotation0_aggregate' });
      expect(data[2]).toMatchObject({ name: 'annotation0_range' });
    });
    test('options', () => {
      const data = [];
      addAxisAnnotationData(data, testAxisAnnotationWithOptions);
      expect(data.length).toEqual(3);
      expect(data[0]).toMatchObject({ name: 'annotation0_details' });
      expect(data[1]).toMatchObject({ name: 'annotation0_aggregate' });
      expect(data[2]).toMatchObject({ name: 'annotation0_range' });
    });
    test('summary', () => {
      const data = [];
      addAxisAnnotationData(data, testAxisAnnotationSummary);
      expect(data.length).toEqual(2);
      expect(data[0]).toMatchObject({ name: 'annotation0_details' });
      expect(data[1]).toMatchObject({ name: 'annotation0_summary' });
    });
  });
  describe('addAxisAnnotationSignals()', () => {
    test('test', () => {
      const signals = [];
      addAxisAnnotationSignals(signals, testAxisAnnotation);
      expect(signals.length).toEqual(3);
      expect(signals[0]).toMatchObject({ name: 'annotation0_highlighted' });
      expect(signals[1]).toMatchObject({ name: 'annotation0_clicked' });
      expect(signals[2]).toMatchObject({ name: 'annotation0_selected' });
    });
    test('summary', () => {
      const signals = [];
      addAxisAnnotationSignals(signals, testAxisAnnotationSummary);
      expect(signals.length).toEqual(0);
    });
  });
  describe('addAxisAnnotationMarks()', () => {
    test('test', () => {
      const marks = [];
      addAxisAnnotationMarks(marks, testAxisAnnotation, 'xTime');
      expect(marks.length).toEqual(1);
      expect(marks[0]).toMatchObject({ name: 'annotation0_group' });
    });
    test('test', () => {
      const marks = [];
      addAxisAnnotationMarks(marks, testAxisAnnotationSummary, 'xTime');
      expect(marks.length).toEqual(1);
      expect(marks[0]).toMatchObject({ name: 'annotation0_group' });
    });
  });
  describe('addAxisAnnotationAxis()', () => {
    test('test', () => {
      const axes = [];
      addAxisAnnotationAxis(axes, testAxisAnnotation, 'xTime');
      expect(axes.length).toEqual(1);
      expect(axes[0]).toMatchObject({ offset: 100 });
    });
    test('summary', () => {
      const axes = [];
      addAxisAnnotationAxis(axes, testAxisAnnotationSummary, 'xTime');
      expect(axes.length).toEqual(1);
      expect(axes[0]).toMatchObject({ offset: 100 });
    });
  });
  describe('applyDefaultAxisAnnotationOptions()', () => {
    test('default for time', () => {
      const newOptions = applyDefaultAxisAnnotationOptions({ name: 'annotation0' }, 0, 'xTime', 'light', 'time');
      expect(newOptions).toMatchObject({
        color: 'gray-600',
        colorScheme: 'light',
        dataKey: 'annotations',
        name: 'annotation0',
        offset: 80,
        options: [],
        axisName: 'xTime',
        format: 'span',
      });
    });
    test('default for linear', () => {
      const newOptions = applyDefaultAxisAnnotationOptions({}, 1, 'xSeries', 'dark', 'linear');
      expect(newOptions).toMatchObject({
        color: 'gray-600',
        colorScheme: 'dark',
        dataKey: 'annotations',
        name: 'xSeriesAnnotation1',
        offset: 80,
        options: [],
        axisName: 'xSeries',
        format: 'summary',
      });
    });
  });
});
