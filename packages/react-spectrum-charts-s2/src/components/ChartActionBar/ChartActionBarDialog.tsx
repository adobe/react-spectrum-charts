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
import {
  FC,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { ActionButton, Popover } from '@react-spectrum/s2';
import { COMPONENT_NAME } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { useChartContext } from '../../context/RscChartContext';
import type { ActionBarDetail } from '../../hooks/useActionBars';
import { clearHoverSignals, setSelectedSignals } from '../../utils';

interface ChartActionBarDialogProps {
  actionBar: ActionBarDetail;
  idKey: string;
  setIsPopoverOpen: (isOpen: boolean) => void;
  specSignalNames: ReadonlySet<string>;
  targetElement: RefObject<HTMLElement | null>;
}

const DRAG_STEP = 10;

const ChartActionBarDialog: FC<ChartActionBarDialogProps> = ({
  actionBar,
  idKey,
  setIsPopoverOpen,
  specSignalNames,
  targetElement,
}) => {
  const { chartView, selectedData, selectedDataName } = useChartContext();
  const [isOpen, setIsOpen] = useState(false);
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const containerRef = useRef<HTMLDialogElement>(null);
  const overflowAnchorRef = useRef<HTMLDivElement>(null);
  const overflowContentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startLeft: number; startTop: number } | null>(null);
  const { chartActionBarProps, name } = actionBar;
  const { children, isEmphasized, maxActions: maxActionsProp, onClearSelection } = chartActionBarProps;
  const MAX_ACTIONS = maxActionsProp ?? 4;
  const [visibleCount, setVisibleCount] = useState(MAX_ACTIONS);

  const closeActionBar = useCallback(() => {
    setIsOpen(false);
    setOverflowOpen(false);
    setIsPopoverOpen(false);
    onClearSelection?.();
    if (chartView.current) {
      const componentName = selectedDataName.current;
      selectedData.current = null;
      selectedDataName.current = '';
      if (componentName) {
        clearHoverSignals(chartView.current, componentName, specSignalNames);
      }
      setSelectedSignals({ idKey, selectedData: null, view: chartView.current });
      chartView.current.run();
    }
  }, [chartView, idKey, onClearSelection, selectedData, selectedDataName, setIsPopoverOpen, specSignalNames]);

  const allActions =
    renderDatum && renderDatum[COMPONENT_NAME] === name ? (children?.(renderDatum, closeActionBar) ?? []) : [];
  const visibleActions = allActions.slice(0, visibleCount);
  const overflowActions = allActions.slice(visibleCount);

  // Positions above the anchor before paint; flips below and clamps to the viewport.
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current || !targetElement.current) return;
    const anchorRect = targetElement.current.getBoundingClientRect();
    const { offsetWidth: barWidth, offsetHeight: barHeight } = containerRef.current;
    const hasRoomAbove = anchorRect.top - 8 - barHeight >= 0;
    const top = hasRoomAbove ? anchorRect.top - barHeight - 8 : anchorRect.bottom + 8;
    const maxLeft = Math.max(window.innerWidth - barWidth, 0);
    const maxTop = Math.max(window.innerHeight - barHeight, 0);
    containerRef.current.style.left = `${Math.min(Math.max(anchorRect.left, 0), maxLeft)}px`;
    containerRef.current.style.top = `${Math.min(Math.max(top, 0), maxTop)}px`;
  }, [isOpen, targetElement]);

  // Shrinks visibleCount until the bar no longer overflows its max-inline-size.
  useLayoutEffect(() => {
    if (!containerRef.current || visibleCount <= 1) return;
    if (containerRef.current.scrollWidth > containerRef.current.clientWidth) {
      setVisibleCount((visible) => visible - 1);
    }
  }, [visibleCount, renderDatum]);

  // Re-evaluate on window resize (more aggressive on smaller viewports).
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setVisibleCount(MAX_ACTIONS);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, MAX_ACTIONS]);

  // Reset overflow state when bar opens at a new point.
  useEffect(() => {
    setVisibleCount(MAX_ACTIONS);
    setOverflowOpen(false);
  }, [renderDatum, MAX_ACTIONS]);

  // Closes on outside click; overflowContentRef excludes the portal-rendered overflow Popover.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || overflowContentRef.current?.contains(target)) return;
      closeActionBar();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeActionBar]);

  // Escape closes the bar; the overflow Popover intercepts and handles its own Escape first.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeActionBar();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeActionBar]);

  // Focus the first action on open; restore prior focus on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  const handleDragStart = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
      };
    }
  }, []);

  // Mutates DOM directly to avoid re-render lag; clamped to the viewport.
  const handleDragMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current || !containerRef.current) return;
    const dx = event.clientX - dragStartRef.current.pointerX;
    const dy = event.clientY - dragStartRef.current.pointerY;
    const { offsetWidth, offsetHeight } = containerRef.current;
    const maxLeft = Math.max(window.innerWidth - offsetWidth, 0);
    const maxTop = Math.max(window.innerHeight - offsetHeight, 0);
    const newLeft = Math.min(Math.max(dragStartRef.current.startLeft + dx, 0), maxLeft);
    const newTop = Math.min(Math.max(dragStartRef.current.startTop + dy, 0), maxTop);
    containerRef.current.style.left = `${newLeft}px`;
    containerRef.current.style.top = `${newTop}px`;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  // Keyboard alternative to pointer dragging; arrow keys nudge by DRAG_STEP px, clamped to the viewport.
  const handleDragKeyDown = useCallback((event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!containerRef.current) return;
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case 'ArrowLeft':
        dx = -DRAG_STEP;
        break;
      case 'ArrowRight':
        dx = DRAG_STEP;
        break;
      case 'ArrowUp':
        dy = -DRAG_STEP;
        break;
      case 'ArrowDown':
        dy = DRAG_STEP;
        break;
    }
    if (dx === 0 && dy === 0) return;
    event.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = containerRef.current;
    const maxLeft = Math.max(window.innerWidth - offsetWidth, 0);
    const maxTop = Math.max(window.innerHeight - offsetHeight, 0);
    containerRef.current.style.left = `${Math.min(Math.max(rect.left + dx, 0), maxLeft)}px`;
    containerRef.current.style.top = `${Math.min(Math.max(rect.top + dy, 0), maxTop)}px`;
  }, []);

  return (
    <>
      <button
        id={`${name}-actionbar-button`}
        style={{ display: 'none' }}
        onClick={() => {
          setRenderDatum(selectedData.current);
          setIsOpen(true);
          setIsPopoverOpen(true);
        }}
      />
      {isOpen && (
        <dialog
          ref={containerRef}
          open
          aria-label="Action bar"
          data-testid="rsc-action-bar"
          className={`rsc-popover rsc-action-bar${isEmphasized ? ' rsc-action-bar--emphasized' : ''}`}
          style={{ position: 'fixed', zIndex: 10000 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', whiteSpace: 'nowrap' }}>
            <button
              type="button"
              className="rsc-action-bar-drag-handle"
              data-testid="rsc-action-bar-drag-handle"
              aria-label="Drag to reposition action bar. Use arrow keys to move."
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onKeyDown={handleDragKeyDown}
            />
            {visibleActions}
            {overflowActions.length > 0 && (
              <div ref={overflowAnchorRef} style={{ position: 'relative' }}>
                <ActionButton
                  isQuiet
                  aria-label="More actions"
                  aria-haspopup="true"
                  aria-expanded={overflowOpen}
                  onPress={() => setOverflowOpen((open) => !open)}
                >
                  ···
                </ActionButton>
                <Popover
                  triggerRef={overflowAnchorRef}
                  isOpen={overflowOpen}
                  onOpenChange={setOverflowOpen}
                  placement="top"
                  hideArrow
                  padding="none"
                  UNSAFE_className="rsc-popover"
                >
                  <div ref={overflowContentRef} className="rsc-action-bar-overflow" data-testid="rsc-action-bar-overflow">
                    {overflowActions}
                  </div>
                </Popover>
              </div>
            )}
          </div>
        </dialog>
      )}
    </>
  );
};

export { ChartActionBarDialog };