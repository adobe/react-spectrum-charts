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
import { JSXElementConstructor, ReactElement, ReactNode } from 'react';

import { ChartPopoverOptions, Datum } from '@spectrum-charts/vega-spec-builder';

export type PopoverHandler = (datum: Datum, close: () => void) => ReactNode;

/**
 * Props for the ChartPopover component
 */
export interface ChartPopoverProps extends ChartPopoverOptions {
	/** Callback used to control the content rendered in the popover */
	children?: PopoverHandler;
}

export type ChartPopoverElement = ReactElement<ChartPopoverProps, JSXElementConstructor<ChartPopoverProps>>;
