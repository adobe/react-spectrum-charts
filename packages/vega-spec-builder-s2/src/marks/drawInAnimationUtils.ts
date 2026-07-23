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
import { produce } from 'immer';
import { Data, NumericValueRef, ProductionRule, Signal, SourceData, Transforms } from 'vega';

import {
  ANIMATION_THROTTLE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DRAW_IN_ANIM_CUTOFF,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  DRAW_IN_ANIMATION_DURATION_MS,
  DRAW_IN_DOMAIN_MAX,
  DRAW_IN_DOMAIN_MIN,
  DRAW_IN_LERP_DATA,
  DRAW_IN_NEXT_CATEGORY_FIELD,
  DRAW_IN_NEXT_DIM_FIELD,
  DRAW_IN_NEXT_METRIC_FIELD,
  DRAW_IN_POINT_INDEX_DATA,
  DRAW_IN_POINT_INDEX_FIELD,
  DRAW_IN_PREV_DATA,
  DRAW_IN_START,
  DRAW_IN_TIME_MS_FIELD,
  DRAW_IN_TIP_DATA,
  DRAW_IN_TIP_FLAG,
  FILTERED_TABLE,
  LAST_RSC_SERIES_ID,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { isDualMetricAxis, LineMarkOptions } from '../line/lineUtils';
import { getScaleName } from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { hasSignalByName } from '../signal/signalSpecBuilder';
import { LineSpecOptions, ScaleType } from '../types';

/**
 * The field used to compare rows against the animation cutoff. Time scales need a numeric-ms field
 * (`addLineDrawInTimeMsTransform`) since Vega's time domain is Date-typed; point scales need an
 * ordinal index (`getLineDrawInPointIndexData`) since category values aren't orderable; linear
 * scales use the dimension field directly.
 */
export const getLineDrawInSortField = (scaleType: ScaleType, dimension: string, name: string): string => {
  if (scaleType === 'time') return DRAW_IN_TIME_MS_FIELD;
  if (scaleType === 'point') return `${name}_${DRAW_IN_POINT_INDEX_FIELD}`;
  return dimension;
};

/**
 * The data source draw-in should read from for a given line: the derived per-name indexed source
 * for point scales (`getLineDrawInPointIndexData`), or `filteredTable` for everything else.
 */
export const getLineDrawInDataSourceName = ({ name, scaleType }: LineSpecOptions): string =>
  scaleType === 'point' ? `${name}_${DRAW_IN_POINT_INDEX_DATA}` : FILTERED_TABLE;

/**
 * Point-scale-only: derived source adding each row's ordinal index within the x scale's domain.
 * Point-scale category values aren't numerically orderable, so this index is the numeric proxy
 * draw-in's cutoff/tween math compares against.
 */
export const getLineDrawInPointIndexData = (options: LineSpecOptions): SourceData => {
  const { dimension, name, scaleType } = options;
  const scaleName = getScaleName('x', scaleType);
  return {
    name: `${name}_${DRAW_IN_POINT_INDEX_DATA}`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'formula',
        as: `${name}_${DRAW_IN_POINT_INDEX_FIELD}`,
        expr: `indexof(domain('${scaleName}'), datum.${dimension})`,
      },
    ],
  };
};

/**
 * Adds the numeric-ms field time-scale draw-in compares against, since Vega's time domain is
 * Date-typed and cutoff/tween math needs raw numbers. Only relevant for 'time' scales.
 */
export const addLineDrawInTimeMsTransform = produce<Transforms[], [string]>((transforms, dimension) => {
  const alreadyAdded = transforms.some(
    (transform) => transform.type === 'formula' && transform.as === DRAW_IN_TIME_MS_FIELD
  );
  if (alreadyAdded) return;
  transforms.push({
    type: 'formula',
    expr: `toNumber(datum.${dimension})`,
    as: DRAW_IN_TIME_MS_FIELD,
  });
});

/**
 * Adds a lead-window transform giving each row a pointer to its next point's sort/metric value —
 * used to find and animate the row currently being drawn toward (`getLineDrawInData`). Point scales
 * also get the next point's real category value, since their sort field is an ordinal index that
 * isn't valid for an x-scale lookup.
 */
