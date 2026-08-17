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
import { Spec } from 'vega';

import { PATTERN_FILL_ID_PREFIX, getPatternFillId, getPatternFillUrl } from '@spectrum-charts/utils';

export { PATTERN_FILL_ID_PREFIX, getPatternFillId, getPatternFillUrl };
export {
  COMPOSITE_PATTERN_SEPARATOR,
  DEFAULT_PATTERN_FILL_IDS,
  getColorMatchedPatternFillUrl,
  resolvePatternFillGroup,
  resolvePatternFillValue,
} from '@spectrum-charts/utils';
export type { DefaultPatternFillId } from '@spectrum-charts/utils';

/**
 * A tile drawn once and repeated by the canvas/SVG pattern-fill interception, keyed by a stable identity.
 */
export interface PatternTileSource {
  id: string;
  tileSize: { width: number; height: number };
  draw: (ctx: CanvasRenderingContext2D, tileSize: { width: number; height: number }) => void;
  /** Draws the same shape recolored to match a sibling color, used for a composite (baseId::color) id. */
  drawWithColor?: (ctx: CanvasRenderingContext2D, tileSize: { width: number; height: number }, color: string) => void;
  /** Degrees, applied as a transform on the pattern object rather than baked into the tile. */
  rotation?: number;
}

/**
 * Cheaply detects whether a compiled spec references any pattern fill, so interception is only engaged when needed.
 * @param spec
 * @returns true if the spec contains a pattern-fill reference anywhere
 */
export const specHasPatternFill = (spec: Spec): boolean => JSON.stringify(spec).includes(PATTERN_FILL_ID_PREFIX);

const registry = new Map<string, PatternTileSource>();

/**
 * Registers a pattern tile source so mark encodes can reference it via getPatternFillUrl(source.id).
 * @param source
 */
export const registerPatternFill = (source: PatternTileSource): void => {
  registry.set(source.id, source);
};

/**
 * Looks up a registered pattern tile source by id.
 * @param id
 * @returns the registered source, or undefined if none is registered under that id
 */
export const getPatternFillSource = (id: string): PatternTileSource | undefined => registry.get(id);

/**
 * Clears all registered pattern tile sources. Intended for test isolation.
 */
export const clearPatternFillRegistry = (): void => {
  registry.clear();
};
