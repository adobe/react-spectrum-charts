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

/** A scale domain field can be a signal reference instead of a plain field name; only the latter is usable as a facet key. */
const isFieldName = (field: ScaleField): field is string => typeof field === 'string';

/**
 * These are all the scale names that are used for facets
 */
const facetScaleNames = new Set<FacetType | SecondaryFacetType>([
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
]);

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

  for (const scale of scales) {
    if (
      facetScaleNames.has(scale.name as FacetType | SecondaryFacetType) &&
      isScaleWithMultiFields(scale) &&
      scale.domain.fields.length
    ) {
      const field = scale.domain.fields[0];
      if (!isFieldName(field)) continue;
      if (scale.type === 'ordinal' || scale.type === 'point') {
        ordinalFacets.push({ facetType: scale.name as FacetType, field });
      } else {
        continuousFacets.push({ facetType: scale.name as FacetType, field });
      }
    }
  }
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
  for (const scale of scales) {
    if (isScaleWithMultiFields(scale) && scaleHasKey(scale, keys)) {
      const field = scale.domain.fields.find((field): field is string => isFieldName(field) && keys.includes(field));
      if (field === undefined) continue;
      if (scale.type === 'ordinal' || scale.type === 'point') {
        ordinalFacets.push({ facetType: scale.name as FacetType, field });
      } else {
        continuousFacets.push({ facetType: scale.name as FacetType, field });
      }
    }
  }
  return { ordinalFacets, continuousFacets };
};

/**
 * Checks if the scale has any of the provided keys
 * @param scale
 * @param keys
 * @returns boolean
 */
const scaleHasKey = (scale: ScaleWithMultiFields, keys: string[]): boolean =>
  scale.domain.fields.some((field) => isFieldName(field) && keys.includes(field));

type ScaleWithMultiFields = Scale & { domain: ScaleMultiFieldsRef };

/**
 * Checks that the scale has a domain with a fields array
 * @param scale
 * @returns
 */
const isScaleWithMultiFields = (scale: Scale): scale is ScaleWithMultiFields => {
  return Boolean('domain' in scale && scale.domain && 'fields' in scale.domain);
};
