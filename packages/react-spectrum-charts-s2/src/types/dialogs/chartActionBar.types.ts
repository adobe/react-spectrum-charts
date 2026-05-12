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
import { JSXElementConstructor, ReactElement } from 'react';

import { ChartActionBarOptions, Datum } from '@spectrum-charts/vega-spec-builder-s2';

/**
 * Props for the ChartActionBar component.
 * Mutually exclusive with ChartPopover on the same Line — if both are present, ChartActionBar takes precedence.
 * Renders a floating contextual toolbar near the clicked data point.
 */
export interface ChartActionBarProps extends ChartActionBarOptions {
  /**
   * Render function that returns an array of action elements.
   * The component shows up to `maxActions` inline; any extras collapse into a "⋯" overflow popover.
   */
  children?: (datum: Datum, close: () => void) => ReactElement[];
  /**
   * Hard cap on inline actions before overflow kicks in.
   * Space is the primary driver — the component will also reduce visible actions when the bar
   * would exceed 800 px or the viewport width. Defaults to 4.
   */
  maxActions?: number;
  /** Called when the action bar is dismissed. */
  onClearSelection?: () => void;
}

export type ChartActionBarElement = ReactElement<ChartActionBarProps, JSXElementConstructor<ChartActionBarProps>>;