export const addLineDrawInLeadTransform = (sourceData: Data, options: LineSpecOptions): void => {
  const { dimension, metric, name, scaleType } = options;
  const sortField = getLineDrawInSortField(scaleType, dimension, name);
  const fields = scaleType === 'point' ? [sortField, dimension, metric] : [sortField, metric];
  const asFields =
    scaleType === 'point'
      ? [`${name}_${DRAW_IN_NEXT_DIM_FIELD}`, `${name}_${DRAW_IN_NEXT_CATEGORY_FIELD}`, `${name}_${DRAW_IN_NEXT_METRIC_FIELD}`]
      : [`${name}_${DRAW_IN_NEXT_DIM_FIELD}`, `${name}_${DRAW_IN_NEXT_METRIC_FIELD}`];
  sourceData.transform = sourceData.transform ?? [];
  const alreadyAdded = sourceData.transform.some(
    (transform) =>
      transform.type === 'window' && Array.isArray(transform.as) && transform.as.join() === asFields.join()
  );
  if (alreadyAdded) return;
  sourceData.transform.push({
    type: 'window',
    sort: { field: sortField, order: 'ascending' },
    groupby: [SERIES_ID],
    ops: fields.map((): 'lead' => 'lead'),
    fields,
    as: asFields,
  });
};

/**
 * Builds the derived data sources that drive the line-draw-in animation:
 * - `${name}_drawInPrev` — the portion of the line already fully drawn
 * - `${name}_drawInTip`  — each series' currently-active bracketing point, flagged `isDrawInTip`
 * - `${name}_drawInLerp` — the merged source the line mark actually renders from
 *
 * Tip membership is decided per-row from its own lead field, so no cross-series ordering is needed.
 * Assumes the sort field, `${name}_drawInNextDimValue` (`addLineDrawInLeadTransform`), and
 * `${name}_drawInAnimCutoff` (`addLineDrawInAnimationSignals`) already exist on the source.
 */
export const getLineDrawInData = (options: LineSpecOptions): Data[] => {
  const { dimension, name, scaleType } = options;
  const sortField = getLineDrawInSortField(scaleType, dimension, name);
  const source = getLineDrawInDataSourceName(options);
  const cutoffSignal = `${name}_${DRAW_IN_ANIM_CUTOFF}`;
  const nextDimField = `${name}_${DRAW_IN_NEXT_DIM_FIELD}`;

  const prevData: SourceData = {
    name: `${name}_${DRAW_IN_PREV_DATA}`,
    source,
    transform: [{ type: 'filter', expr: `datum.${sortField} <= ${cutoffSignal}` }],
  };

  const tipData: SourceData = {
    name: `${name}_${DRAW_IN_TIP_DATA}`,
    source,
    transform: [
      {
        // a valid next point is required — a series' last point (no next point) has nothing left
        // to interpolate toward, so it stays a normal fully-drawn point via `prevData` only.
        type: 'filter',
        expr: `datum.${sortField} <= ${cutoffSignal} && isValid(datum.${nextDimField}) && datum.${nextDimField} > ${cutoffSignal}`,
      },
      { type: 'formula', as: DRAW_IN_TIP_FLAG, expr: 'true' },
    ],
  };

  const lerpData: SourceData = {
    name: `${name}_${DRAW_IN_LERP_DATA}`,
    source: [prevData.name, tipData.name],
  };

  return [prevData, tipData, lerpData];
};

/**
 * Adds the shared mount-timer chain (`drawInStart` -> `drawInAnimT` -> `drawInAnimTEased`) every
 * draw-in animated mark reads from.
 */
export const addDrawInClockSignals = (signals: Signal[]): void => {
  if (!hasSignalByName(signals, DRAW_IN_START)) {
    signals.push({ name: DRAW_IN_START, update: 'now()' });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T)) {
    signals.push({
      name: DRAW_IN_ANIM_T,
      init: '0',
      on: [
        {
          events: { type: 'timer', throttle: ANIMATION_THROTTLE },
          update: `clamp((now() - ${DRAW_IN_START}) / ${DRAW_IN_ANIMATION_DURATION_MS}, 0, 1)`,
        },
      ],
    });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T_EASED)) {
    signals.push({
      name: DRAW_IN_ANIM_T_EASED,
      update: `${DRAW_IN_ANIM_T} < 0.5 ? 2 * pow(${DRAW_IN_ANIM_T}, 2) : 1 - pow(-2 * ${DRAW_IN_ANIM_T} + 2, 2) / 2`,
    });
  }
};

/**
 * Adds the signal chain driving this mark's cutoff sweep: the shared mount-timer chain plus a
 * domain-min/max/cutoff triplet scoped to this line's own x scale, so each animated line sweeps its
 * own domain independently.
 *
 * Point scales sweep an ordinal index range instead of the domain's actual values, matching the
 * sort field `getLineDrawInSortField` uses for that scale type.
 */
