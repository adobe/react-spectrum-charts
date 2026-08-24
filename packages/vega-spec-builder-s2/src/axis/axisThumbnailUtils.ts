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
import { ImageMark, ScaleType, Signal, TextEncodeEntry } from 'vega';

import { FILTERED_TABLE, MAX_THUMBNAIL_SIZE, MIN_THUMBNAIL_SIZE, THUMBNAIL_OFFSET } from '@spectrum-charts/constants';

import { getGenericUpdateSignal } from '../signal/signalSpecBuilder';
import { AxisSpecOptions, AxisThumbnailOptions, AxisThumbnailSpecOptions, Position } from '../types';
import { DivergingBarContext } from './axisUtils';

/**
 * Extracts and processes axis thumbnail options from the main axis options.
 * Maps each thumbnail option to a fully configured specification with default values applied.
 *
 * @param axisOptions - The complete axis specification options containing thumbnail configurations
 * @returns An array of fully configured axis thumbnail specification options
 */
export const getAxisThumbnails = (axisOptions: AxisSpecOptions): AxisThumbnailSpecOptions[] => {
  return axisOptions.axisThumbnails.map((axisThumbnailOptions, index) =>
    applyAxisThumbnailOptionDefaults(axisThumbnailOptions, axisOptions, index)
  );
};

/**
 * Applies default values to axis thumbnail options and generates a unique name.
 * Ensures each thumbnail has a proper name and URL key for identification.
 *
 * @param options - The individual axis thumbnail options to process
 * @param axisOptions - The parent axis specification options
 * @param index - The index of this thumbnail within the axis thumbnails array
 * @returns A fully configured axis thumbnail specification with defaults applied
 */
const applyAxisThumbnailOptionDefaults = (
  options: AxisThumbnailOptions,
  axisOptions: AxisSpecOptions,
  index: number
): AxisThumbnailSpecOptions => ({
  ...options,
  name: `${axisOptions.name}AxisThumbnail${index}`,
  urlKey: options.urlKey ?? `thumbnail`,
});

/**
 * Determines whether a given scale type supports thumbnail rendering.
 * Currently only band scales are supported for thumbnails.
 *
 * @param scaleType - The scale type to check for thumbnail support
 * @returns True if the scale type supports thumbnails, false otherwise
 */
