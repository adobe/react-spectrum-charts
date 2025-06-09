/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Axis, ColorValueRef, GroupMark, NumericValueRef, ProductionRule, Scale, Signal, TextValueRef } from 'vega';

import {
  DEFAULT_LABEL_FONT_WEIGHT,
  FILTERED_TABLE,
  HIGHLIGHT_CONTRAST_RATIO,
  LAST_RSC_SERIES_ID,
  MOUSE_OVER_SERIES,
} from '@spectrum-charts/constants';

import { SubLabel } from '../types';
import {
  addAxes,
  addAxesMarks,
  addAxis,
  addAxisSignals,
  getLabelSignalValue,
  setAxisBaseline,
} from './axisSpecBuilder';
import { defaultAxisOptions, defaultXBaselineMark, defaultYBaselineMark } from './axisTestUtils';

const defaultAxis: Axis = {
  orient: 'bottom',
  scale: 'xPoint',
  grid: false,
  ticks: false,
  tickCount: undefined,
  tickMinStep: undefined,
  domain: false,
  domainWidth: 2,
  title: undefined,
  labels: true,
  labelAlign: undefined,
  labelBaseline: 'top',
  labelAngle: 0,
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelOffset: undefined,
  labelPadding: undefined,
  encode: {
    labels: {
      update: {
        text: [
          {
            test: "isNumber(datum['value'])",
            signal: "formatShortNumber(datum['value'])",
          },
          { signal: 'datum.value' },
        ],
      },
    },
  },
};

const defaultSubLabelAxis: Axis = {
  ...defaultAxis,
  encode: {
    labels: {
      update: {
        text: [
          {
            signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].subLabel",
            test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1",
          },
          { signal: 'datum.value' },
        ],
        align: [
          {
            test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].align",
            signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].align",
          },
          {
            value: 'center',
          },
        ],
        baseline: [
          {
            test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].baseline",
            signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].baseline",
          },
          {
            value: 'top',
          },
        ],
        fontWeight: [
          {
            test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].fontWeight",
            signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].fontWeight",
          },
          {
            value: 'normal',
          },
        ],
      },
    },
  },
  domain: false,
  domainWidth: undefined,
  grid: false,
  labelAlign: 'center',
  labelPadding: 24,
  title: undefined,
  values: ['test'],
};

const defaultScales: Scale[] = [
  {
    name: 'xPoint',
    type: 'point',
    range: 'width',
    domain: { data: FILTERED_TABLE, field: 'x' },
  },
  {
    name: 'yLinear',
    type: 'linear',
    range: 'height',
    nice: true,
    zero: true,
    domain: { data: FILTERED_TABLE, field: 'y' },
  },
];

const defaultLinearScales: Scale[] = [
  {
    name: 'xLinear',
    type: 'linear',
    range: 'width',
    domain: { data: FILTERED_TABLE, field: 'x' },
  },
  {
    name: 'yLinear',
    type: 'linear',
    range: 'height',
    nice: true,
    zero: true,
    domain: { data: FILTERED_TABLE, field: 'y' },
  },
];

const defaultSubLabels: SubLabel[] = [{ value: 'test', subLabel: 'testing', align: undefined }];

const defaultSignal: Signal = {
  name: 'axis0_subLabels',
  value: defaultSubLabels,
};

const defaultTrellisGroupMark: GroupMark = {
  name: 'xTrellisGroup',
  type: 'group',
  marks: [defaultYBaselineMark],
  from: {
    facet: {
      data: FILTERED_TABLE,
      name: 'bar0_trellis',
      groupby: 'event',
    },
  },
};

