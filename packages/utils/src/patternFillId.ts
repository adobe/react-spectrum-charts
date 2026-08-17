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

/**
 * The built-in, colorScheme-independent pattern tile palette used as PATTERN_SCALE's default range.
 */
export const DEFAULT_PATTERN_FILL_IDS = [
  'diagonal-stripe',
  'diagonal-stripe-reverse',
  'horizontal-stripe',
  'dots',
  'crosshatch',
  'grid',
] as const;

export type DefaultPatternFillId = (typeof DEFAULT_PATTERN_FILL_IDS)[number];

const PATTERN_FILL_DISCRIMINANT = 'pattern';

/**
 * A reference to a registered built-in pattern tile, optionally recolored to match a sibling literal color.
 * A plain object literal (like Vega's own `Gradient`) rather than a parsed string, so it can flow through
 * a scale range/signal or an encode value unchanged.
 */
export interface PatternFillValue {
  pattern: string;
  foreground?: string;
}

/**
 * Mirrors Vega's own isGradient(value) => value && value.gradient check.
 * @param value
 * @returns true if value is a PatternFillValue
 */
export const isPatternFillValue = (value: unknown): value is PatternFillValue =>
  typeof value === 'object' && value !== null && PATTERN_FILL_DISCRIMINANT in value;

/**
 * Extracts the pattern id from a resolved fill value, if it is a pattern-fill reference.
 * @param value
 * @returns the pattern id, or undefined if value isn't a pattern-fill reference
 */
export const getPatternFillId = (value: unknown): string | undefined =>
  isPatternFillValue(value) ? value.pattern : undefined;

const isBuiltInPatternFillId = (entry: string): boolean => (DEFAULT_PATTERN_FILL_IDS as readonly string[]).includes(entry);

/**
 * Resolves a `patterns` override entry to a fill value: a built-in pattern name resolves to a
 * PatternFillValue, anything else passes through unchanged as a literal color value.
 * @param entry
 * @returns the resolved fill value
 */
export const resolvePatternFillValue = (entry: string): string | PatternFillValue =>
  isBuiltInPatternFillId(entry) ? { pattern: entry } : entry;

/**
 * Resolves a group of `patterns` entries together (a dual-facet row, or a whole 1D override): each
 * built-in pattern name in the group is recolored to match the first literal color found elsewhere in
 * the same group, so e.g. ['diagonal-stripe', '#2680eb'] renders the stripe using #2680eb, not a fixed
 * neutral tile. Falls back to the fixed neutral tile when no sibling color is present in the group.
 * @param group
 * @returns the resolved fill values, in the same order
 */
export const resolvePatternFillGroup = (group: string[]): (string | PatternFillValue)[] => {
  const siblingColor = group.find((entry) => !isBuiltInPatternFillId(entry));
  return group.map((entry) => {
    if (!isBuiltInPatternFillId(entry)) return entry;
    return siblingColor ? { pattern: entry, foreground: siblingColor } : { pattern: entry };
  });
};
