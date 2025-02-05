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

import { ChartTooltip } from '@components/ChartTooltip';
import { COLOR_SCALE, FILTERED_TABLE, HIGHLIGHTED_ITEM } from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { initializeSpec } from '@specBuilder/specUtils';

import { getBulletScales, addBullet, getBulletData, getBulletMarks, getAdjustedColor } from './bulletSpecBuilder';
import { ColorScheme, BulletProps, BulletSpecProps } from '../../types';

const sampleProps: BulletSpecProps = {
    "children": [],
    "colorScheme": "light",
    "index": 0,
    "color": "green",
    "metric": "currentAmount",
    "dimension": "graphLabel",
    "target": "target",
    "name": "bullet0",
    "idKey": "rscMarkId"
}

describe('getBulletData', () => {
    test('should return the data object with max value being set', () => {
        const data = getBulletData(sampleProps);
        expect(data).toHaveLength(2);
        expect(data[1].transform[0].fields.includes('maxValue')).toBe(true);
    });
});

describe('getBulletScales', () => {

    //Not much here right now because the function only returns a single const
    test('should return the correct scales object', () => {
        const data = getBulletScales();
        expect(data).toBeDefined()
    });
});

describe('getBulletMarks', () => {
    test('should return the correct marks object', () => {
        console.log('marks\n', getBulletMarks(sampleProps));
        const data = getBulletMarks(sampleProps);
        expect(data).toHaveLength(4);
        expect(data[0].type).toBe('rect');
        expect(data[1].type).toBe('text');
        expect(data[2].type).toBe('text');
        expect(data[3].type).toBe('rule');
    });
});

describe('getAdjustedColor', () => {
    test('Returns the correct color when passed an Adobe Spectrum Color', () => {
        const color = getAdjustedColor('blue-500', 'light');
        expect(color).toBe('rgb(120, 187, 250)');
    });

    test('Returns the same color passed if not a valid Adobe Spectrum Color', () => {
        const color = getAdjustedColor('cyan', 'light');
        expect(color).toBe('cyan');
    });
});