describe('Spec builder, Axis', () => {
  describe('addAxis()', () => {
    describe('no initial state', () => {
      test('position = "bottom"', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { domain, domainWidth, ...axis } = defaultAxis;
        expect(addAxis({ usermeta: {}, scales: defaultScales }, { position: 'bottom' })).toStrictEqual({
          scales: defaultScales,
          axes: [{ ...axis, labelAlign: 'center' }],
          marks: [],
          signals: [],
          data: [],
          usermeta: {},
        });
      });
      test('position = "left"', () => {
        expect(addAxis({ usermeta: {}, scales: defaultScales }, { position: 'left' })).toStrictEqual({
          scales: defaultScales,
          axes: [
            {
              ...defaultAxis,
              orient: 'left',
              scale: 'yLinear',
              labelAlign: 'right',
              labelBaseline: 'middle',
            },
          ],
          signals: [],
          marks: [],
          data: [],
          usermeta: {},
        });
      });
      test('type = percentage', () => {
        expect(
          addAxis({ usermeta: {}, scales: defaultScales }, { position: 'left', labelFormat: 'percentage' })
        ).toStrictEqual({
          scales: defaultScales,
          axes: [
            {
              ...defaultAxis,
              orient: 'left',
              scale: 'yLinear',
              labelAlign: 'right',
              labelBaseline: 'middle',
              encode: {
                labels: {
                  update: {
                    text: [
                      { test: 'isNumber(datum.value)', signal: "format(datum.value, '~%')" },
                      { signal: 'datum.value' },
                    ],
                  },
                },
              },
            },
          ],
          signals: [],
          marks: [],
          data: [],
          usermeta: {},
        });
      });
      test('subLabels', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { domain, domainWidth, ...axis } = defaultAxis;
        expect(
          addAxis({ usermeta: {}, scales: defaultScales }, { position: 'bottom', subLabels: defaultSubLabels })
        ).toStrictEqual({
          scales: defaultScales,
          axes: [{ ...axis, labelAlign: 'center', titlePadding: 24 }, defaultSubLabelAxis],
          marks: [],
          signals: [{ ...defaultSignal, value: [{ ...defaultSignal.value[0], baseline: undefined }] }],
          data: [],
          usermeta: {},
        });
      });
      test('custom X range', () => {
        const resultScales = addAxis(
          { usermeta: {}, scales: defaultLinearScales },
          { position: 'bottom', range: [0, 100] }
        ).scales;

        expect(resultScales?.at(0)?.domain).toEqual([0, 100]);
      });
      test('custom Y range', () => {
        const resultScales = addAxis(
          { usermeta: {}, scales: defaultLinearScales },
          { position: 'left', range: [0, 100] }
        ).scales;

        expect(resultScales?.at(1)?.domain).toEqual([0, 100]);
      });
    });
    describe('no scales', () => {
      test('should add scales', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { domain, domainWidth, ...axis } = defaultAxis;
        expect(addAxis({ usermeta: {} }, { position: 'bottom' })).toStrictEqual({
          axes: [{ ...axis, labelAlign: 'center', scale: 'xLinear' }],
          marks: [],
          signals: [],
          data: [],
          usermeta: {},
        });
      });
    });
  });

  describe('addAxes()', () => {
    describe('dualMetricAxis', () => {
      test('should add dualMetricAxis primary metric axis label color based on series', () => {
        const labelFillEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: {},
        })[0].encode?.labels?.update?.fill;
        expect(labelFillEncoding).toHaveLength(2);
        expect(labelFillEncoding?.[0]).toEqual({
          test: "length(domain('color')) -1 === 1",
          signal: "scale('color', firstRscSeriesId)",
        });
        expect(labelFillEncoding?.[1]).toEqual({ value: 'rgb(34, 34, 34)' });
      });

      test('should add dualMetricAxis primary metric axis label fill opacity based on series', () => {
        const labelFillOpacityEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: {},
        })[0].encode?.labels?.update?.fillOpacity;
        expect(labelFillOpacityEncoding).toHaveLength(1);
        expect(labelFillOpacityEncoding?.[0]).toEqual({
          test: `${MOUSE_OVER_SERIES} === ${LAST_RSC_SERIES_ID}`,
          value: 1 / HIGHLIGHT_CONTRAST_RATIO,
        });
      });

      test('should add dualMetricAxis primary metric axis title color based on series', () => {
        const titleFillEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: {},
        })[0].encode?.title?.update?.fill;
        expect(titleFillEncoding).toHaveLength(2);
        expect(titleFillEncoding?.[0]).toEqual({
          test: "length(domain('color')) -1 === 1",
          signal: "scale('color', firstRscSeriesId)",
        });
        expect(titleFillEncoding?.[1]).toEqual({ value: 'rgb(34, 34, 34)' });
      });

      test('should add dualMetricAxis primary metric axis title fill opacity based on series', () => {
        const titleFillOpacityEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: {},
        })[0].encode?.title?.update?.fillOpacity;
        expect(titleFillOpacityEncoding).toHaveLength(1);
        expect(titleFillOpacityEncoding?.[0]).toEqual({
          test: `${MOUSE_OVER_SERIES} === ${LAST_RSC_SERIES_ID}`,
          value: 1 / HIGHLIGHT_CONTRAST_RATIO,
        });
      });

      test('should add dualMetricAxis primary metric subLabels color based on series', () => {
        const labelFillEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta: {},
        })[1].encode?.labels?.update?.fill;
        expect(labelFillEncoding).toHaveLength(2);
        expect(labelFillEncoding?.[0]).toEqual({
          test: "length(domain('color')) -1 === 1",
          signal: "scale('color', firstRscSeriesId)",
        });
        expect(labelFillEncoding?.[1]).toEqual({ value: 'rgb(34, 34, 34)' });
      });

      test('should add dualMetricAxis primary metric subLabels fill opacity based on series', () => {
        const labelFillOpacityEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta: {},
        })[1].encode?.labels?.update?.fillOpacity;
        expect(labelFillOpacityEncoding).toHaveLength(1);
        expect(labelFillOpacityEncoding?.[0]).toEqual({
          test: `${MOUSE_OVER_SERIES} === ${LAST_RSC_SERIES_ID}`,
          value: 1 / HIGHLIGHT_CONTRAST_RATIO,
        });
      });

      test('should initialize usermeta.metricAxisCount when adding a primary metric axis', () => {
        const usermeta = {};
        addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta,
        });
        expect(usermeta).toEqual({ metricAxisCount: 1 });
      });

      test('should not add extra primary metric axis if subLabels axis is added', () => {
        const usermeta = {};
        addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta,
        });
        expect(usermeta).toEqual({ metricAxisCount: 1 });
      });

      test('should add dualMetricAxis secondary metric axis label color based on series', () => {
        const labelFillEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: { metricAxisCount: 1 },
        })[0].encode?.labels?.enter?.fill;
        expect(labelFillEncoding).toHaveLength(1);
        expect(labelFillEncoding?.[0]).toEqual({ signal: "scale('color', lastRscSeriesId)" });
      });

      test('should add dualMetricAxis secondary metric axis label fill opacity based on series', () => {
        const labelFillOpacityEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta: { metricAxisCount: 1 },
        })[0].encode?.labels?.update?.fillOpacity;
        expect(labelFillOpacityEncoding).toHaveLength(1);
        expect(labelFillOpacityEncoding?.[0]).toEqual({
          test: `isValid(${MOUSE_OVER_SERIES}) && ${MOUSE_OVER_SERIES} !== ${LAST_RSC_SERIES_ID}`,
          value: 1 / HIGHLIGHT_CONTRAST_RATIO,
        });
      });

      test('should add dualMetricAxis secondary metric subLabels color based on series', () => {
        const labelFillEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta: { metricAxisCount: 1 },
        })[1].encode?.labels?.enter?.fill;
        expect(labelFillEncoding).toHaveLength(1);
        expect(labelFillEncoding?.[0]).toEqual({ signal: "scale('color', lastRscSeriesId)" });
      });

      test('should add dualMetricAxis secondary metric subLabels fill opacity based on series', () => {
        const labelFillOpacityEncoding = addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta: { metricAxisCount: 1 },
        })[1].encode?.labels?.update?.fillOpacity;
        expect(labelFillOpacityEncoding).toHaveLength(1);
        expect(labelFillOpacityEncoding?.[0]).toEqual({
          test: `isValid(${MOUSE_OVER_SERIES}) && ${MOUSE_OVER_SERIES} !== ${LAST_RSC_SERIES_ID}`,
          value: 1 / HIGHLIGHT_CONTRAST_RATIO,
        });
      });

      test('should increment usermeta.metricAxisCount when adding a secondary metric axis', () => {
        const usermeta = { metricAxisCount: 1 };
        addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta,
        });
        expect(usermeta).toEqual({ metricAxisCount: 2 });
      });

      test('should not increment additional usermeta.metricAxisCount if subLabels axis is added', () => {
        const usermeta = { metricAxisCount: 1 };
        addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          subLabels: defaultSubLabels,
          usermeta,
        });
        expect(usermeta).toEqual({ metricAxisCount: 2 });
      });

      test('should not initialize usermeta.metricAxisCount if dualMetricAxis is false', () => {
        const usermeta = {};
        addAxes([], {
          ...defaultAxisOptions,
          dualMetricAxis: false,
          position: 'left',
          scaleName: 'yLinear',
          scaleType: 'linear',
          usermeta,
        });
        expect(usermeta).toEqual({});
      });
    });

    test('should add test to hide labels if they would overlap the reference line icon', () => {
      const labelTextEncoding = addAxes([], {
        ...defaultAxisOptions,
        referenceLines: [{ value: 10, icon: 'date' }],
        scaleName: 'xLinear',
        scaleType: 'linear',
        usermeta: {},
      })[0].encode?.labels?.update?.text as ProductionRule<TextValueRef>;
      expect(labelTextEncoding).toHaveLength(3);
      expect(labelTextEncoding[0]).toEqual({
        test: "abs(scale('xLinear', 10) - scale('xLinear', datum.value)) < 30",
        value: '',
      });
    });
    test('should add and tests for each referenceline to hide labels if they would overlap the reference line icon', () => {
      const labelTextEncoding = addAxes([], {
        ...defaultAxisOptions,
        referenceLines: [
          { value: 10, icon: 'date' },
          { value: 15, icon: 'date' },
        ],
        scaleName: 'xLinear',
        scaleType: 'linear',
        usermeta: {},
      })[0].encode?.labels?.update?.text as ProductionRule<TextValueRef>;

      // 2 tests for the two reference lines plus 2 default tests = 4 tests
      expect(labelTextEncoding).toHaveLength(4);
    });
    test('should set the values on the axis if labels is set', () => {
      const axes = addAxes([], {
        ...defaultAxisOptions,
        labels: [1, 2, 3],
        scaleName: 'xLinear',
        scaleType: 'linear',
        usermeta: {},
      });
      expect(axes).toHaveLength(1);
      expect(axes[0].values).toEqual([1, 2, 3]);
    });
  });

  describe('setAxisBaseline()', () => {
    //Vega uses "domain", we use "baseline"
    describe('no baseline prop', () => {
      test('should set domain to default (false)', () => {
        expect(setAxisBaseline(defaultAxis, undefined)).toStrictEqual({
          ...defaultAxis,
          domain: false,
        });
      });
    });
    describe('baseline prop', () => {
      test('should override existing domain', () => {
        expect(setAxisBaseline({ ...defaultAxis, domain: true }, false)).toStrictEqual({
          ...defaultAxis,
          domain: false,
        });
      });
      test('should set domain if it did not previously exist', () => {
        expect(setAxisBaseline(defaultAxis, false)).toStrictEqual({
          ...defaultAxis,
          domain: false,
        });
      });
    });
  });

  describe('addAxesMarks()', () => {
    test('should add baseline to the end of the marks if baseline offset is 0', () => {
      const marks = addAxesMarks([defaultYBaselineMark], {
        ...defaultAxisOptions,
        baseline: true,
        baselineOffset: 0,
        opposingScaleType: 'linear',
        scaleName: 'xLinear',
        usermeta: {},
      });

      expect(marks).toEqual([defaultYBaselineMark, defaultXBaselineMark]);
    });

    test('should add baseline to the start of the marks if baseline offset is not 0', () => {
      const marks = addAxesMarks([defaultYBaselineMark], {
        ...defaultAxisOptions,
        baseline: true,
        baselineOffset: 10,
        opposingScaleType: 'linear',
        scaleName: 'xLinear',
        usermeta: {},
      });

      expect(marks).toEqual([
        {
          ...defaultXBaselineMark,
          encode: {
            update: {
              ...defaultXBaselineMark.encode?.update,
              y: {
                ...defaultXBaselineMark.encode?.update?.y,
                value: 10,
              },
            },
          },
        },
        defaultYBaselineMark,
      ]);
    });

    test('should add baseline to first mark group if chart is trellised', () => {
      const marks = addAxesMarks([defaultTrellisGroupMark], {
        ...defaultAxisOptions,
        baseline: true,
        baselineOffset: 0,
        opposingScaleType: 'linear',
        scaleName: 'xLinear',
        usermeta: {},
      });

      expect(marks).toHaveLength(1);
      expect((marks[0] as GroupMark).marks).toEqual([defaultYBaselineMark, defaultXBaselineMark]);
    });

    test('should add baseline to first mark group if chart is trellised and baseline offset is not 0', () => {
      const marks = addAxesMarks([defaultTrellisGroupMark], {
        ...defaultAxisOptions,
        baseline: true,
        baselineOffset: 10,
        opposingScaleType: 'linear',
        scaleName: 'xLinear',
        usermeta: {},
      });

      expect(marks).toHaveLength(1);
      expect((marks[0] as GroupMark).marks).toEqual([
        {
          ...defaultXBaselineMark,
          encode: {
            update: {
              ...defaultXBaselineMark.encode?.update,
              y: {
                ...defaultXBaselineMark.encode?.update?.y,
                value: 10,
              },
            },
          },
        },
        defaultYBaselineMark,
      ]);
    });

    test('should add an axis to the trellis group if the chart is trellised and opposing scale type is not linear', () => {
      const marks = addAxesMarks([defaultTrellisGroupMark], {
        ...defaultAxisOptions,
        baseline: true,
        baselineOffset: 0,
        opposingScaleType: 'band',
        scaleName: 'xLinear',
        usermeta: {},
      }) as GroupMark[];

      expect(marks[0].axes).toHaveLength(1);
    });

    test('should show trellis axis labels if chart orientation matches trellis orientation', () => {
      const marks = addAxesMarks([defaultTrellisGroupMark], {
        ...defaultAxisOptions,
        position: 'bottom',
        baseline: true,
        baselineOffset: 0,
        opposingScaleType: 'band',
        scaleName: 'xLinear',
        usermeta: {},
      }) as GroupMark[];

      expect(marks[0].axes?.[0].labels).toBe(true);
    });

    test('should not show trellis axis labels if chart orientation does not match trellis orientation', () => {
      const marks = addAxesMarks([defaultTrellisGroupMark], {
        ...defaultAxisOptions,
        position: 'left',
        baseline: true,
        baselineOffset: 0,
        opposingScaleType: 'band',
        scaleName: 'yLinear',
        usermeta: {},
      }) as GroupMark[];

      expect(marks[0].axes?.[0].labels).toBe(false);
    });

    describe('dualMetricAxis', () => {
      test('dualMetricAxis should be treated as false in trellis', () => {
        const marks = addAxesMarks([defaultTrellisGroupMark], {
          ...defaultAxisOptions,
          dualMetricAxis: true,
          position: 'left',
          baseline: true,
          baselineOffset: 0,
          opposingScaleType: 'band',
          scaleName: 'yLinear',
          usermeta: {},
        }) as GroupMark[];

        const labelFillEncoding = marks[0].axes?.[0].encode?.labels?.enter?.fill as ProductionRule<ColorValueRef>[];
        const labelFillOpacity = marks[0].axes?.[0].encode?.labels?.update
          ?.fillOpacity as ProductionRule<NumericValueRef>[];
        const titleFillUpdate = marks[0].axes?.[0].encode?.title?.update?.fill as ProductionRule<ColorValueRef>[];
        const titleFillOpacity = marks[0].axes?.[0].encode?.title?.update
          ?.fillOpacity as ProductionRule<NumericValueRef>[];

        function getDualMetricAxisFillEncoding(encoding: ProductionRule<ColorValueRef>[]) {
          return encoding?.find(
            (rule) =>
              'test' in rule &&
              rule.test === `isValid(${MOUSE_OVER_SERIES}) && ${MOUSE_OVER_SERIES} !== ${LAST_RSC_SERIES_ID}`
          );
        }
        function getDualMetricAxisFillOpacityEncoding(encoding: ProductionRule<NumericValueRef>[]) {
          return encoding?.find(
            (rule) =>
              'test' in rule &&
              rule.test === `isValid(${MOUSE_OVER_SERIES}) && ${MOUSE_OVER_SERIES} !== ${LAST_RSC_SERIES_ID}`
          );
        }

        expect(getDualMetricAxisFillEncoding(labelFillEncoding)).toBeUndefined();
        expect(getDualMetricAxisFillOpacityEncoding(labelFillOpacity)).toBeUndefined();
        expect(getDualMetricAxisFillEncoding(titleFillUpdate)).toBeUndefined();
        expect(getDualMetricAxisFillOpacityEncoding(titleFillOpacity)).toBeUndefined();
      });
    });
  });

  describe('addAxisSignals()', () => {
    test('should not add any signals if there labels and subLabels are undefined', () => {
      const signals = addAxisSignals([], defaultAxisOptions);
      expect(signals).toHaveLength(0);
    });

    test('should add labels signal if labels exist', () => {
      const signals = addAxisSignals([], {
        ...defaultAxisOptions,
        labels: [1, 'test', { value: 2, label: 'two', align: 'start' }],
      });
      expect(signals).toHaveLength(1);
      expect(signals[0]).toHaveProperty('name', 'axis0_labels');
      expect(signals[0]).toHaveProperty('value', [{ value: 2, label: 'two', align: 'left', baseline: 'top' }]);
    });

    test('should add subLabels if subLabels exist', () => {
      const signals = addAxisSignals([], {
        ...defaultAxisOptions,
        subLabels: [
          { value: 1, subLabel: 'one', align: 'start' },
          { value: 2, subLabel: 'two', align: 'end' },
        ],
      });
      expect(signals).toHaveLength(1);
      expect(signals[0]).toHaveProperty('name', 'axis0_subLabels');
      expect(signals[0]).toHaveProperty('value', [
        { value: 1, subLabel: 'one', align: 'left', baseline: 'top' },
        { value: 2, subLabel: 'two', align: 'right', baseline: 'top' },
      ]);
    });
  });

  describe('getLabelSignalValue()', () => {
    test('should filter out any labels that are not objects', () => {
      const labelValue = getLabelSignalValue(
        [1, 'test', { value: 2, label: 'two', align: 'start' }],
        'bottom',
        'horizontal'
      );
      expect(labelValue).toHaveLength(1);
      expect(labelValue[0]).toEqual({ value: 2, label: 'two', align: 'left', baseline: 'top' });
    });
  });
});
