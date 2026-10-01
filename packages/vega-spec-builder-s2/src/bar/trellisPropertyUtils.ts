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
import { BarSpecOptions } from '../types';

export interface BarTrellisProperties {
  facetName: string;
  scaleName: 'xTrellisBand' | 'yTrellisBand';
  markName: 'xTrellisGroup' | 'yTrellisGroup';
  dimensionSizeSignal: 'width' | 'height';
  axis: 'x' | 'y';
  paddingInner: number;
}

export const getTrellisProperties = ({
  trellisOrientation,
  name,
  trellisPadding,
}: BarSpecOptions): BarTrellisProperties => {
  const axis = trellisOrientation === 'horizontal' ? 'x' : 'y';

  return {
    facetName: `${name}_trellis`,
    scaleName: `${axis}TrellisBand`,
    markName: `${axis}TrellisGroup`,
    dimensionSizeSignal: axis === 'x' ? 'width' : 'height',
    axis,
    paddingInner: trellisPadding,
  };
};

export const isTrellised = (options: BarSpecOptions) => Boolean(options.trellis);
