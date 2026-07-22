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
import { Data } from 'vega';

import {
  BACKGROUND_COLOR,
  CHART_SIZE_POINT_SIZE,
  COLOR_SCALE,
  DEFAULT_COLOR,
  DEFAULT_METRIC,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FILTERED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  HOVER_ANIM_LAST_CHANGE_DATA,
  HOVER_TARGETS,
  HOVER_TIMER,
  LINEAR_PADDING,
  MARK_ID,
  SERIES_ID,
  TABLE,
  TRENDLINE_VALUE,
} from '@spectrum-charts/constants';

import * as signalSpecBuilder from '../signal/signalSpecBuilder';
import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { ScSpec } from '../types';
import { addData, addLine, addLineMarks, addSignals, getAlternateSegmentData, setScales } from './lineSpecBuilder';
import { defaultLineOptions } from './lineTestUtils';

const startingSpec: ScSpec = initializeSpec({
  scales: [{ name: COLOR_SCALE, type: 'ordinal' }],
});

const defaultSpec = initializeSpec({
  data: [
    {
      name: TABLE,
      transform: [
        { as: MARK_ID, type: 'identifier' },
        {
          type: 'formula',
          expr: `toDate(datum[\"${DEFAULT_TIME_DIMENSION}\"])`,
          as: DEFAULT_TIME_DIMENSION,
        },
        {
          as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
          field: DEFAULT_TIME_DIMENSION,
          type: 'timeunit',
          units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'],
        },
      ],
      values: [],
    },
    {
      name: FILTERED_TABLE,
      source: TABLE,
    },
  ],
  marks: [
    {
      from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
      marks: [
        {
          encode: {
            enter: {
              stroke: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
              strokeCap: { value: 'round' },
              strokeDash: { value: [] },
              strokeOpacity: DEFAULT_OPACITY_RULE,
              y: [{ field: 'value', scale: 'yLinear' }],
            },
            update: {
              x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
              opacity: [DEFAULT_OPACITY_RULE],
              strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
            },
          },
          from: { data: 'line0_facet' },
          name: 'line0',
          description: 'line0',
          type: 'line',
          interactive: false,
        },
      ],
      name: 'line0_group',
      type: 'group',
    },
  ],
  scales: [
    { domain: { data: TABLE, fields: [DEFAULT_COLOR] }, name: COLOR_SCALE, type: 'ordinal' },
    {
      domain: { data: FILTERED_TABLE, fields: [DEFAULT_TRANSFORMED_TIME_DIMENSION] },
      name: 'xTime',
      padding: LINEAR_PADDING,
      range: 'width',
      type: 'time',
    },
    {
      domain: { data: FILTERED_TABLE, fields: ['value'] },
      name: 'yLinear',
      nice: true,
      range: 'height',
      type: 'linear',
      zero: true,
    },
  ],
  signals: [],
  usermeta: { interactiveMarks: [] },
});

const defaultLinearScale = {
  domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
  name: 'xLinear',
  padding: LINEAR_PADDING,
  range: 'width',
  type: 'linear',
};

const defaultPointScale = {
  domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
  name: 'xPoint',
  paddingOuter: 0.5,
  range: 'width',
  type: 'point',
};

const line0_groupMark = {
  name: 'line0_group',
  type: 'group',
  from: {
    facet: {
      name: 'line0_facet',
      data: FILTERED_TABLE,
      groupby: ['series'],
    },
  },
  marks: [
    {
      name: 'line0',
      description: 'line0',
      type: 'line',
      from: {
        data: 'line0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          y: [{ scale: 'yLinear', field: 'value' }],
          stroke: { scale: COLOR_SCALE, field: 'series' },
          strokeCap: { value: 'round' },
          strokeDash: { value: [] },
          strokeOpacity: DEFAULT_OPACITY_RULE,
        },
        update: {
          x: { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION },
          opacity: [DEFAULT_OPACITY_RULE],
          strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
        },
      },
    },
  ],
};

