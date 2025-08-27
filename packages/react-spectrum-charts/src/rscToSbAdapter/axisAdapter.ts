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
import { AxisAnnotationOptions, AxisOptions } from '@spectrum-charts/vega-spec-builder';

import { AxisAnnotationProps, AxisProps } from '../types';
import { childrenToOptions } from './childrenAdapter';

export const getAxisOptions = ({ children, ...axisProps }: AxisProps): AxisOptions => {
  const { axisAnnotations, referenceLines, axisThumbnails } = childrenToOptions(children);

  return {
    ...axisProps,
    axisAnnotations,
    referenceLines,
    axisThumbnails,
  };
};

export const getAxisAnnotationOptions = ({
  children,
  ...axisAnnotationProps
}: AxisAnnotationProps): AxisAnnotationOptions => {
  const { chartPopovers, chartTooltips } = childrenToOptions(children);

  return {
    ...axisAnnotationProps,
    chartPopovers,
    chartTooltips,
  };
};
