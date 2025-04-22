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
import { PartiallyRequired } from '../specUtil.types';

export interface ChartPopoverOptions {
	/** Width of the popover */
	width?: number | 'auto';
	/** Minimum width of the popover */
	minWidth?: number;
	/** Maximum width of the popover */
	maxWidth?: number;
	/** Height of the popover */
	height?: number | 'auto';
	/** Minimum height of the popover */
	minHeight?: number;
	/** Maximum height of the popover */
	maxHeight?: number;
	/** handler that is called when the popover's open state changes */
	onOpenChange?: (isOpen: boolean) => void;
	/** The placement padding that should be applied between the popover and its surrounding container */
	containerPadding?: number;
	/** Whether the popover should be shown on right click */
	rightClick?: boolean;
	/** Sets which marks should be highlighted when a popover is visible.  This feature is incomplete. */
	UNSAFE_highlightBy?: 'series' | 'dimension' | 'item' | string[];
}

type ChartPopoverOptionsWithDefaults = 'UNSAFE_highlightBy';

export interface ChartPopoverSpecOptions
	extends PartiallyRequired<ChartPopoverOptions, ChartPopoverOptionsWithDefaults> {
	markName: string;
}
