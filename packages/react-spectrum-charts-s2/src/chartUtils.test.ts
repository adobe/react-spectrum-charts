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
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';

import { applyChartPropsDefaults, resolveAnimations } from './chartUtils';

describe('applyChartPropsDefaults', () => {
  test('should return default props', () => {
    const props = applyChartPropsDefaults({ data: [] });
    expect(props.backgroundColor).toBeDefined();
    expect(props.colors).toBeDefined();
    expect(props.colors).toBe('s2Categorical20'); // S2 package always uses S2 colors
    expect(props.colorScheme).toBeDefined();
    expect(props.debug).toBeDefined();
    expect(props.emptyStateText).toBeDefined();
    expect(props.height).toBeDefined();
    expect(props.hiddenSeries).toBeDefined();
    expect(props.idKey).toBeDefined();
    expect(props.lineTypes).toBeDefined();
    expect(props.lineWidths).toBeDefined();
    expect(props.locale).toBeDefined();
    expect(props.minHeight).toBeDefined();
    expect(props.maxHeight).toBeDefined();
    expect(props.minWidth).toBeDefined();
    expect(props.maxWidth).toBeDefined();
    expect(props.padding).toBeDefined();
    expect(props.renderer).toBeDefined();
    expect(props.tooltipAnchor).toBeDefined();
    expect(props.tooltipPlacement).toBeDefined();
    expect(props.width).toBeDefined();
  });
  test('user provided props should override defaults', () => {
    const colors = ['blue-500', 'green-500'];
    const props = applyChartPropsDefaults({ data: [], colors });
    expect(props.colors).toBe(colors);
  });

  test('should apply defaults for props explicitly set to undefined', () => {
    const props = applyChartPropsDefaults({
      data: [],
      colorScheme: undefined,
      backgroundColor: undefined,
      height: undefined,
    });
    expect(props.colorScheme).toBe(DEFAULT_COLOR_SCHEME);
    expect(props.backgroundColor).toBe(DEFAULT_BACKGROUND_COLOR);
    expect(props.height).toBe(300);
  });
});

describe('resolveAnimations', () => {
  test('disables animations when reduced motion is preferred', () => {
    expect(resolveAnimations(undefined, true)).toBe(false);
    expect(resolveAnimations(true, true)).toBe(false);
  });

  test('preserves the animations prop when reduced motion is not preferred', () => {
    expect(resolveAnimations(undefined, false)).toBeUndefined();
    expect(resolveAnimations(false, false)).toBe(false);
    expect(resolveAnimations(true, false)).toBe(true);
  });
});
