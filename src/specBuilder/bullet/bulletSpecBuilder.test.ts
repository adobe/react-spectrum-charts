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

import { getBulletScales, getBulletData, getBulletMarks, addBullet } from './bulletSpecBuilder';
import { BulletSpecProps, BulletProps } from '../../types';
import { GroupMark, Spec } from 'vega';

const samplePropsVertical: BulletSpecProps = {
    "children": [],
    "colorScheme": "light",
    "index": 0,
    "color": "green",
    "metric": "currentAmount",
    "dimension": "graphLabel",
    "target": "target",
    "name": "bullet0",
    "idKey": "rscMarkId",
    "direction": "vertical",
}

const samplePropsHorizontal: BulletSpecProps = {
    "children": [],
    "colorScheme": "light",
    "index": 0,
    "color": "green",
    "metric": "currentAmount",
    "dimension": "graphLabel",
    "target": "target",
    "name": "bullet0",
    "idKey": "rscMarkId",
    "direction": "horizontal",
}

describe('addBullet', () => {
    let spec: Spec;

    beforeEach(() => {
        spec = { data: [], marks: [], scales: [] };
    });

    test('should modify spec with bullet chart properties', () => {
        const bulletProps: BulletProps & { idKey: string } = {
            children: [],
            name: 'testBullet',
            metric: 'revenue',
            dimension: 'region',
            target: 'goal',
            idKey: 'rscMarkId',
            direction: 'vertical',
        };

        const newSpec = addBullet(spec, bulletProps);

        const expectedScale = [{"domain": [0, {"signal": "data('max_values')[0].maxOverall"}], "name": "xscale", "range": [0, {"signal": "width"}], "type": "linear"}]

        expect(newSpec.data).toHaveLength(2);
        expect(newSpec.marks).toHaveLength(4);
        expect(newSpec.scales).toEqual(expectedScale);
    });

    test('should create a vertical spec when neither vertical or horizontal are specified for direction', () => {
        const bulletProps: BulletProps & { idKey: string } = {
            children: [],
            name: 'testBullet',
            metric: 'revenue',
            dimension: 'region',
            target: 'goal',
            idKey: 'rscMarkId',
            direction: 'test',
        };

        const newSpec = addBullet(spec, bulletProps);

        //A length of 4 is indicative of a vertical spec
        expect(newSpec.marks).toHaveLength(4)
        
    });

    test('should create a horizontal spec when horizontal is specified for direction', () => {
        const bulletProps: BulletProps & { idKey: string } = {
            children: [],
            name: 'testBullet',
            metric: 'revenue',
            dimension: 'region',
            target: 'goal',
            idKey: 'rscMarkId',
            direction: 'horizontal',
        };

        const newSpec = addBullet(spec, bulletProps);

        //A length of 1 is indicative of a horizontal spec
        expect(newSpec.marks).toHaveLength(1)
        
    });
});

describe('getBulletData', () => {

    test('should return the data object with all necessary fields being populated', () => {
        const data = getBulletData(samplePropsVertical);
        expect(data).toHaveLength(2);
        expect(data[0].transform).toHaveLength(3);
    });
});

//Makes sure the correct horizontal or vertical object is returned
describe('getBulletScales', () => {

    test('should return the correct vertical scales object', () => {
        const data = getBulletScales(samplePropsVertical);
        expect(data[0].type).toBe('linear')
    });

    test('should return the correct horizontal scales object', () => {
        const data = getBulletScales(samplePropsHorizontal);
        expect(data[0].type).toBe('band')
    });
});

describe('getBulletMarks', () => {
    test('should return the correct vertical marks object', () => {
        const data = getBulletMarks(samplePropsVertical);
        expect(data).toHaveLength(4);
        expect(data[0].type).toBe('rect');
        expect(data[1].type).toBe('text');
        expect(data[2].type).toBe('text');
        expect(data[3].type).toBe('rule');
    });

    test('should return the correct horizontal marks object', () => {
        const data = getBulletMarks(samplePropsHorizontal) as GroupMark[];
        expect(data).toHaveLength(1);
        expect(data[0].type).toBe('group')
        expect(data[0].marks).toHaveLength(4);
    });
});
