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
import { ColorScheme } from '../../chartSpec.types';
import { PartiallyRequired, PathWidthFacet, ScaleType } from '../../specUtil.types';
import { SpectrumColor } from '../../spectrumVizColor.types';

export interface ScatterPathOptions {
  /** The color of the links.*/
  color?: SpectrumColor | string;
  /** The width on the links. Link width can vary by point. */
  pathWidth?: PathWidthFacet;
  /** Data keys that should be used to create the groups that get connected by links. */
  groupBy?: string[];
  /** The opacity of the links. */
  opacity?: number;
}

type ScatterPathOptionsWithDefaults = 'color' | 'groupBy' | 'pathWidth' | 'opacity';

export interface ScatterPathSpecOptions extends PartiallyRequired<ScatterPathOptions, ScatterPathOptionsWithDefaults> {
  colorScheme: ColorScheme;
  dimension: string;
  dimensionScaleType: ScaleType;
  metric: string;
  index: number;
  name: string;
}
