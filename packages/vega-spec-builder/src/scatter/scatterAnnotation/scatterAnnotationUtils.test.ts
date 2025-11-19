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
import { defaultScatterOptions } from '../scatterTestUtils';
import { getScatterAnnotationMarks, getScatterAnnotationSpecOptions } from './scatterAnnotationUtils';

describe('getScatterAnnotationSpecOptions()', () => {
  test('should return default options if no options are provided', () => {
    const options = getScatterAnnotationSpecOptions({}, 0, defaultScatterOptions);
    expect(options).toHaveProperty('anchor', ['right', 'top', 'bottom', 'left']);
    expect(options).toHaveProperty('textKey', defaultScatterOptions.metric);
  });
  test('should use the provided textKey', () => {
    const options = getScatterAnnotationSpecOptions({ textKey: 'test' }, 0, defaultScatterOptions);
    expect(options).toHaveProperty('textKey', 'test');
  });
  test('should use the provided anchor', () => {
    const options = getScatterAnnotationSpecOptions({ anchor: 'top' }, 0, defaultScatterOptions);
    expect(options).toHaveProperty('anchor', 'top');
  });
});

describe('getScatterAnnotationMarks()', () => {
  test('should return an empty array if there are no annotations', () => {
    const marks = getScatterAnnotationMarks(defaultScatterOptions);
    expect(marks).toHaveLength(0);
  });
  test('should return the marks for the annotations', () => {
    const marks = getScatterAnnotationMarks({ ...defaultScatterOptions, scatterAnnotations: [{ textKey: 'test' }] });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('name', 'scatter0Annotation0');
    expect(marks[0]).toHaveProperty('type', 'text');
    expect(marks[0]).toHaveProperty('from', { data: 'scatter0' });
  });
  test('should return mulitple marks if there are multiple annotations', () => {
    const marks = getScatterAnnotationMarks({
      ...defaultScatterOptions,
      scatterAnnotations: [{ textKey: 'test' }, { textKey: 'test2' }],
    });
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveProperty('name', 'scatter0Annotation0');
    expect(marks[1]).toHaveProperty('name', 'scatter0Annotation1');
  });
  test('should convert the anchor to an array if it is a string', () => {
    const marks = getScatterAnnotationMarks({ ...defaultScatterOptions, scatterAnnotations: [{ anchor: 'top' }] });
    expect(marks[0]).toHaveProperty('transform', [
      {
        type: 'label',
        size: { signal: '[width, height]' },
        anchor: ['top'],
      },
    ]);
  });
});
