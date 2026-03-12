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
import { FC, KeyboardEvent, MutableRefObject, useRef, useState } from 'react';

import { View } from 'vega';

import { COMPONENT_NAME } from '@spectrum-charts/constants';
import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder';

import { KeyboardTarget } from '../hooks/useKeyboardTargets';
import { clearHoverSignals, triggerPopover } from '../utils';

export interface KeyboardFocusOverlayProps {
  targets: KeyboardTarget[];
  chartId: string;
  chartView: MutableRefObject<View | undefined>;
  markHasPopover: boolean;
  specSignalNames: ReadonlySet<string>;
  selectedData: MutableRefObject<Datum | null>;
  selectedDataBounds: MutableRefObject<MarkBounds>;
  selectedDataName: MutableRefObject<string>;
}

export const KeyboardFocusOverlay: FC<KeyboardFocusOverlayProps> = ({
  targets,
  chartId,
  chartView,
  markHasPopover,
  specSignalNames,
  selectedData,
  selectedDataBounds,
  selectedDataName,
}) => {
  // Roving tabIndex: tracks which button is the current tab stop
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (newIndex: number) => {
    const clamped = Math.max(0, Math.min(newIndex, targets.length - 1));
    setFocusedIndex(clamped);
    buttonRefs.current[clamped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(index - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (markHasPopover) {
          activatePopover(targets[index]);
        }
        break;
      default:
        break;
    }
  };

  const handleFocus = (target: KeyboardTarget, index: number) => {
    setFocusedIndex(index);
    const view = chartView.current;
    if (!view) return;
    const signalName = `${target.markName}_hoveredItem`;
    if (specSignalNames.has(signalName)) {
      view.signal(signalName, target.datum);
      view.run();
    }
  };

  const handleBlur = (target: KeyboardTarget, event: React.FocusEvent<HTMLButtonElement>) => {
    // Only clear hover signals when focus leaves the overlay entirely
    const relatedTarget = event.relatedTarget as Node | null;
    const overlayContainer = event.currentTarget.parentElement;
    if (overlayContainer && relatedTarget && overlayContainer.contains(relatedTarget)) {
      return; // Focus moved to another button in the overlay — keep hover state
    }
    const view = chartView.current;
    if (view) {
      clearHoverSignals(view, target.markName, specSignalNames);
      view.run();
    }
  };

  const activatePopover = (target: KeyboardTarget) => {
    selectedData.current = { [COMPONENT_NAME]: target.markName, ...target.datum };
    selectedDataBounds.current = target.vegaBounds;
    selectedDataName.current = target.markName;
    triggerPopover(chartId, target.markName, 'click');
  };

  return (
    <>
      {targets.map((target, index) => (
        <button
          key={index}
          ref={(el) => { buttonRefs.current[index] = el; }}
          className="rsc-keyboard-focus-button"
          style={{ ...target.style, opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-label={target.ariaLabel}
          onFocus={() => handleFocus(target, index)}
          onBlur={(e) => handleBlur(target, e)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </>
  );
};