const metricRangeGroupMark = {
  name: 'line0MetricRange0_group',
  type: 'group',
  clip: true,
  from: {
    facet: {
      name: 'line0MetricRange0_facet',
      data: FILTERED_TABLE,
      groupby: ['series'],
    },
  },
  marks: [
    {
      name: 'line0MetricRange0_line',
      description: 'line0MetricRange0_line',
      type: 'line',
      from: {
        data: 'line0MetricRange0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          y: [
            {
              scale: 'yLinear',
              field: 'value',
            },
          ],
          stroke: {
            scale: COLOR_SCALE,
            field: 'series',
          },
          strokeCap: { value: 'round' },
          strokeDash: {
            value: [7, 4],
          },
          strokeOpacity: DEFAULT_OPACITY_RULE,
        },
        update: {
          x: {
            scale: 'xTime',
            field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
          },
          opacity: [DEFAULT_OPACITY_RULE],
          strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
        },
      },
    },
    {
      name: 'line0MetricRange0_area',
      description: 'line0MetricRange0_area',
      type: 'area',
      from: {
        data: 'line0MetricRange0_facet',
      },
      interactive: false,
      encode: {
        enter: {
          y: {
            field: 'start',
            scale: 'yLinear',
          },
          y2: {
            field: 'end',
            scale: 'yLinear',
          },
          fill: {
            scale: COLOR_SCALE,
            field: 'series',
          },
          tooltip: undefined,
        },
        update: {
          cursor: undefined,
          x: {
            scale: 'xTime',
            field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
          },
          fillOpacity: { value: 0.2 },
          opacity: [DEFAULT_OPACITY_RULE],
        },
      },
    },
  ],
};

const metricRangeMarks = [line0_groupMark, metricRangeGroupMark];

const staticPointMark = {
  name: 'line0_staticPoints',
  description: 'line0_staticPoints',
  type: 'symbol',
  from: {
    data: 'line0_staticPointData',
  },
  interactive: false,
  encode: {
    enter: {
      y: [
        {
          scale: 'yLinear',
          field: 'value',
        },
      ],
      size: {
        signal: CHART_SIZE_POINT_SIZE,
      },
      fill: {
        scale: COLOR_SCALE,
        field: 'series',
      },
    },
    update: {
      x: {
        scale: 'xTime',
        field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
      },
      opacity: [{ value: 1 }],
    },
  },
};

const staticPointBackgroundMark = {
  name: 'line0_staticPointBackground',
  description: 'line0_staticPointBackground',
  type: 'symbol',
  from: { data: 'line0_staticPointData' },
  interactive: false,
  encode: {
    enter: {
      y: [{ scale: 'yLinear', field: 'value' }],
      size: { signal: CHART_SIZE_POINT_SIZE },
      fill: { signal: BACKGROUND_COLOR },
      stroke: { signal: BACKGROUND_COLOR },
    },
    update: {
      x: { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION },
    },
  },
};

const metricRangeWithDisplayPointMarks = [
  line0_groupMark,
  staticPointBackgroundMark,
  staticPointMark,
  metricRangeGroupMark,
];

const displayPointMarks = [line0_groupMark, staticPointBackgroundMark, staticPointMark];

