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
import { OrdinalScale, Scale, ScaleData, ScaleMultiFieldsRef, SignalRef } from 'vega';

import { DISCRETE_PADDING, FILTERED_TABLE, LINEAR_PADDING, PADDING_RATIO, TABLE } from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { getDimensionField } from '../specUtils';
import { DualFacet, FacetRef, FacetType, Orientation } from '../types';

type AxisType = 'x' | 'y';
type SupportedScaleType = 'linear' | 'point' | 'band' | 'time' | 'ordinal';

/**
 * Gets the first index for the given scale type and axis.
 *
 * If the scale doesn't exist, it gets created and the index of the new scale is returned.
 *
 * NOTE: this should only be called from a 'produce' function since it mutates the scales
 */
export const getScaleIndexByType = (
  scales: Scale[],
  type: SupportedScaleType,
  axis: AxisType,
  scaleName?: string,
  domainDataKey?: string
): number => {
  const name = scaleName || toCamelCase(`${axis} ${type}`);
  let index = scales.findIndex((scale) => scale.name === name);
  if (index === -1) {
    index = scales.length;
    scales.push(
      generateScale(type, axis, {
        name,
        ...(domainDataKey ? { domain: { data: domainDataKey, fields: [] } } : {}),
      })
    );
  }
  return index;
};

/**
 * Gets the first index for the given scale name.
 *
 * If the scale doesn't exist, it gets created and the index of the new scale is returned.
 *
 * NOTE: this should only be called from a 'produce' function since it mutates the scales
 */
export const getScaleIndexByName = (scales: Scale[], name: string, type?: SupportedScaleType): number => {
  let index = scales.findIndex((scale) => scale.name === name);
  if (index === -1) {
    index = scales.length;
    scales.push({ name, type });
  }
  return index;
};

export const addDomainFields = produce<Scale, [string[]]>((scale, values) => {
  values.forEach((value) => {
    if (isScaleMultiFieldsRef(scale.domain)) {
      // if a fields already exist but not this value field, push the value field onto it
      if (!scale.domain.fields.includes(value)) {
        scale.domain.fields.push(value);
      }
    } else {
      // if there isn't a domain yet, set it up
      scale.domain = {
        data: TABLE,
        fields: [value],
      };
    }
  });
  return scale;
});

export const addContinuousDimensionScale = (
  scales: Scale[],
  { scaleType, dimension, padding }: { scaleType: SupportedScaleType; dimension: string; padding?: number }
) => {
  const index = getScaleIndexByType(scales, scaleType, 'x');
  const fields = [getDimensionField(dimension, scaleType)];
  scales[index] = addDomainFields(scales[index], fields);
  if (padding !== undefined) {
    scales[index] = overridePadding(scales[index], padding);
  }
};

const overridePadding = produce<Scale, [number]>((scale, padding) => {
  if ('padding' in scale) {
    scale.padding = padding;
  }
  if ('paddingOuter' in scale) {
    scale.paddingOuter = padding;
  }
});

/**
 * Checks if the metric scale already exists
 * If it does, it adds the new metricKeys to the domain
 * If it doesn't, it creates a new scale and adds the metricKeys to the domain
 * @param scales
 * @param values
 * @param metricAxis
 * @param scaleName
 * @param domainDataKey
 */
export const addMetricScale = (
  scales: Scale[],
  metricKeys: string[],
  metricAxis: AxisType = 'y',
  scaleName?: string,
  domainDataKey?: string
) => {
  const index = getScaleIndexByType(scales, 'linear', metricAxis, scaleName, domainDataKey);
  scales[index] = addDomainFields(scales[index], metricKeys);
};

/**
 * Generates a metric scale and returns it
 * NOTE: Does not check if the metric scale already exists
 * @param metricKeys
 * @param metricAxis
 * @returns
 */
export const getMetricScale = (metricKeys: string[], metricAxis: AxisType, chartOrientation: Orientation): Scale => {
  let scale = getDefaultScale('linear', metricAxis, chartOrientation);
  scale = addDomainFields(scale, metricKeys);
  return scale;
};

/**
 * adds the field to the facet scale domain if it isn't a static value
 * @param scales
 * @param facetType
 * @param facetValue
 */
export const addFieldToFacetScaleDomain = (
  scales: Scale[],
  facetType: FacetType,
  facetValue: FacetRef<string | number | number[]> | DualFacet | undefined
) => {
  // if facetValue is a string or an array of strings, it is a field reference and should be added the facet scale domain
  if (typeof facetValue === 'string' || (Array.isArray(facetValue) && facetValue.length)) {
    const index = getScaleIndexByName(scales, facetType);
    const facetField = Array.isArray(facetValue) ? facetValue[0] : facetValue;
    scales[index] = addDomainFields(scales[index], [facetField]);
  }
};

export const generateScale = (type: SupportedScaleType, axis: AxisType, options?: Partial<Scale>): Scale => {
  return {
    ...getDefaultScale(type, axis),
    ...options,
  } as unknown as Scale;
};

export const getDefaultScale = (
  scaleType: SupportedScaleType,
  axis: AxisType,
  chartOrientation: Orientation = 'vertical'
): Scale => {
  const orientationToAxis: { [key in Orientation]: AxisType } = {
    vertical: 'x',
    horizontal: 'y',
  };
  const isDimensionAxis = axis === orientationToAxis[chartOrientation];

  const scale: Scale = {
    name: toCamelCase(`${axis} ${scaleType}`),
    type: scaleType,
    range: axis === 'x' ? 'width' : 'height',
    domain: { data: FILTERED_TABLE, fields: [] },
    // if this is the dimension axis, add padding
    ...(isDimensionAxis ? getPadding(scaleType) : {}),
  };
  if (scale.type === 'ordinal') {
    const { name, type, domain } = scale;
    return { name, type, domain };
  }
  // metric axis properties
  if (scale.type === 'linear' && !isDimensionAxis) {
    return { ...scale, nice: true, zero: true };
  }
  return scale;
};

/**
 * Sets the appropriate axis padding based on type.
 *
 * Discrete scales use a relative value where padding is step size * padding [0-1].
 * Continuous scales use a pixel value for padding.
 */
export const getPadding = (type: SupportedScaleType | 'band') => {
  switch (type) {
    case 'band': {
      const { paddingInner, paddingOuter } = getBandPadding(PADDING_RATIO);
      return { paddingInner, paddingOuter };
    }
    case 'linear':
    case 'time':
      return { padding: LINEAR_PADDING };
    case 'point':
      return { paddingOuter: DISCRETE_PADDING };
    default:
      return {};
  }
};

export const getBandPadding = (paddingRatio: number, paddingOuter?: number) => {
  const paddingInner = paddingRatio;
  return {
    paddingInner,
    paddingOuter: paddingOuter === undefined ? DISCRETE_PADDING - (1 - paddingInner) / 2 : paddingOuter,
  };
};

/**
 * Gets the name of the scale based on the axis and type
 * @param axis
 * @param type
 * @returns scale name
 */
export const getScaleName = (axis: AxisType, type: SupportedScaleType) => toCamelCase(`${axis} ${type}`);

export const getOrdinalScale = (name: string, range: OrdinalScale['range']): OrdinalScale => ({
  name,
  type: 'ordinal',
  range,
  domain: { data: TABLE, fields: [] },
});

const isScaleMultiFieldsRef = (
  domain: (null | string | number | boolean | SignalRef)[] | ScaleData | SignalRef | undefined
): domain is ScaleMultiFieldsRef => {
  return Boolean(domain && !Array.isArray(domain) && 'data' in domain && 'fields' in domain);
};
