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
import { emptyBounds, union } from '../../bounds.js';
import { HitTarget, LineOptions } from '../../types.js';
import { MarkContext, MarkOutput } from '../chartType.js';

/** One build of a line mark, shared by its parts. */
export interface LineBuild {
  mark: LineOptions;
  name: string;
  /** Context with the mark's metric axis applied. */
  ctx: MarkContext;
}

/** A piece of a line mark, like its paths or hover marks; parts draw in list order. */
export interface LinePart {
  name: string;
  build(line: LineBuild): Partial<MarkOutput> | undefined;
}

/**
 * Builds parts in draw order and merges their outputs; later parts draw on top, so their hit targets win.
 * @param parts
 * @param line
 * @returns mark output
 */
export const composeParts = (parts: LinePart[], line: LineBuild): MarkOutput => {
  const outputs = parts.map((part) => part.build(line) ?? {});
  const finders = outputs.flatMap(({ hitTarget }) => (hitTarget ? [hitTarget] : [])).reverse();
  const hitTarget = finders.length
    ? (x: number, y: number): HitTarget | null => {
        for (const find of finders) {
          const target = find(x, y);
          if (target) return target;
        }
        return null;
      }
    : undefined;
  const interactionBounds = emptyBounds();
  for (const output of outputs) if (output.interactionBounds) union(interactionBounds, output.interactionBounds);
  return {
    marks: outputs.flatMap((output) => output.marks ?? []),
    overlay: outputs.flatMap((output) => output.overlay ?? []),
    hitTarget,
    hitTest: hitTarget && ((x, y) => hitTarget(x, y)?.datum ?? null),
    interactionBounds,
  };
};
