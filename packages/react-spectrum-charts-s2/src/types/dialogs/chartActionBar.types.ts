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
  /** Function that receives the clicked datum and a `close` callback and returns the action elements to show. */
  children?: (datum: Datum, close: () => void) => ReactElement[];
  /** Gives the bar an accent background; pair it with `staticColor="white"` on the actions. Defaults to `false`. */
  isEmphasized?: boolean;
  /** Most actions shown inline before the rest move to a "More actions" menu. Defaults to `4`. */
  maxActions?: number;
  /** Called when the action bar closes and the clicked point is deselected. */
  onClearSelection?: () => void;
}

export type ChartActionBarElement = ReactElement<ChartActionBarProps, JSXElementConstructor<ChartActionBarProps>>;
