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
import { GroupMark } from 'vega';

import {
  addGaugeMarks,
  getBackgroundArc,
  getFillerArc,
  getNeedle,
} from './gaugeMarkUtils';

import { defaultGaugeOptions } from './gaugeTestUtils';
import { spectrumColors } from '../../../themes';

describe('getGaugeMarks', () => {
  test('Should return the correct marks object', () => {
    const data = addGaugeMarks([], defaultGaugeOptions);
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(4);
    expect(data[0].type).toBe('arc');
    expect(data[1].type).toBe('arc');
  });
});


describe('getGaugeBackgroundArc', () => {
  test('Should return the correct background arc mark object', () => {
    const data = getBackgroundArc("backgroundTestName", spectrumColors['light']['blue-200'], spectrumColors['light']['blue-300']);
    expect(data).toBeDefined();
    expect(data.encode?.enter).toBeDefined();

    // Expect the correct amount of fields in the update object
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(7);
  });
});


describe('getFillerArc', () => {
  test('Should return the correct filler arc mark object', () => {
    const data = getFillerArc("fillerTestName", spectrumColors['light']['magenta-900']);
    expect(data).toBeDefined();

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(7)
  });
});


describe('getGaugeNeedle', () => {
  test('Should return the needle mark object', () => {
    const data = getNeedle("needleTestName");
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(2)
  });
});

