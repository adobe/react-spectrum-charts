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
import { CSSProperties, ReactElement, useRef } from 'react';

import { Focusable } from 'react-aria-components';

import { Tooltip, TooltipTrigger } from '@react-spectrum/s2';

import { useChartContext } from './context/RscChartContext.js';

/** Tooltip for the hovered axis label, anchored over the label. */
export const AxisLabelTooltip = ({ style }: { style: CSSProperties }): ReactElement => {
  const { chartId, hoveredAxisLabel, setHoveredAxisLabel } = useChartContext();
  const anchorRef = useRef<HTMLDivElement>(null);
  // Retained through the Tooltip's exit animation so it doesn't fade out empty.
  const lastContentRef = useRef<string | undefined>(undefined);
  if (hoveredAxisLabel) {
    lastContentRef.current = hoveredAxisLabel.content;
  }
  return (
    // onOpenChange lets React Spectrum dismiss the tooltip on Escape (WCAG 2.2 SC 1.4.13) while keyboard
    // focus stays on the axis tick; a later Escape then drills out of the navigator.
    <TooltipTrigger
      isOpen={Boolean(hoveredAxisLabel)}
      onOpenChange={(open) => {
        if (!open) setHoveredAxisLabel(null);
      }}
    >
      {/* Focusable forwards TooltipTrigger's FocusableContext ref onto our plain div. */}
      <Focusable>
        <div
          id={`${chartId}-axis-label-tooltip-anchor`}
          data-testid="rsc-axis-label-tooltip-anchor"
          ref={anchorRef}
          style={style}
          tabIndex={-1}
        />
      </Focusable>
      <Tooltip>{hoveredAxisLabel?.content ?? lastContentRef.current}</Tooltip>
    </TooltipTrigger>
  );
};
