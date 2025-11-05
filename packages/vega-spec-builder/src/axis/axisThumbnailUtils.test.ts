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
import { ScaleType, Signal } from 'vega';

import { MAX_THUMBNAIL_SIZE, MIN_THUMBNAIL_SIZE, THUMBNAIL_OFFSET } from '@spectrum-charts/constants';

import { AxisSpecOptions, AxisThumbnailOptions } from '../types';
import { defaultAxisOptions } from './axisTestUtils';
import {
  addAxisThumbnailSignals,
  getAxisThumbnailLabelOffset,
  getAxisThumbnailMarks,
  getAxisThumbnailPosition,
  getAxisThumbnails,
  scaleTypeSupportsThumbnails,
} from './axisThumbnailUtils';

describe('axisThumbnailUtils', () => {
  describe('getAxisThumbnails', () => {
    test('should return empty array when no thumbnails are provided', () => {
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        axisThumbnails: [],
      };

      const result = getAxisThumbnails(axisOptions);

      expect(result).toEqual([]);
    });

    test('should process single thumbnail with default urlKey', () => {
      const thumbnailOptions: AxisThumbnailOptions = {};
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'testAxis',
        axisThumbnails: [thumbnailOptions],
      };

      const result = getAxisThumbnails(axisOptions);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        urlKey: 'thumbnail',
        name: 'testAxisAxisThumbnail0',
      });
    });

    test('should process single thumbnail with custom urlKey', () => {
      const thumbnailOptions: AxisThumbnailOptions = {
        urlKey: 'customThumbnail',
      };
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'testAxis',
        axisThumbnails: [thumbnailOptions],
      };

      const result = getAxisThumbnails(axisOptions);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        urlKey: 'customThumbnail',
        name: 'testAxisAxisThumbnail0',
      });
    });

    test('should process multiple thumbnails with correct naming', () => {
      const thumbnailOptions1: AxisThumbnailOptions = {
        urlKey: 'thumbnail1',
      };
      const thumbnailOptions2: AxisThumbnailOptions = {
        urlKey: 'thumbnail2',
      };
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'testAxis',
        axisThumbnails: [thumbnailOptions1, thumbnailOptions2],
      };

      const result = getAxisThumbnails(axisOptions);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        urlKey: 'thumbnail1',
        name: 'testAxisAxisThumbnail0',
      });
      expect(result[1]).toEqual({
        urlKey: 'thumbnail2',
        name: 'testAxisAxisThumbnail1',
      });
    });

    test('should handle mixed thumbnail configurations', () => {
      const thumbnailOptions1: AxisThumbnailOptions = {}; // uses default urlKey
      const thumbnailOptions2: AxisThumbnailOptions = {
        urlKey: 'customThumbnail',
      };
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'mixedAxis',
        axisThumbnails: [thumbnailOptions1, thumbnailOptions2],
      };

      const result = getAxisThumbnails(axisOptions);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        urlKey: 'thumbnail',
        name: 'mixedAxisAxisThumbnail0',
      });
      expect(result[1]).toEqual({
        urlKey: 'customThumbnail',
        name: 'mixedAxisAxisThumbnail1',
      });
    });
  });

  describe('addAxisThumbnailSignals', () => {
    test('should add thumbnail size signal to signals array', () => {
      const signals: Signal[] = [];
      const axisThumbnailName = 'testThumbnail';
      const scaleName = 'xScale';

      addAxisThumbnailSignals(signals, axisThumbnailName, scaleName);

      expect(signals).toHaveLength(1);
      expect(signals[0]).toEqual({
        name: 'testThumbnailThumbnailSize',
        update: `min(bandwidth(\'xScale\'), ${MAX_THUMBNAIL_SIZE})`,
      });
    });

    test('should append signal to existing signals array', () => {
      const existingSignal = { name: 'existingSignal', update: 'value' };
      const signals: Signal[] = [existingSignal];
      const axisThumbnailName = 'testThumbnail';
      const scaleName = 'yScale';

      addAxisThumbnailSignals(signals, axisThumbnailName, scaleName);

      expect(signals).toHaveLength(2);
      expect(signals[0]).toBe(existingSignal);
      expect(signals[1]).toEqual({
        name: 'testThumbnailThumbnailSize',
        update: `min(bandwidth(\'yScale\'), ${MAX_THUMBNAIL_SIZE})`,
      });
    });
  });

  describe('getAxisThumbnailMarks', () => {
    test('should return empty array when no thumbnails are configured', () => {
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        axisThumbnails: [],
      };

      const result = getAxisThumbnailMarks(axisOptions, 'xScale', 'category');

      expect(result).toEqual([]);
    });

    test('should generate image marks for single thumbnail', () => {
      const thumbnailOptions: AxisThumbnailOptions = {
        urlKey: 'customThumbnail',
      };
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'testAxis',
        position: 'bottom',
        axisThumbnails: [thumbnailOptions],
      };

      const result = getAxisThumbnailMarks(axisOptions, 'xScale', 'category');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('type', 'image');
      expect(result[0]).toHaveProperty('name', 'testAxisAxisThumbnail0');
    });

    test('should generate image marks for multiple thumbnails', () => {
      const thumbnailOptions1: AxisThumbnailOptions = {
        urlKey: 'thumbnail1',
      };
      const thumbnailOptions2: AxisThumbnailOptions = {
        urlKey: 'thumbnail2',
      };
      const axisOptions: AxisSpecOptions = {
        ...defaultAxisOptions,
        name: 'testAxis',
        position: 'left',
        axisThumbnails: [thumbnailOptions1, thumbnailOptions2],
      };

      const result = getAxisThumbnailMarks(axisOptions, 'yScale', 'category');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('type', 'image');
      expect(result[0]).toHaveProperty('name', 'testAxisAxisThumbnail0');
      expect(result[1]).toHaveProperty('type', 'image');
      expect(result[1]).toHaveProperty('name', 'testAxisAxisThumbnail1');
    });
  });

  describe('getAxisThumbnailPosition', () => {
    test('should return correct position for left axis', () => {
      const result = getAxisThumbnailPosition('xScale', 'category', 'left', 'testThumbnail');

      expect(result).toEqual({
        x: { signal: `-${THUMBNAIL_OFFSET} - testThumbnailThumbnailSize` },
        yc: { signal: "scale('xScale', datum.category) + bandwidth('xScale') / 2" },
      });
    });

    test('should return correct position for right axis', () => {
      const result = getAxisThumbnailPosition('yScale', 'value', 'right', 'testThumbnail');

      expect(result).toEqual({
        x: { signal: `width + ${THUMBNAIL_OFFSET}` },
        yc: { signal: "scale('yScale', datum.value) + bandwidth('yScale') / 2" },
      });
    });

    test('should return correct position for top axis', () => {
      const result = getAxisThumbnailPosition('xScale', 'category', 'top', 'testThumbnail');

      expect(result).toEqual({
        xc: { signal: "scale('xScale', datum.category) + bandwidth('xScale') / 2" },
        y: { signal: `-${THUMBNAIL_OFFSET} - testThumbnailThumbnailSize` },
      });
    });

    test('should return correct position for bottom axis', () => {
      const result = getAxisThumbnailPosition('xScale', 'category', 'bottom', 'testThumbnail');

      expect(result).toEqual({
        xc: { signal: "scale('xScale', datum.category) + bandwidth('xScale') / 2" },
        y: { signal: `height + ${THUMBNAIL_OFFSET}` },
      });
    });
  });

  describe('getAxisThumbnailLabelOffset', () => {
    test('should return correct offset for left axis', () => {
      const result = getAxisThumbnailLabelOffset('testThumbnail', 'left');

      expect(result).toEqual({
        dx: [
          { test: `testThumbnailThumbnailSize < ${MIN_THUMBNAIL_SIZE}`, value: 0 },
          { signal: '-testThumbnailThumbnailSize' },
        ],
      });
    });

    test('should return correct offset for right axis', () => {
      const result = getAxisThumbnailLabelOffset('testThumbnail', 'right');

      expect(result).toEqual({
        dx: [
          { test: `testThumbnailThumbnailSize < ${MIN_THUMBNAIL_SIZE}`, value: 0 },
          { signal: 'testThumbnailThumbnailSize' },
        ],
      });
    });

    test('should return correct offset for top axis', () => {
      const result = getAxisThumbnailLabelOffset('testThumbnail', 'top');

      expect(result).toEqual({
        dy: [
          { test: `testThumbnailThumbnailSize < ${MIN_THUMBNAIL_SIZE}`, value: 0 },
          { signal: '-testThumbnailThumbnailSize' },
        ],
      });
    });

    test('should return correct offset for bottom axis', () => {
      const result = getAxisThumbnailLabelOffset('testThumbnail', 'bottom');

      expect(result).toEqual({
        dy: [
          { test: `testThumbnailThumbnailSize < ${MIN_THUMBNAIL_SIZE}`, value: 0 },
          { signal: 'testThumbnailThumbnailSize' },
        ],
      });
    });
  });

  describe('scaleTypeSupportsThumbnails', () => {
    test('should return correct boolean for different scale types', () => {
      const testCases: Array<{ scaleType: ScaleType | undefined; expected: boolean }> = [
        { scaleType: 'band', expected: true },
        { scaleType: 'linear', expected: false },
        { scaleType: 'time', expected: false },
        { scaleType: 'ordinal', expected: false },
        { scaleType: 'point', expected: false },
        { scaleType: undefined, expected: false },
      ];

      testCases.forEach(({ scaleType, expected }) => {
        const result = scaleTypeSupportsThumbnails(scaleType);
        expect(result).toBe(expected);
      });
    });
  });
});
