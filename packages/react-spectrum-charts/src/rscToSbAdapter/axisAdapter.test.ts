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
import { createElement } from 'react';

import { AxisAnnotation, AxisThumbnail, ChartPopover, ChartTooltip, ReferenceLine } from '../components';
import { AxisProps } from '../types';
import { getAxisAnnotationOptions, getAxisOptions } from './axisAdapter';

const basicAxisProps: AxisProps = { position: 'bottom' };

describe('getAxisOptions()', () => {
  it('should return all basic options', () => {
    const options = getAxisOptions(basicAxisProps);
    expect(options.axisAnnotations).toHaveLength(0);
    expect(options.referenceLines).toHaveLength(0);
    expect(options.position).toBe('bottom');
  });
  it('should convert AxisAnnotation children to axisAnnotations array', () => {
    const options = getAxisOptions({ ...basicAxisProps, children: [createElement(AxisAnnotation)] });
    expect(options.axisAnnotations).toHaveLength(1);
  });
  it('should convert ReferenceLine children to referenceLines array', () => {
    const options = getAxisOptions({ ...basicAxisProps, children: [createElement(ReferenceLine)] });
    expect(options.referenceLines).toHaveLength(1);
  });
  it('should convert AxisThumbnail children to axisThumbnails array', () => {
    const options = getAxisOptions({ ...basicAxisProps, children: [createElement(AxisThumbnail)] });
    expect(options.axisThumbnails).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getAxisOptions({ ...basicAxisProps, baseline: true });
    expect(options).toHaveProperty('baseline', true);
  });
  it('should not add props that are not provided', () => {
    const options = getAxisOptions(basicAxisProps);
    expect(options).not.toHaveProperty('color');
  });
});

describe('getAxisAnnotationOptions()', () => {
  it('should return all basic options', () => {
    const options = getAxisAnnotationOptions({});
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartTooltips).toHaveLength(0);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getAxisAnnotationOptions({ children: [createElement(ChartPopover)] });
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert tooltip children to chartTooltips array', () => {
    const options = getAxisAnnotationOptions({ children: [createElement(ChartTooltip)] });
    expect(options.chartTooltips).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getAxisAnnotationOptions({ color: 'red' });
    expect(options).toHaveProperty('color', 'red');
  });
  it('should not add props that are not provided', () => {
    const options = getAxisAnnotationOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
