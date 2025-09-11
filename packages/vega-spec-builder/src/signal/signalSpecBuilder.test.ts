/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Signal } from 'vega';

import { FILTERED_TABLE, HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES, HOVERED_ITEM, MARK_ID } from '@spectrum-charts/constants';

import { defaultHighlightedItemSignal, defaultHighlightedSeriesSignal, defaultSignals } from '../specTestUtils';
import {
  addHighlightedItemSignalEvents,
  addHighlightedSeriesSignalEvents,
  addHoveredItemSignal,
  getHighlightSignalUpdateExpression,
} from './signalSpecBuilder';

describe('signalSpecBuilder', () => {
  let signals: Signal[];
  beforeEach(() => {
    signals = JSON.parse(JSON.stringify(defaultSignals));
  });
  describe('addHighlightedItemSignalEvents()', () => {
    test('should add on events', () => {
      addHighlightedItemSignalEvents(signals, 'line0', MARK_ID);
      expect(signals).toHaveLength(defaultSignals.length);
      expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
      expect(signals[0].on).toHaveLength(2);
      expect(signals[0]?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
      expect(signals[0]?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
      expect(signals[1].on).toBeUndefined();
      expect(signals[2].on).toBeUndefined();
      expect(signals[3].on).toBeUndefined();
      expect(signals[4].on).toBeUndefined();
    });
    test('should not do anything if the highlight signal is not found', () => {
      const signals = JSON.parse(JSON.stringify([defaultHighlightedSeriesSignal]));
      const signalsCopy = JSON.parse(JSON.stringify(signals));
      addHighlightedItemSignalEvents(signals, 'line0', MARK_ID);
      expect(signals).toEqual(signalsCopy);
    });
    test('should include update condition if excludeDataKey is provided', () => {
      addHighlightedItemSignalEvents(signals, 'bar0', MARK_ID, 1, ['excludeFromTooltip']);
      expect(signals).toHaveLength(defaultSignals.length);
      expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
      expect(signals[0].on).toHaveLength(2);
      expect(signals[0]?.on?.[0]).toHaveProperty('events', '@bar0:mouseover');
      expect(signals[0]?.on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum.rscMarkId');
      expect(signals[1].on).toBeUndefined();
      expect(signals[2].on).toBeUndefined();
      expect(signals[3].on).toBeUndefined();
      expect(signals[4].on).toBeUndefined();
    });
  });

  describe('addHighlightedSeriesSignalEvents()', () => {
    test('should add on events', () => {
      addHighlightedSeriesSignalEvents(signals, 'line0');
      expect(signals).toHaveLength(defaultSignals.length);
      expect(signals[0].on).toBeUndefined();
      expect(signals[1].on).toBeUndefined();
      expect(signals[2]).toHaveProperty('name', HIGHLIGHTED_SERIES);
      expect(signals[2].on).toHaveLength(2);
      expect(signals[2]?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
      expect(signals[2]?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
      expect(signals[3].on).toBeUndefined();
      expect(signals[4].on).toBeUndefined();
    });
    test('should not do anything if the highlight signal is not found', () => {
      const signals = JSON.parse(JSON.stringify([defaultHighlightedItemSignal]));
      const signalsCopy = JSON.parse(JSON.stringify(signals));
      addHighlightedSeriesSignalEvents(signals, 'line0');
      expect(signals).toEqual(signalsCopy);
    });
    test('should include update condition if excludeDataKey is provided', () => {
      addHighlightedSeriesSignalEvents(signals, 'bar0', 1, ['excludeFromTooltip']);
      expect(signals).toHaveLength(defaultSignals.length);
      expect(signals[0].on).toBeUndefined();
      expect(signals[1].on).toBeUndefined();
      expect(signals[2]).toHaveProperty('name', HIGHLIGHTED_SERIES);
      expect(signals[2].on).toHaveLength(2);
      expect(signals[2]?.on?.[0]).toHaveProperty('events', '@bar0:mouseover');
      expect(signals[2]?.on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum.rscSeriesId');
      expect(signals[2]?.on?.[1]).toHaveProperty('events', '@bar0:mouseout');
      expect(signals[2]?.on?.[1]).toHaveProperty('update', 'null');
      expect(signals[3].on).toBeUndefined();
      expect(signals[4].on).toBeUndefined();
    });
  });

  describe('getHighlightSignalUpdateExpression()', () => {
    test('should return basic rule if there is no method of hidding series', () => {
      const update = getHighlightSignalUpdateExpression('legend0', false);
      expect(update).toBe(`domain("legend0Entries")[datum.index]`);
    });

    test('should reference filteredTable if there are keys', () => {
      const update = getHighlightSignalUpdateExpression('legend0', true, ['key1', 'key2']);
      expect(update).toContain(FILTERED_TABLE);
    });

    test('should referende hiddenSeries if there are not keys', () => {
      const update = getHighlightSignalUpdateExpression('legend0', true, []);
      expect(update).toContain('hiddenSeries');
    });
  });

  describe('addHoveredItemSignal()', () => {
    test('should use targetName if provided', () => {
      signals = [];
      addHoveredItemSignal(signals, 'line0', 'target0');
      expect(signals).toHaveLength(1);
      expect(signals[0]).toHaveProperty('name', `line0_${HOVERED_ITEM}`);
      expect(signals[0]?.on?.[0]).toHaveProperty('events', '@target0:mouseover');
      expect(signals[0]?.on?.[1]).toHaveProperty('events', '@target0:mouseout');
    });
    test('should use markName if targetName is not provided', () => {
      signals = [];
      addHoveredItemSignal(signals, 'line0');
      expect(signals).toHaveLength(1);
      expect(signals[0]).toHaveProperty('name', `line0_${HOVERED_ITEM}`);
      expect(signals[0]?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
      expect(signals[0]?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
    });
    test('should add signal if it does not exist', () => {
      addHoveredItemSignal(signals, 'line0');
      expect(signals).toHaveLength(defaultSignals.length + 1);
      expect(signals.at(-1)).toHaveProperty('name', `line0_${HOVERED_ITEM}`);
    });
    test('should add on events to signal instead of creating a new one', () => {
      signals.push({ name: `line0_${HOVERED_ITEM}`, value: null, on: [] });
      addHoveredItemSignal(signals, 'line0');
      expect(signals).toHaveLength(defaultSignals.length + 1);
      const hoveredItemSignal = signals.at(-1);
      expect(hoveredItemSignal).toHaveProperty('name', `line0_${HOVERED_ITEM}`);
      expect(hoveredItemSignal?.on).toHaveLength(2);
      expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
      expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
    });
  }); 
});
