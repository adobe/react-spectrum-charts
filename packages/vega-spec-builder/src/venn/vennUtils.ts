/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { PathMark, SymbolMark, TextMark, isArray } from 'vega';
import { computeTextCentres, intersectionAreaPath, normalizeSolution, scaleSolution, venn } from 'venn-helper';

import {
  DEFAULT_VENN_COLOR,
  DEFAULT_VENN_METRIC,
  DEFAULT_VENN_STYLES,
  SET_ID_DELIMITER,
} from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getMarkOpacity, getTooltip, isInteractive } from '../marks/markUtils';
import { VennDegreeOptions, VennOptions, VennSpecOptions } from '../types';

type VennHelperProps = {
  sets: string[];
  size: number;
};

export const getVennSolution = (props: VennSpecOptions) => {
  const { orientation } = props;

  const safeData = mapDataForVennHelper(props);

  // safe to do casting since types in map and props are the same
  const orientationInRadians = degreesToRadians.get(orientation) as number;

  if (safeData.length === 0) {
    return { circles: [], intersections: [] };
  }

  let solution = venn(safeData, { layout: 'greedy' });

  if (orientation !== '0deg') {
    solution = normalizeSolution(solution, orientationInRadians);
  }

  // divide the width by a small amount so that the venn does not overflow
  solution = scaleSolution(solution, props.chartWidth / 1.01, props.chartHeight, 0);
  const textCenters = computeTextCentres(solution, safeData);

  const intersections = safeData
    .map((datum) => {
      // we join by comma here to because its the output of venn-helper
      const setName = datum.sets.join(',');
      // Added size to the intersection data
      const { x: textX, y: textY, disjoint } = textCenters[setName];
      return {
        set_id: datum.sets.join(SET_ID_DELIMITER),
        sets: datum.sets,
        path: intersectionAreaPath(datum.sets.map((set) => solution[set])),
        textY: disjoint ? undefined : textX,
        textX: disjoint ? undefined : textY,
        size: datum.size,
      };
    })
    .filter((datum) => datum.sets.length > 1);

  const circles = Object.entries(solution).map(([key, circle]) => ({
    set_id: key,
    x: circle.x,
    y: circle.y,
    // the size represents the radius, to scale we need to convert to the area of the square
    size: Math.pow(circle.radius * 2, 2),
    textX: textCenters[key].x,
    textY: textCenters[key].y,
  }));

  return { circles, intersections };
};

export const mapDataForVennHelper = (props: VennSpecOptions): VennHelperProps[] => {
  const { data, metric, color } = props;
  const unsafeData = data as unknown as Record<string, unknown>[];

  const parsed = unsafeData
    .map((datum) => {
      const res = { ...datum };

      if (metric) {
        if (res[metric] === undefined) {
          throw new Error("set the metric prop to the default 'size' or set your own");
        }

        if (metric !== DEFAULT_VENN_METRIC && typeof res[metric] === 'number') {
          res.size = datum[metric] as string;
        }
      }

      if (color) {
        if (res[color] === undefined) {
          throw new Error("set the setField prop to the default 'sets' or set your own");
        }

        if (color !== DEFAULT_VENN_COLOR && typeof isArray(res[color])) {
          res.sets = structuredClone(datum[color]) as string[];
        }
      }

      return {
        size: res.size as number,
        sets: res.sets as string[],
      } satisfies VennHelperProps;
    })
    .filter((datum) => datum.sets.length > 0);

  return parsed;
};

export function mergeStylesWithDefaults(style: VennOptions['style']) {
  return Object.assign(DEFAULT_VENN_STYLES, { ...style });
}

export const getCircleOverlays = (props: VennSpecOptions): SymbolMark => {
  const { name, colorScheme } = props;

  return {
    type: 'symbol',
    name: `${name}_selected_circle`,
    from: { data: 'circles' },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        size: { field: 'size' },
        shape: { value: 'circle' },
        fill: getColorProductionRule('set_id', colorScheme),
        fillOpacity: { value: 0.2 },
      },
    },
  };
};

export const getCircleMark = (props: VennSpecOptions): SymbolMark => {
  const { name, colorScheme, chartTooltips } = props;

  return {
    type: 'symbol',
    name: name,
    from: { data: 'circles' },
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        tooltip: getTooltip(chartTooltips, name),
        size: { field: 'size' },
        shape: { value: 'circle' },
        fill: getColorProductionRule('set_id', colorScheme),
      },
      update: {
        opacity: getMarkOpacity(props, 0.5),
        // Add cursor pointer when there are popovers
        cursor: isInteractive(props) ? { value: 'pointer' } : undefined,
      },
    },
  };
};

export const getTextMark = (props: VennSpecOptions, dataSource: 'circles' | 'intersections'): TextMark => {
  const { label } = props;

  return {
    type: 'text',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'textX' },
        y: { field: 'textY' },
        text: { field: `table_data.${label}` },
        opacity: getMarkOpacity(props),
        align: { value: 'center' },
        baseline: { value: 'middle' },
      },
    },
  };
};

export const getInterserctionMark = (props: VennSpecOptions): PathMark => {
  const { name, chartTooltips, colorScheme } = props;

  return {
    type: 'path',
    from: { data: 'intersections' },
    name: `${name}_intersections`,
    encode: {
      enter: {
        path: { field: 'path' },
        fill: { value: getColorValue('static-blue', colorScheme) },
        tooltip: getTooltip(chartTooltips, `${name}`),
      },

      update: {
        fillOpacity: getMarkOpacity(props, 0, 0.7),
        cursor: isInteractive(props) ? { value: 'pointer' } : undefined,
      },
    },
  };
};

export const getStrokeMark = (props: VennSpecOptions): SymbolMark => {
  return {
    type: 'symbol',
    name: `${props.name}_stroke`,
    from: { data: 'circles' },
    interactive: false,
    encode: {
      enter: {
        x: { field: 'x' },
        y: { field: 'y' },
        size: { field: 'strokeSize' },
        shape: { value: 'circle' },
        stroke: getColorProductionRule('set_id', props.colorScheme),
      },
      update: {
        fill: getColorProductionRule('set_id', props.colorScheme),
        strokeWidth: { value: 1 },
        fillOpacity: { value: 0 },
        opacity: getMarkOpacity(props),
      },
    },
  };
};
// the convertion here does not match to real math
// however its the orientations that work for venn-helper
export const degreesToRadians = new Map<VennDegreeOptions, number>([
  ['0deg', Math.PI / 2],
  ['90deg', 0],
  ['180deg', -Math.PI / 2],
  ['270deg', -Math.PI],
]);
