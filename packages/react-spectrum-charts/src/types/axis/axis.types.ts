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
import { JSXElementConstructor, ReactElement } from 'react';

import { AxisOptions } from '@spectrum-charts/vega-spec-builder';

import { Children } from '../util.types';
import { AxisAnnotationElement } from './axisAnnotation.types';
import { AxisThumbnailElement } from './axisThumbnail.types';
import { ReferenceLineElement } from './referenceLine.types';

export type AxisChildElement = AxisAnnotationElement | AxisThumbnailElement | ReferenceLineElement;

export interface AxisProps extends Omit<AxisOptions, 'axisAnnotations' | 'axisThumbnails' | 'referenceLines'> {
  /** Child components that add supplemental content to the axis */
  children?: Children<AxisChildElement>;
}

export type AxisElement = ReactElement<AxisProps, JSXElementConstructor<AxisProps>>;