describe('lineSpecBuilder', () => {
  describe('addLine()', () => {
    test('should add line', () => {
      expect(addLine(startingSpec, { idKey: MARK_ID, color: DEFAULT_COLOR, markType: 'line' })).toStrictEqual(
        defaultSpec
      );
    });

    describe('isAnimate gate', () => {
      test('an interactive line resolves isAnimate true, registers usermeta.animatedMarks, and creates hover-animation data', () => {
        const spec = addLine(startingSpec, {
          idKey: MARK_ID,
          color: DEFAULT_COLOR,
          markType: 'line',
          chartInspects: [{}],
        });
        expect(spec.usermeta?.animatedMarks).toStrictEqual(['line0']);
        expect(spec.data?.some((d) => d.name === 'line0_hoverTargetData')).toBe(true);
      });

      test('a non-interactive line does not animate', () => {
        const spec = addLine(startingSpec, { idKey: MARK_ID, color: DEFAULT_COLOR, markType: 'line' });
        expect(spec.usermeta?.animatedMarks ?? []).toStrictEqual([]);
        expect(spec.data?.some((d) => d.name === 'line0_hoverTargetData')).toBe(false);
      });

      test('the chart-level animations: false prop disables animation even for an interactive line', () => {
        const spec = addLine(startingSpec, {
          idKey: MARK_ID,
          color: DEFAULT_COLOR,
          markType: 'line',
          chartInspects: [{}],
          animations: false,
        });
        expect(spec.usermeta?.animatedMarks ?? []).toStrictEqual([]);
        expect(spec.data?.some((d) => d.name === 'line0_hoverTargetData')).toBe(false);
      });

      test('registers only the line name in animatedMarks, never sub-mark names, even with static points and direct labels', () => {
        // getLegendOpacity (legendUtils.ts) iterates animatedMarks and builds a data() reference for
        // each name — registering a sub-mark name here would make it reference a _hoverFractionData
        // source that was never created. Static points/direct labels share the line's own fraction
        // data instead of getting their own, so animatedMarks must stay line-name-only.
        const spec = addLine(startingSpec, {
          idKey: MARK_ID,
          color: DEFAULT_COLOR,
          markType: 'line',
          chartInspects: [{}],
          staticPoint: 'staticPoint',
          lineDirectLabels: [{}],
        });
        expect(spec.usermeta?.animatedMarks).toStrictEqual(['line0']);
      });
    });
  });

  describe('addData()', () => {
    let baseData: Data[];

    beforeEach(() => {
      baseData = initializeSpec().data ?? [];
    });

    test('basic', () => {
      expect(addData(baseData, defaultLineOptions)).toStrictEqual(defaultSpec.data);
    });

    test('scaleTypes "point" and "linear" should return the original data', () => {
      expect(addData(baseData, { ...defaultLineOptions, scaleType: 'point' })).toEqual(baseData);
      expect(addData(baseData, { ...defaultLineOptions, scaleType: 'linear' })).toEqual(baseData);
    });

    test('with dimensionHover adds groupId formula transform to table', () => {
      const resultData = addData(baseData, { ...defaultLineOptions, dimensionHover: true });
      const tableData = resultData.find((d) => d.name === TABLE);
      expect(tableData?.transform).toContainEqual({
        type: 'formula',
        as: `line0_${GROUP_ID}`,
        expr: `datum.${DEFAULT_TIME_DIMENSION}`,
      });
    });

    test('with dimensionHover and a chartInspect that groups by dimension does not add groupId transform', () => {
      const resultData = addData(baseData, {
        ...defaultLineOptions,
        dimensionHover: true,
        chartInspects: [{ highlightBy: 'dimension' }],
      });
      const tableData = resultData.find((d) => d.name === TABLE);
      expect(tableData?.transform?.some((t) => 'as' in t && t.as === `line0_${GROUP_ID}`)).toBe(false);
    });

    test('should add trendline transform', () => {
      expect(
        addData(baseData, {
          ...defaultLineOptions,
          trendlines: [{ method: 'average' }],
        })[2].transform
      ).toStrictEqual([
        { type: 'filter', expr: `isValid(datum["${DEFAULT_METRIC}"])` },
        {
          as: [TRENDLINE_VALUE, `${DEFAULT_TIME_DIMENSION}Min`, `${DEFAULT_TIME_DIMENSION}Max`],
          fields: [DEFAULT_METRIC, DEFAULT_TIME_DIMENSION, DEFAULT_TIME_DIMENSION],
          groupby: [DEFAULT_COLOR],
          ops: ['mean', 'min', 'max'],
          type: 'aggregate',
        },
        { as: SERIES_ID, expr: `datum.${DEFAULT_COLOR}`, type: 'formula' },
      ]);
    });

    test('should not do anything for movingAverage trendline since it is not supported yet', () => {
      expect(
        addData(baseData, {
          ...defaultLineOptions,
          trendlines: [{ method: 'movingAverage-7' }],
        })[0].transform
      ).toHaveLength(3);
    });

    test('adds direct label data when lineDirectLabels provided', () => {
      const resultData = addData(baseData, {
        ...defaultLineOptions,
        lineDirectLabels: [{ value: 'last' }],
      });
      const labelData = resultData.find((d) => d.name === 'line0DirectLabel0_data');
      expect(labelData).toBeDefined();
      expect(labelData).toHaveProperty('source', FILTERED_TABLE);
    });

    test('adds multiple direct label data sources', () => {
      const resultData = addData(baseData, {
        ...defaultLineOptions,
        lineDirectLabels: [{ value: 'last' }, { value: 'series' }],
      });
      expect(resultData.find((d) => d.name === 'line0DirectLabel0_data')).toBeDefined();
      expect(resultData.find((d) => d.name === 'line0DirectLabel1_data')).toBeDefined();
    });

    test('adds point data if displayPointMark is not undefined', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        staticPoint: 'staticPoint',
      });
      expect(resultData.find((data) => data.name === 'line0_staticPointData')).toStrictEqual({
        name: 'line0_staticPointData',
        source: FILTERED_TABLE,
        transform: [{ expr: 'datum.staticPoint === true', type: 'filter' }],
      });
    });

    test('with alternateSegmentKey adds formula to table and 3 segment data sources', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        alternateSegmentKey: 'isEstimated',
      });
      const tableData = resultData.find((d) => d.name === TABLE);
      expect(
        tableData?.transform?.some((t) => t.type === 'formula' && (t as { as: string }).as === 'line0_alternateFlag')
      ).toBe(true);

      const expectedSegmentData = getAlternateSegmentData('line0', `${DEFAULT_TIME_DIMENSION}0`);
      expect(resultData.find((d) => d.name === 'line0_segmented')).toStrictEqual(expectedSegmentData[0]);
      expect(resultData.find((d) => d.name === 'line0_bridge')).toStrictEqual(expectedSegmentData[1]);
      expect(resultData.find((d) => d.name === 'line0_with_bridges')).toStrictEqual(expectedSegmentData[2]);
    });

    test('without alternateSegmentKey does not add segment data sources', () => {
      const resultData = addData(baseData ?? [], defaultLineOptions);
      expect(resultData.find((d) => d.name === 'line0_segmented')).toBeUndefined();
      expect(resultData.find((d) => d.name === 'line0_bridge')).toBeUndefined();
      expect(resultData.find((d) => d.name === 'line0_with_bridges')).toBeUndefined();
    });

    test('with forecasts adds alternateFlag and effectiveValue transforms to table and 3 segment data sources', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const tableData = resultData.find((d) => d.name === TABLE);
      expect(
        tableData?.transform?.some((t) => t.type === 'formula' && (t as { as: string }).as === 'line0_alternateFlag')
      ).toBe(true);
      expect(
        tableData?.transform?.some((t) => t.type === 'formula' && (t as { as: string }).as === 'line0_effectiveValue')
      ).toBe(true);

      const expectedSegmentData = getAlternateSegmentData('line0', `${DEFAULT_TIME_DIMENSION}0`);
      expect(resultData.find((d) => d.name === 'line0_segmented')).toStrictEqual(expectedSegmentData[0]);
      expect(resultData.find((d) => d.name === 'line0_bridge')).toStrictEqual(expectedSegmentData[1]);
      expect(resultData.find((d) => d.name === 'line0_with_bridges')).toStrictEqual(expectedSegmentData[2]);
    });

    test('with forecasts effectiveValue uses isValid to choose between main metric and forecast metric', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const tableData = resultData.find((d) => d.name === TABLE);
      const effectiveValueTransform = tableData?.transform?.find(
        (t) => t.type === 'formula' && (t as { as: string }).as === 'line0_effectiveValue'
      );
      expect(effectiveValueTransform).toHaveProperty(
        'expr',
        "isValid(datum['value']) ? datum['value'] : datum['forecastValue']"
      );
    });

    test('with forecasts and alternateSegmentKey set, forecasts are skipped', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        alternateSegmentKey: 'isEstimated',
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const tableData = resultData.find((d) => d.name === TABLE);
      expect(
        tableData?.transform?.some((t) => t.type === 'formula' && (t as { as: string }).as === 'line0_effectiveValue')
      ).toBe(false);
    });

    test('with primarySeries adds primarySeriesFacetData when no alternateSegmentKey or forecasts', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        primarySeries: 3,
      });
      const facetData = resultData.find((d) => d.name === 'line0_primarySeriesFacetData');
      expect(facetData).toBeDefined();
      expect(facetData).toHaveProperty('source', FILTERED_TABLE);
    });

    test('does not add primarySeriesFacetData when alternateSegmentKey is set', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        primarySeries: 3,
        alternateSegmentKey: 'isEstimated',
      });
      expect(resultData.find((d) => d.name === 'line0_primarySeriesFacetData')).toBeUndefined();
    });

    test('does not add primarySeriesFacetData when forecasts are set', () => {
      const resultData = addData(baseData ?? [], {
        ...defaultLineOptions,
        primarySeries: 3,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      expect(resultData.find((d) => d.name === 'line0_primarySeriesFacetData')).toBeUndefined();
    });

    describe('hover animation', () => {
      test('adds the hover-animation data sources when isAnimate is true', () => {
        const resultData = addData(baseData, {
          ...defaultLineOptions,
          interactiveMarkName: 'line0',
          isAnimate: true,
          seriesIds: ['a', 'b'],
        });
        expect(resultData.find((d) => d.name === 'line0_hoverTargetData')).toBeDefined();
        expect(resultData.find((d) => d.name === 'line0_hoverAnimStateData')).toBeDefined();
        expect(resultData.find((d) => d.name === 'line0_hoverFractionData')).toBeDefined();
        expect(resultData.find((d) => d.name === HOVER_ANIM_LAST_CHANGE_DATA)).toBeDefined();
      });

      test('does not add the hover-animation data sources when isAnimate is false', () => {
        const resultData = addData(baseData, {
          ...defaultLineOptions,
          interactiveMarkName: 'line0',
          isAnimate: false,
        });
        expect(resultData.find((d) => d.name === 'line0_hoverTargetData')).toBeUndefined();
        expect(resultData.find((d) => d.name === HOVER_ANIM_LAST_CHANGE_DATA)).toBeUndefined();
      });
    });
  });

  describe('setScales()', () => {
    test('time', () => {
      expect(setScales(startingSpec.scales ?? [], defaultLineOptions)).toStrictEqual(defaultSpec.scales);
    });

    test('linear', () => {
      expect(
        setScales(startingSpec.scales ?? [], {
          ...defaultLineOptions,
          scaleType: 'linear',
        })
      ).toStrictEqual([defaultSpec.scales?.[0], defaultLinearScale, defaultSpec.scales?.[2]]);
    });

    test('point', () => {
      expect(
        setScales(startingSpec.scales ?? [], {
          ...defaultLineOptions,
          scaleType: 'point',
        })
      ).toStrictEqual([defaultSpec.scales?.[0], defaultPointScale, defaultSpec.scales?.[2]]);
    });

    test('with metric range fields', () => {
      const [metricStart, metricEnd] = ['metricStart', 'metricEnd'];
      const metricRangeMetricScale = {
        ...defaultSpec.scales?.[2],
        domain: {
          ...defaultSpec.scales?.[2].domain,
          fields: ['value', metricStart, metricEnd],
        },
      };
      expect(
        setScales(startingSpec.scales ?? [], {
          ...defaultLineOptions,
          metricRanges: [{ scaleAxisToFit: true, metricEnd, metricStart }],
        })
      ).toStrictEqual([defaultSpec.scales?.[0], defaultSpec.scales?.[1], metricRangeMetricScale]);
    });

    test('with metricAxis adds a named metric scale', () => {
      const scales = setScales(startingSpec.scales ?? [], {
        ...defaultLineOptions,
        metricAxis: 'myAxis',
      });
      const namedScale = scales.find((s) => s.name === 'myAxis');
      expect(namedScale).toBeDefined();
    });

    test('with forecasts uses effectiveValue field for the y-scale domain', () => {
      const scales = setScales(startingSpec.scales ?? [], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const yScale = scales.find((s) => s.name === 'yLinear');
      expect(yScale).toBeDefined();
      expect(yScale?.domain).toHaveProperty('fields');
      const fields = (yScale?.domain as { fields: string[] }).fields;
      expect(fields).toContain('line0_effectiveValue');
      expect(fields).not.toContain('value');
    });
  });

  describe('addLineMarks()', () => {
    test('basic', () => {
      expect(addLineMarks([], defaultLineOptions)).toStrictEqual(defaultSpec.marks);
    });

    test('dashed', () => {
      expect(addLineMarks([], { ...defaultLineOptions, lineType: { value: [8, 8] } })).toStrictEqual([
        {
          from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
          marks: [
            {
              encode: {
                enter: {
                  stroke: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
                  strokeCap: { value: 'round' },
                  strokeOpacity: DEFAULT_OPACITY_RULE,
                  strokeDash: { value: [8, 8] },
                  y: [{ field: 'value', scale: 'yLinear' }],
                },
                update: {
                  x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
                  opacity: [DEFAULT_OPACITY_RULE],
                  strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
                },
              },
              from: { data: 'line0_facet' },
              name: 'line0',
              description: 'line0',
              type: 'line',
              interactive: false,
            },
          ],
          name: 'line0_group',
          type: 'group',
        },
      ]);
    });

    test('with metric range', () => {
      expect(
        addLineMarks([], { ...defaultLineOptions, metricRanges: [{ metricEnd: 'end', metricStart: 'start' }] })
      ).toStrictEqual(metricRangeMarks);
    });

    test('with displayPointMark', () => {
      expect(addLineMarks([], { ...defaultLineOptions, staticPoint: 'staticPoint' })).toStrictEqual(displayPointMarks);
    });

    describe('with annotations', () => {
      test('adds background and foreground annotation marks when staticPoint is set', () => {
        const marks = addLineMarks([], {
          ...defaultLineOptions,
          staticPoint: 'staticPoint',
          linePointAnnotations: [{}],
        });
        // line0_group + line0_staticPointBackground + line0_staticPoints + line0Annotation0_bg + line0Annotation0
        expect(marks).toHaveLength(5);
        expect(marks[3]).toHaveProperty('name', 'line0Annotation0_bg');
        expect(marks[4]).toHaveProperty('name', 'line0Annotation0');
      });

      test('adds background and foreground annotation marks when isSparkline is set', () => {
        const marks = addLineMarks([], {
          ...defaultLineOptions,
          isSparkline: true,
          linePointAnnotations: [{}],
        });
        // line0_group + line0_staticPointBackground + line0_staticPoints + line0Annotation0_bg + line0Annotation0
        expect(marks).toHaveLength(5);
        expect(marks[3]).toHaveProperty('name', 'line0Annotation0_bg');
        expect(marks[4]).toHaveProperty('name', 'line0Annotation0');
      });

      test('does not add annotation marks when neither staticPoint nor isSparkline is set', () => {
        const marks = addLineMarks([], {
          ...defaultLineOptions,
          linePointAnnotations: [{}],
        });
        expect(marks).toHaveLength(1); // line0_group only
        expect(marks.find((m) => m.name?.includes('Annotation'))).toBeUndefined();
      });

      test('does not add annotation marks when linePointAnnotations is empty', () => {
        const marks = addLineMarks([], {
          ...defaultLineOptions,
          staticPoint: 'staticPoint',
          linePointAnnotations: [],
        });
        expect(marks).toStrictEqual(displayPointMarks);
      });

      test('adds two pairs of marks for two annotations', () => {
        const marks = addLineMarks([], {
          ...defaultLineOptions,
          staticPoint: 'staticPoint',
          linePointAnnotations: [{}, {}],
        });
        // line0_group + line0_staticPointBackground + line0_staticPoints + 2×(bg + fg)
        expect(marks).toHaveLength(7);
        expect(marks[3]).toHaveProperty('name', 'line0Annotation0_bg');
        expect(marks[4]).toHaveProperty('name', 'line0Annotation0');
        expect(marks[5]).toHaveProperty('name', 'line0Annotation1_bg');
        expect(marks[6]).toHaveProperty('name', 'line0Annotation1');
      });
    });

    test('with displayPointMark and metric range', () => {
      expect(
        addLineMarks([], {
          ...defaultLineOptions,
          staticPoint: 'staticPoint',
          metricRanges: [{ metricEnd: 'end', metricStart: 'start' }],
        })
      ).toStrictEqual(metricRangeWithDisplayPointMarks);
    });

    test('with onClick should add hover marks', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, hasOnClick: true });

      const voronoiPathMark = marks.at(-1);
      expect(voronoiPathMark?.description).toBe('line0_voronoi');
      expect(voronoiPathMark?.encode?.update?.cursor).toStrictEqual({ value: 'pointer' });

      const voronoiPointsMark = marks.at(-2);
      expect(voronoiPointsMark?.description).toBe('line0_pointsForVoronoi');
    });

    test('with gradient should add gradient area mark before line mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, gradient: true });
      const groupMark = marks[0];
      expect(groupMark.type).toBe('group');

      const innerMarks = (groupMark as { marks: { name: string; type: string }[] }).marks;
      expect(innerMarks).toHaveLength(2);
      expect(innerMarks[0].name).toBe('line0_gradient');
      expect(innerMarks[0].type).toBe('area');
      expect(innerMarks[1].name).toBe('line0');
      expect(innerMarks[1].type).toBe('line');
    });

    test('without gradient should not add gradient area mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, gradient: false });
      const groupMark = marks[0];
      const innerMarks = (groupMark as { marks: { name: string }[] }).marks;
      expect(innerMarks).toHaveLength(1);
      expect(innerMarks[0].name).toBe('line0');
    });

    test('adds direct label marks when lineDirectLabels provided', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        lineDirectLabels: [{ value: 'last' }],
      });
      const allMarks = marks.flatMap((m) => ('marks' in m ? [m, ...(m.marks ?? [])] : [m]));
      const bgMark = allMarks.find((m) => m.name === 'line0DirectLabel0_bg');
      const fgMark = allMarks.find((m) => m.name === 'line0DirectLabel0');
      expect(bgMark).toBeDefined();
      expect(bgMark?.type).toBe('text');
      expect(fgMark).toBeDefined();
      expect(fgMark?.type).toBe('text');
    });

    test('adds multiple direct label mark pairs', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        lineDirectLabels: [{ value: 'last' }, { value: 'series' }],
      });
      const allMarks = marks.flatMap((m) => ('marks' in m ? [m, ...(m.marks ?? [])] : [m]));
      expect(allMarks.find((m) => m.name === 'line0DirectLabel0_bg')).toBeDefined();
      expect(allMarks.find((m) => m.name === 'line0DirectLabel0')).toBeDefined();
      expect(allMarks.find((m) => m.name === 'line0DirectLabel1_bg')).toBeDefined();
      expect(allMarks.find((m) => m.name === 'line0DirectLabel1')).toBeDefined();
    });

    test('adds highlight overlay group when hasHighlightState and lineDirectLabels provided', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        interactiveMarkName: 'line0',
        chartInspects: [{}],
        lineDirectLabels: [{ value: 'last' }],
      });
      const overlayGroup = marks.find((m) => m.name === 'line0_highlightOverlay_group');
      expect(overlayGroup).toBeDefined();
      expect(overlayGroup?.type).toBe('group');
    });

    test('does not add highlight overlay group when no highlight state', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        lineDirectLabels: [{ value: 'last' }],
      });
      const overlayGroup = marks.find((m) => m.name === 'line0_highlightOverlay_group');
      expect(overlayGroup).toBeUndefined();
    });

    test('does not add highlight overlay group when no lineDirectLabels', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        interactiveMarkName: 'line0',
        chartInspects: [{}],
        lineDirectLabels: [],
      });
      const overlayGroup = marks.find((m) => m.name === 'line0_highlightOverlay_group');
      expect(overlayGroup).toBeUndefined();
    });

    test('fg label marks are added as top-level marks after the overlay group', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        interactiveMarkName: 'line0',
        chartInspects: [{}],
        lineDirectLabels: [{ value: 'last' }],
      });
      const overlayGroupIndex = marks.findIndex((m) => m.name === 'line0_highlightOverlay_group');
      const bgFgIndex = marks.findIndex((m) => m.name === 'line0DirectLabel0_bg_fg');
      const fgIndex = marks.findIndex((m) => m.name === 'line0DirectLabel0_fg');
      expect(bgFgIndex).toBeGreaterThan(overlayGroupIndex);
      expect(fgIndex).toBeGreaterThan(overlayGroupIndex);
    });

    test('fg label marks have highlighted test opacity', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        interactiveMarkName: 'line0',
        chartInspects: [{}],
        lineDirectLabels: [{ value: 'last' }],
      });
      const fgLabelMark = marks.find((m) => m.name === 'line0DirectLabel0_fg') as {
        encode: { update: { opacity: { value: number }[] } };
      };
      expect(fgLabelMark).toBeDefined();
      const opacity = fgLabelMark.encode.update.opacity;
      expect(Array.isArray(opacity)).toBe(true);
      expect(opacity.at(-1)).toEqual({ value: 0 });
    });

    test('with gradient and multi-series color should still add gradient mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, gradient: true, color: 'series' });
      const innerMarks = (marks[0] as { marks: { name: string; type: string }[] }).marks;
      expect(innerMarks).toHaveLength(2);
      expect(innerMarks[0].name).toBe('line0_gradient');
      expect(innerMarks[0].type).toBe('area');
    });

    test('with interpolate, should add interpolate to line mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, interpolate: 'basis' });
      const innerMarks = (
        marks[0] as { marks: { type: string; encode: { update: { interpolate: { value: string } } } }[] }
      ).marks;
      expect(innerMarks).toHaveLength(1);
      expect(innerMarks[0].type).toBe('line');
      expect(innerMarks[0].encode?.update?.interpolate).toEqual({ value: 'basis' });
    });

    test('with gradient and interpolate, should add interpolate to gradient mark and line mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, interpolate: 'basis', gradient: true });
      const innerMarks = (
        marks[0] as { marks: { type: string; encode: { update: { interpolate: { value: string } } } }[] }
      ).marks;
      expect(innerMarks).toHaveLength(2);
      expect(innerMarks[0].type).toBe('area');
      expect(innerMarks[0].encode?.update?.interpolate).toEqual({ value: 'basis' });
      expect(innerMarks[1].type).toBe('line');
      expect(innerMarks[1].encode?.update?.interpolate).toEqual({ value: 'basis' });
    });

    test('without interpolate, should not add interpolate to line mark', () => {
      const marks = addLineMarks([], { ...defaultLineOptions, interpolate: undefined });
      const innerMarks = (
        marks[0] as { marks: { type: string; encode: { update: { interpolate: { value: string } } } }[] }
      ).marks;
      expect(innerMarks).toHaveLength(1);
      expect(innerMarks[0].type).toBe('line');
      expect(innerMarks[0].encode?.update?.interpolate).toBeUndefined();
    });

    test('with alternateSegmentKey uses line0_with_bridges as facet data', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        alternateSegmentKey: 'isEstimated',
        alternateSegmentLineType: 'dotted',
      });
      const groupMark = marks[0] as { from: { facet: { data: string; groupby: string[] } } };
      expect(groupMark.from.facet.data).toBe('line0_with_bridges');
    });

    test('with alternateSegmentKey extends facet groupby with segmentId', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        alternateSegmentKey: 'isEstimated',
        alternateSegmentLineType: 'dotted',
      });
      const groupMark = marks[0] as { from: { facet: { groupby: string[] } } };
      expect(groupMark.from.facet.groupby).toContain('line0_segmentId');
    });

    test('without alternateSegmentKey uses filteredTable as facet data', () => {
      const marks = addLineMarks([], defaultLineOptions);
      const groupMark = marks[0] as { from: { facet: { data: string } } };
      expect(groupMark.from.facet.data).toBe(FILTERED_TABLE);
    });

    test('with alternateSegmentKey, line mark strokeDash uses a signal', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        alternateSegmentKey: 'isEstimated',
        alternateSegmentLineType: 'dotted',
      });
      const groupMark = marks[0] as { marks: { encode: { enter: { strokeDash: unknown } } }[] };
      const strokeDash = groupMark.marks[0].encode.enter.strokeDash;
      expect(strokeDash).toHaveProperty('signal');
    });

    test('with forecasts uses line0_with_bridges as facet data', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const groupMark = marks.find((m) => m.name === 'line0_group') as { from: { facet: { data: string } } };
      expect(groupMark?.from?.facet?.data).toBe('line0_with_bridges');
    });

    test('with forecasts extends facet groupby with segmentId', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const groupMark = marks.find((m) => m.name === 'line0_group') as { from: { facet: { groupby: string[] } } };
      expect(groupMark?.from?.facet?.groupby).toContain('line0_segmentId');
    });

    test('with forecasts pushes boundary rule before the line group', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const boundaryIndex = marks.findIndex((m) => m.name === 'line0_forecast0_boundary');
      const groupIndex = marks.findIndex((m) => m.name === 'line0_group');
      expect(boundaryIndex).toBeGreaterThanOrEqual(0);
      expect(boundaryIndex).toBeLessThan(groupIndex);
    });

    test('with forecasts pushes label after the line group', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const labelIndex = marks.findIndex((m) => m.name === 'line0_forecast0_label');
      const groupIndex = marks.findIndex((m) => m.name === 'line0_group');
      expect(labelIndex).toBeGreaterThan(groupIndex);
    });

    test('with forecasts line mark strokeDash uses a signal (dotted for forecast)', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const groupMark = marks.find((m) => m.name === 'line0_group') as {
        marks: { encode: { enter: { strokeDash: unknown } } }[];
      };
      expect(groupMark?.marks?.[0]?.encode?.enter?.strokeDash).toHaveProperty('signal');
    });

    test('with forecasts line mark y-encoding uses effectiveValue field', () => {
      const marks = addLineMarks([], {
        ...defaultLineOptions,
        forecasts: [{ metric: 'forecastValue', start: 1725148800000 }],
      });
      const groupMark = marks.find((m) => m.name === 'line0_group') as {
        marks: { encode: { enter: { y: { field: string }[] } } }[];
      };
      const yEncoding = groupMark?.marks?.[0]?.encode?.enter?.y;
      expect(yEncoding).toBeDefined();
      expect(Array.isArray(yEncoding)).toBe(true);
      expect(yEncoding?.[0]).toHaveProperty('field', 'line0_effectiveValue');
    });
  });

  describe('addSignals()', () => {
    test('on children', () => {
      expect(addSignals([], defaultLineOptions)).toStrictEqual([]);
    });

    test('does not add selected series if it already exists', () => {
      const hasSignalByNameSpy = jest.spyOn(signalSpecBuilder, 'hasSignalByName');
      expect(
        addSignals(
          [
            {
              name: 'line0_selectedSeries',
              value: null,
            },
          ],
          defaultLineOptions
        )
      ).toStrictEqual([
        {
          name: 'line0_selectedSeries',
          value: null,
        },
      ]);

      expect(hasSignalByNameSpy).not.toHaveBeenCalled();
    });

    test('hover signals with metric range', () => {
      const signals = addSignals(defaultSignals, {
        ...defaultLineOptions,
        metricRanges: [{ metricEnd: 'end', metricStart: 'start', displayOnHover: true }],
      });
      expect(signals).toHaveLength(defaultSignals.length + 1);
      expect(signals.at(-1)).toHaveProperty('name', `${defaultLineOptions.name}_${HOVERED_ITEM}`);
      expect(signals.at(-1)?.on).toHaveLength(2);
    });

    test('adds hover signals when displayPointMark is not undefined', () => {
      expect(addSignals([], { ...defaultLineOptions, staticPoint: 'staticPoint' })).toStrictEqual([]);
    });

    test('adds hover signals with metric range when displayPointMark is not undefined', () => {
      const signals = addSignals(defaultSignals, {
        ...defaultLineOptions,
        staticPoint: 'staticPoint',
        metricRanges: [{ metricEnd: 'end', metricStart: 'start', displayOnHover: true }],
      });
      expect(signals).toHaveLength(defaultSignals.length + 1);
      expect(signals.at(-1)).toHaveProperty('name', `${defaultLineOptions.name}_${HOVERED_ITEM}`);
      expect(signals.at(-1)?.on).toHaveLength(2);
    });

    test('hover signals with interactionMode item', () => {
      const signals = addSignals(defaultSignals, {
        ...defaultLineOptions,
        interactionMode: 'item',
        chartInspects: [{}],
      });
      expect(signals).toHaveLength(defaultSignals.length + 1);
      expect(signals.at(-1)).toHaveProperty('name', `${defaultLineOptions.name}_${HOVERED_ITEM}`);
      expect(signals.at(-1)?.on).toHaveLength(8);
    });

    describe('hover animation', () => {
      test('adds the hover-animation engine signals (shared timer + per-mark targets) when isAnimate is true', () => {
        const signals = addSignals([], { ...defaultLineOptions, isAnimate: true });
        expect(signals.some((s) => s.name === HOVER_TIMER)).toBe(true);
        expect(signals.some((s) => s.name === `line0_${HOVER_TARGETS}`)).toBe(true);
      });

      test('does not add the hover-animation engine signals when isAnimate is false', () => {
        const signals = addSignals([], { ...defaultLineOptions, isAnimate: false });
        expect(signals.some((s) => s.name === HOVER_TIMER)).toBe(false);
      });
    });
  });
});