export const scaleTypeSupportsThumbnails = (scaleType: ScaleType | undefined): boolean => {
  const supportedScaleTypes: ScaleType[] = ['band'];
  return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

/**
 * Adds thumbnail size calculation signals to the signals array.
 * Creates a signal that calculates the appropriate thumbnail size based on the scale bandwidth
 * and maximum thumbnail size constraints.
 *
 * @param signals - The array of Vega signals to append the thumbnail size signal to
 * @param axisThumbnailName - The name of the thumbnail for signal generation
 * @param scaleName - The name of the scale to calculate bandwidth from
 */
export const addAxisThumbnailSignals = (signals: Signal[], axisThumbnailName: string, scaleName: string) => {
  signals.push(
    getGenericUpdateSignal(`${axisThumbnailName}ThumbnailSize`, `min(bandwidth('${scaleName}'), ${MAX_THUMBNAIL_SIZE})`)
  );
};

/**
 * Generates Vega image marks for axis thumbnails based on the axis configuration.
 * Creates image marks that display thumbnails positioned relative to the axis,
 * with dynamic sizing and opacity based on available space.
 *
 * @param axisOptions - The complete axis specification options
 * @param scaleName - The name of the scale used for positioning calculations
 * @param scaleField - The data field used for scale domain mapping
 * @returns An array of Vega image marks configured for axis thumbnails
 */
export const getAxisThumbnailMarks = (
  axisOptions: AxisSpecOptions & {
    opposingScaleType?: string;
    opposingScaleName?: string;
    divergingContext?: DivergingBarContext;
  },
  scaleName: string,
  scaleField: string
): ImageMark[] => {
  const { position, opposingScaleType, opposingScaleName, divergingContext } = axisOptions;

  // thumbnails are top-level sibling marks (not in the axis group), so the diverging flip is applied here manually
  const diverging =
    divergingContext && opposingScaleType === 'linear' && opposingScaleName
      ? {
          zeroLine: `scale('${opposingScaleName}', 0)`,
          isNegativeBarExpr: `datum['${divergingContext.metric}'] < 0`,
        }
      : undefined;

  const thumbnails: ImageMark[] = [];
  const axisThumbnails = getAxisThumbnails(axisOptions);
  for (const { name, urlKey } of axisThumbnails) {
    thumbnails.push({
      type: 'image',
      name,
      from: { data: FILTERED_TABLE },
      encode: {
        enter: {
          url: { field: urlKey },
        },
        update: {
          ...getAxisThumbnailPosition(scaleName, scaleField, position, name, diverging),
          width: { signal: `${name}ThumbnailSize` },
          height: { signal: `${name}ThumbnailSize` },
          opacity: [
            {
              test: `${name}ThumbnailSize < ${MIN_THUMBNAIL_SIZE}`,
              value: 0,
            },
            { value: 1 },
          ],
        },
      },
    });
  }
  return thumbnails;
};

/**
 * Calculates the positioning coordinates for an axis thumbnail based on its position.
 * Returns the appropriate x/y coordinates to place the thumbnail relative to the axis,
 * taking into account the axis position (left, right, top, bottom).
 *
 * @param scaleName - The name of the scale used for positioning calculations
 * @param scaleField - The data field used for scale domain mapping
 * @param position - The position of the axis (left, right, top, bottom)
 * @param axisThumbnailName - The name of the thumbnail for signal references
 * @param diverging - When diverging is active: the opposing scale's zero-line position and the expression true for a negative-bar row. Omitted otherwise (thumbnail pinned to the chart edge).
 * @returns An object with x/y coordinate encodings for thumbnail positioning
 */
export const getAxisThumbnailPosition = (
  scaleName: string,
  scaleField: string,
  position: Position,
  axisThumbnailName: string,
  diverging?: { zeroLine: string; isNegativeBarExpr: string }
) => {
  const centerEncoding = { signal: `scale('${scaleName}', datum.${scaleField}) + bandwidth('${scaleName}') / 2` };
  const thumbnailSize = `${axisThumbnailName}ThumbnailSize`;
  const zeroLine = diverging?.zeroLine;

  // diverging: a row's thumbnail sits across the zero line from its own bar (mirrors the label align flip); else pinned to the edge
  const getPositionRule = (edgeExpr: string, farSide: string, nearSide: string) => {
    if (!diverging) return { signal: edgeExpr };
    return [
      { test: diverging.isNegativeBarExpr, signal: nearSide },
      { signal: farSide },
    ];
  };

  switch (position) {
    case 'left':
      return {
        x: getPositionRule(
          `-${THUMBNAIL_OFFSET} - ${thumbnailSize}`,
          `${zeroLine} - ${THUMBNAIL_OFFSET} - ${thumbnailSize}`,
          `${zeroLine} + ${THUMBNAIL_OFFSET}`
        ),
        yc: centerEncoding,
      };
    case 'right':
      return {
        x: getPositionRule(
          `width + ${THUMBNAIL_OFFSET}`,
          `${zeroLine} + ${THUMBNAIL_OFFSET}`,
          `${zeroLine} - ${THUMBNAIL_OFFSET} - ${thumbnailSize}`
        ),
        yc: centerEncoding,
      };
    case 'top':
      return {
        xc: centerEncoding,
        y: getPositionRule(
          `-${THUMBNAIL_OFFSET} - ${thumbnailSize}`,
          `${zeroLine} - ${THUMBNAIL_OFFSET} - ${thumbnailSize}`,
          `${zeroLine} + ${THUMBNAIL_OFFSET}`
        ),
      };
    case 'bottom':
    default:
      return {
        xc: centerEncoding,
        y: getPositionRule(
          `height + ${THUMBNAIL_OFFSET}`,
          `${zeroLine} + ${THUMBNAIL_OFFSET}`,
          `${zeroLine} - ${THUMBNAIL_OFFSET} - ${thumbnailSize}`
        ),
      };
  }
};

/**
 * Calculates the offset needed for axis labels to accommodate thumbnails.
 * Returns text encoding entries that adjust label positioning based on thumbnail size,
 * ensuring labels don't overlap with thumbnails when they are visible.
 *
 * @param axisThumbnailName - The name of the thumbnail for signal reference
 * @param position - The position of the axis (left, right, top, bottom)
 * @param isNegativeBarExpr - Expression true when a tick's own bar is negative; flips the label offset per row to match the thumbnail's flip.
 * @returns Text encoding entries for label offset adjustments
 */
export const getAxisThumbnailLabelOffset = (
  axisThumbnailName: string,
  position: Position,
  isNegativeBarExpr?: string
): TextEncodeEntry => {
  // if the thumbnail is too small, it will be hidden and we don't want padding
  const hideThumbnailCondition = { test: `${axisThumbnailName}ThumbnailSize < ${MIN_THUMBNAIL_SIZE}`, value: 0 };
  const thumbnailSize = `${axisThumbnailName}ThumbnailSize`;

  const getOffsetRule = (outward: string, flipped: string) =>
    isNegativeBarExpr
      ? [hideThumbnailCondition, { test: isNegativeBarExpr, signal: flipped }, { signal: outward }]
      : [hideThumbnailCondition, { signal: outward }];

  switch (position) {
    case 'left':
      return { dx: getOffsetRule(`-${thumbnailSize}`, thumbnailSize) };
    case 'right':
      return { dx: getOffsetRule(thumbnailSize, `-${thumbnailSize}`) };
    case 'top':
      return { dy: getOffsetRule(`-${thumbnailSize}`, thumbnailSize) };
    case 'bottom':
    default:
      return { dy: getOffsetRule(thumbnailSize, `-${thumbnailSize}`) };
  }
};
