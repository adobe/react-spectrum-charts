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
import { applyChartPropsDefaults } from './chartUtils';

describe('applyChartPropsDefaults', () => {
  test('should return default props', () => {
    const props = applyChartPropsDefaults({ data: [] });
    expect(props.backgroundColor).toBeDefined();
    expect(props.colors).toBeDefined();
    expect(props.colors).toBe('categorical16');
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
    expect(props.s2).toBeDefined();
    expect(props.theme).toBeDefined();
    expect(props.tooltipAnchor).toBeDefined();
    expect(props.tooltipPlacement).toBeDefined();
    expect(props.width).toBeDefined();
  });
  test('should return defaults for s2 if s2 is true', () => {
    const props = applyChartPropsDefaults({ data: [], s2: true });
    expect(props.colors).toBe('s2Categorical20');
  });
  test('user provided props should override defaults', () => {
    const colors = ['blue-500', 'green-500'];
    const props = applyChartPropsDefaults({ data: [], colors });
    expect(props.colors).toBe(colors);
  });
});
