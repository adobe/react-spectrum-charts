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
import { Scale } from 'vega';

/**
 * Generates consistent scale names for dual-axis charts
 * @param baseScaleName The base scale name (e.g. 'xLinear', 'yLinear', 'customAxis')
 * @param isDualAxis Whether this is a dual axis chart
 * @returns Object containing all scale names needed for dual axis configuration
 */
export function getDualAxisScaleNames(baseScaleName: string) {
  const primaryScaleName = `${baseScaleName}Primary`;
  const secondaryScaleName = `${baseScaleName}Secondary`;
  return {
    primaryScale: primaryScaleName,
    secondaryScale: secondaryScaleName,
    primaryDomain: `${primaryScaleName}Domain`,
    secondaryDomain: `${secondaryScaleName}Domain`,
  };
}

export const getScaleField = (scale: Scale): string | undefined => {
  if (scale.domain) {
    // A domain field can be a signal reference instead of a plain field name; only the latter is a usable field.
    if ('field' in scale.domain) {
      return typeof scale.domain.field === 'string' ? scale.domain.field : undefined;
    }
    if ('fields' in scale.domain) {
      const field = scale.domain.fields[0];
      return typeof field === 'string' ? field : undefined;
    }
  }
  return undefined;
};
