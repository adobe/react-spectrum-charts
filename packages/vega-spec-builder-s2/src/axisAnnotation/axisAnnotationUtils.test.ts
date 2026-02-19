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
import { AxisAnnotationSpecOptions } from '../types';
import {
  addAxisAnnotationAxis,
  addAxisAnnotationData,
  addAxisAnnotationMarks,
  addAxisAnnotationSignals,
  applyDefaultAxisAnnotationOptions,
} from './axisAnnotationUtils';

const testAxisAnnotation: AxisAnnotationSpecOptions = {
  chartPopovers: [],
  chartTooltips: [],
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
  chartTooltips: [],
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
  chartTooltips: [],
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
