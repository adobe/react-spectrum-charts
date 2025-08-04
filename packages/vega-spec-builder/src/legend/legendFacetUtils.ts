/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Scale, ScaleField, ScaleMultiFieldsRef } from 'vega';

import {
  COLOR_SCALE,
  LINEAR_COLOR_SCALE,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';

import { FacetType, SecondaryFacetType } from '../types';
import { Facet } from './legendUtils';

/**
 * These are all the scale names that are used for facets
 */
const facetScaleNames: (FacetType | SecondaryFacetType)[] = [
  COLOR_SCALE,
  LINE_TYPE_SCALE,
  LINEAR_COLOR_SCALE,
  OPACITY_SCALE,
  'secondaryColor',
  'secondaryLineType',
  'secondaryOpacity',
  'secondarySymbolShape',
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
];

/**
 * Safely extracts the field name from a field reference
 * @param field - The field reference which could be a string or object
 * @returns The field name as a string
 */
export const getFieldName = (field: ScaleField | undefined): string => {
  if (typeof field === 'string') {
    return field;
  }
  if (field && typeof field === 'object') {
    // Handle Vega field reference objects
    if ('field' in field && typeof field.field === 'string') {
      return field.field;
    }
    if ('signal' in field && typeof field.signal === 'string') {
      return field.signal;
    }
    // Fallback to toString for other object types
    return String(field);
  }
  return String(field);
};

/**
 * Goes through all the scales and finds all the facets that are used
 * A facet is a key in the data that is used to differentiate the data
 * Examples are color based on 'operatingSystem', size based on 'weight', lineType based on 'timePeriod' etc.
 * @param scales
 * @returns Factes
 */
export const getFacets = (scales: Scale[]): { ordinalFacets: Facet[]; continuousFacets: Facet[] } => {
  const ordinalFacets: Facet[] = [];
  const continuousFacets: Facet[] = [];

  scales.forEach((scale) => {
    if (
      facetScaleNames.includes(scale.name as FacetType) &&
      isScaleWithMultiFields(scale) &&
      scale.domain.fields.length
    ) {
      if (scale.type === 'ordinal' || scale.type === 'point') {
        ordinalFacets.push({
          facetType: scale.name as FacetType,
          field: getFieldName(scale.domain.fields[0]),
        });
      } else {
        continuousFacets.push({ facetType: scale.name as FacetType, field: getFieldName(scale.domain.fields[0]) });
      }
    }
  });
  return { ordinalFacets, continuousFacets };
};

/**
 * This function goes through all the scales and finds the scales that use the provided keys
 * Example: if the keys are ['segment', 'event'], this function will find all the scales that use either of those fields so that they can be used to generate the legend
 * @param keys
 * @param scales
 * @returns
 */
export const getFacetsFromKeys = (
  keys: string[],
  scales: Scale[]
): { ordinalFacets: Facet[]; continuousFacets: Facet[] } => {
  const ordinalFacets: Facet[] = [];
  const continuousFacets: Facet[] = [];
  scales.forEach((scale) => {
    if (isScaleWithMultiFields(scale) && scaleHasKey(scale, keys)) {
      if (scale.type === 'ordinal' || scale.type === 'point') {
        ordinalFacets.push({
          facetType: scale.name as FacetType,
          field: getFieldName(scale.domain.fields.find((field) => keys.includes(getFieldName(field)))),
        });
      } else {
        continuousFacets.push({
          facetType: scale.name as FacetType,
          field: getFieldName(scale.domain.fields.find((field) => keys.includes(getFieldName(field)))),
        });
      }
    }
  });
  return { ordinalFacets, continuousFacets };
};

/**
 * Checks if the scale has any of the provided keys
 * @param scale
 * @param keys
 * @returns boolean
 */
const scaleHasKey = (scale: ScaleWithMultiFields, keys: string[]): boolean =>
  scale.domain.fields.some((field) => keys.includes(getFieldName(field)));

type ScaleWithMultiFields = Scale & { domain: ScaleMultiFieldsRef };

/**
 * Checks that the scale has a domain with a fields array
 * @param scale
 * @returns
 */
const isScaleWithMultiFields = (scale: Scale): scale is ScaleWithMultiFields => {
  return Boolean('domain' in scale && scale.domain && 'fields' in scale.domain);
};