export const addLineDrawInAnimationSignals = (signals: Signal[], options: LineSpecOptions): void => {
  const { name, scaleType } = options;
  const scaleName = getScaleName('x', scaleType);
  const isPointScale = scaleType === 'point';

  addDrawInClockSignals(signals);

  const domainMinSignal = `${name}_${DRAW_IN_DOMAIN_MIN}`;
  const domainMaxSignal = `${name}_${DRAW_IN_DOMAIN_MAX}`;
  const cutoffSignal = `${name}_${DRAW_IN_ANIM_CUTOFF}`;

  signals.push(
    {
      name: domainMinSignal,
      init: isPointScale ? '0' : `toNumber(extent(domain('${scaleName}'))[0])`,
    },
    {
      name: domainMaxSignal,
      init: isPointScale ? `length(domain('${scaleName}')) - 1` : `toNumber(extent(domain('${scaleName}'))[1])`,
    },
    {
      name: cutoffSignal,
      update: `${DRAW_IN_ANIM_T_EASED} * (${domainMaxSignal} - ${domainMinSignal}) + ${domainMinSignal}`,
    }
  );
};

/**
 * Turns a per-scale lerp-expression builder into the shared dual-metric-axis production rule —
 * the same primary/secondary branch split (via `getDualAxisScaleNames`) every mark's static
 * dual-axis encoding already uses, so bar/line/future marks don't each re-derive it.
 */
export const getDualAxisDrawInRule = (
  baseScaleName: string,
  buildExpr: (scaleName: string) => string
): ProductionRule<NumericValueRef> => {
  const { primaryScale, secondaryScale } = getDualAxisScaleNames(baseScaleName);
  return [
    { test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`, signal: buildExpr(secondaryScale) },
    { signal: buildExpr(primaryScale) },
  ];
};

/**
 * Per-row tween fraction: how far the cutoff has moved from this row's sortField value toward its
 * lead row's value (`addLineDrawInLeadTransform`). Computed independently per row/series — no shared
 * "which value is currently being crossed" signal is needed.
 */
const getLineDrawInTweenExpr = (name: string, sortField: string): string => {
  const nextDimField = `${name}_${DRAW_IN_NEXT_DIM_FIELD}`;
  const cutoffSignal = `${name}_${DRAW_IN_ANIM_CUTOFF}`;
  return `clamp((${cutoffSignal} - datum.${sortField}) / (datum.${nextDimField} - datum.${sortField}), 0, 1)`;
};

/**
 * X encoding for draw-in animated lines: normal scaled position, except the flagged tip point
 * (`isDrawInTip`) which lerps toward its lead point's position using the per-row tween fraction.
 *
 * Point scales look up the lead position via the next point's real category value
 * (`DRAW_IN_NEXT_CATEGORY_FIELD`) rather than the sort field's ordinal index, which isn't valid
 * scale input. Time/linear scales don't need this — their sort field already is a valid lookup value.
 */
export const getLineDrawInXEncoding = ({ dimension, name, scaleType }: LineMarkOptions): NumericValueRef => {
  const scale = getScaleName('x', scaleType);
  const dimField = scaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
  const sortField = getLineDrawInSortField(scaleType, dimension, name);
  const nextLookupField = scaleType === 'point' ? `${name}_${DRAW_IN_NEXT_CATEGORY_FIELD}` : `${name}_${DRAW_IN_NEXT_DIM_FIELD}`;
  const currentPos = `scale('${scale}', datum.${dimField})`;
  const nextPos = `scale('${scale}', datum.${nextLookupField})`;
  const tween = getLineDrawInTweenExpr(name, sortField);
  return { signal: `isValid(datum.${DRAW_IN_TIP_FLAG}) ? lerp([${currentPos}, ${nextPos}], ${tween}) : ${currentPos}` };
};

/**
 * Y encoding for draw-in animated lines, mirroring {@link getLineDrawInXEncoding}. Dual-metric-axis
 * lines branch onto the primary/secondary scale per series via `getDualAxisDrawInRule`. No
 * `nextLookupField`-style branch is needed here since the metric axis is always numeric.
 */
export const getLineDrawInYEncoding = (lineMarkOptions: LineMarkOptions): ProductionRule<NumericValueRef> => {
  const { dimension, metric, metricAxis, name, scaleType } = lineMarkOptions;
  const sortField = getLineDrawInSortField(scaleType, dimension, name);
  const tween = getLineDrawInTweenExpr(name, sortField);
  const buildExpr = (yScale: string): string => {
    const currentPos = `scale('${yScale}', datum.${metric})`;
    const nextPos = `scale('${yScale}', datum.${name}_${DRAW_IN_NEXT_METRIC_FIELD})`;
    return `isValid(datum.${DRAW_IN_TIP_FLAG}) ? lerp([${currentPos}, ${nextPos}], ${tween}) : ${currentPos}`;
  };

  if (isDualMetricAxis(lineMarkOptions)) {
    return getDualAxisDrawInRule(metricAxis || 'yLinear', buildExpr);
  }

  return { signal: buildExpr(metricAxis || 'yLinear') };
};
