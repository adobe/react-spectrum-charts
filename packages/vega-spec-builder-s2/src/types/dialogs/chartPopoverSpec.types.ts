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
import { PartiallyRequired } from '../specUtil.types.js';

export interface ChartPopoverOptions {
  /** Width of the popover in pixels, or `'auto'`; fits its content when unset. */
  width?: number | 'auto';
  /** Minimum width of the popover in pixels. Defaults to `0`. */
  minWidth?: number;
  /** Maximum width of the popover in pixels. */
  maxWidth?: number;
  /** Height of the popover in pixels, or `'auto'`; fits its content when unset. */
  height?: number | 'auto';
  /** Minimum height of the popover in pixels. */
  minHeight?: number;
  /** Maximum height of the popover in pixels. */
  maxHeight?: number;
  /** Called with `true` when the popover opens and `false` when it closes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Minimum space in pixels between the popover and the edge of the window. Defaults to `12`. */
  containerPadding?: number;
  /** Opens the popover on right-click instead of click. Defaults to `false`. */
  rightClick?: boolean;
  /** What stays highlighted while the popover is open, like `highlightBy` on ChartInspect; incomplete. Defaults to `'item'`. */
  UNSAFE_highlightBy?: 'series' | 'dimension' | 'item' | string[];
  /** Space in pixels between the popover's edge and its content. Defaults to `12`. */
  contentMargin?: number;
}

type ChartPopoverOptionsWithDefaults = 'UNSAFE_highlightBy';

export interface ChartPopoverSpecOptions
  extends PartiallyRequired<ChartPopoverOptions, ChartPopoverOptionsWithDefaults> {
  markName: string;
}
