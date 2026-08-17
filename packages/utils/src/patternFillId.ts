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

export const PATTERN_FILL_ID_PREFIX = 'rsc-pattern-';

const PATTERN_FILL_URL_PATTERN = new RegExp(`^url\\(#${PATTERN_FILL_ID_PREFIX}(.+)\\)$`);

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

/**
 * Builds the fill-reference string a mark encode assigns to reference a registered pattern tile.
 * @param id
 * @returns url(#rsc-pattern-<id>)
 */
export const getPatternFillUrl = (id: string): string => `url(#${PATTERN_FILL_ID_PREFIX}${id})`;

/**
 * Extracts the pattern id from a resolved fill value, if it is a pattern-fill reference.
 * @param value
 * @returns the pattern id, or undefined if value isn't a pattern-fill reference
 */
export const getPatternFillId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.match(PATTERN_FILL_URL_PATTERN)?.[1];
};

const isBuiltInPatternFillId = (entry: string): boolean => (DEFAULT_PATTERN_FILL_IDS as readonly string[]).includes(entry);

/**
 * Resolves a `patterns` override entry to a fill value: a built-in pattern name resolves to its
 * url reference, anything else passes through unchanged as a literal color value.
 * @param entry
 * @returns the resolved fill value
 */
export const resolvePatternFillValue = (entry: string): string =>
  isBuiltInPatternFillId(entry) ? getPatternFillUrl(entry) : entry;

export const COMPOSITE_PATTERN_SEPARATOR = '::';

/**
 * Builds the fill-reference string for a built-in pattern shape recolored to match a sibling color.
 * @param baseId
 * @param color
 * @returns url(#rsc-pattern-<baseId>::<color>)
 */
export const getColorMatchedPatternFillUrl = (baseId: string, color: string): string =>
  getPatternFillUrl(`${baseId}${COMPOSITE_PATTERN_SEPARATOR}${color}`);

/**
 * Resolves a group of `patterns` entries together (a dual-facet row, or a whole 1D override): each
 * built-in pattern name in the group is recolored to match the first literal color found elsewhere in
 * the same group, so e.g. ['diagonal-stripe', '#2680eb'] renders the stripe using #2680eb, not a fixed
 * neutral tile. Falls back to the fixed neutral tile when no sibling color is present in the group.
 * @param group
 * @returns the resolved fill values, in the same order
 */
export const resolvePatternFillGroup = (group: string[]): string[] => {
  const siblingColor = group.find((entry) => !isBuiltInPatternFillId(entry));
  return group.map((entry) => {
    if (!isBuiltInPatternFillId(entry)) return entry;
    return siblingColor ? getColorMatchedPatternFillUrl(entry, siblingColor) : getPatternFillUrl(entry);
  });
};
