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
import { CSSProperties, ComponentRef, useId, useLayoutEffect, useRef, useState } from 'react';

import { ActionButton, Popover } from '@react-spectrum/s2';
import { DEFAULT_LEGEND_SYMBOL_WIDTH, ROUNDED_SQUARE_PATH } from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';
import { legendSymbolShape } from '@spectrum-charts/vega-spec-builder-s2';

import { LegendItem, LegendProps } from '../../types/legend.types.js';

type Props = Pick<
  LegendProps,
  | 'align'
  | 'colorScheme'
  | 'dataTestId'
  | 'hiddenSeries'
  | 'labelLimit'
  | 'onClick'
  | 'onMouseOut'
  | 'onMouseOver'
  | 'overflow'
  | 'position'
  | 'renderContextMenu'
> & { items: readonly LegendItem[] };

export function StandaloneLegend(props: Props) {
  const names = new Set<string>();
  for (const item of props.items) {
    if (!item.seriesName.trim() || names.has(item.seriesName) || !item.label.trim() || !item.color.trim()) {
      throw new Error('Standalone legend items require unique nonempty series names, nonempty labels, and colors.');
    }
    names.add(item.seriesName);
  }
  const side = props.position === 'left' || props.position === 'right';
  const scroll = !side && props.overflow === 'scroll';
  const align = props.align ?? (side ? 'middle' : 'start');
  return (
    <ul
      data-testid={props.dataTestId}
      className="rsc-legend"
      style={{
        display: 'flex',
        flexDirection: side ? 'column' : 'row',
        flexWrap: side || scroll ? 'nowrap' : 'wrap',
        alignItems: side || scroll ? 'stretch' : 'center',
        justifyContent: scroll || align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
        gap: side || scroll ? 0 : '4px 12px',
        padding: side || scroll ? 0 : '4px 12px',
        margin: 0,
        listStyle: 'none',
        boxSizing: 'border-box',
        minHeight: side && align === 'middle' ? '100%' : undefined,
        width: scroll ? 'max-content' : undefined,
        minWidth: scroll ? '100%' : 0,
      }}
    >
      {props.items.map((item) => (
        <StandaloneLegendEntry key={item.seriesName} {...props} item={item} side={side} compact={side || scroll} />
      ))}
    </ul>
  );
}

function StandaloneLegendEntry({
  item,
  side,
  compact,
  ...props
}: Props & {
  item: LegendItem;
  side: boolean;
  compact: boolean;
}) {
  const button = useRef<ComponentRef<typeof ActionButton>>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const descriptionId = useId();
  const hidden = props.hiddenSeries?.includes(item.seriesName) ?? false;
  const textColor = getS2ColorValue(hidden ? 'gray-500' : 'gray-700', props.colorScheme ?? 'light');
  const color = hidden ? textColor : getS2ColorValue(item.color, props.colorScheme ?? 'light');
  const interactive = Boolean(props.onClick || props.onMouseOver || props.onMouseOut || props.renderContextMenu);
  useLayoutEffect(() => {
    if (!open && wasOpen.current) button.current?.focus();
    wasOpen.current = open;
  }, [open]);
  useLayoutEffect(() => {
    if (!props.renderContextMenu) setOpen(false);
  }, [props.renderContextMenu]);
  const contentStyle: CSSProperties = {
    display: 'inline-grid',
    gridTemplateColumns: `${DEFAULT_LEGEND_SYMBOL_WIDTH}px minmax(0, 1fr)`,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    maxWidth: '100%',
    width: side ? '100%' : undefined,
    padding: compact ? `4px ${side ? 8 : 12}px` : undefined,
    boxSizing: 'border-box',
    whiteSpace: 'normal',
    textAlign: 'start',
  };
  const content = (
    <>
      <svg
        aria-hidden="true"
        focusable="false"
        width={DEFAULT_LEGEND_SYMBOL_WIDTH}
        height={DEFAULT_LEGEND_SYMBOL_WIDTH}
        viewBox="-1.1 -1.1 2.2 2.2"
      >
        <path d={legendSymbolShape(ROUNDED_SQUARE_PATH, hidden)} fill={color} />
      </svg>
      <span
        className="rsc-legend-label"
        title={item.description ?? item.label}
        style={{
          fontSize: 12,
          lineHeight: '18px',
          overflowWrap: 'anywhere',
          maxWidth: props.labelLimit,
          color: textColor,
        }}
      >
        {item.label}
      </span>
    </>
  );
  return (
    <li
      className="rsc-legend-entry"
      style={{
        display: 'flex',
        minWidth: 0,
        maxWidth: compact && !side ? undefined : '100%',
        flexShrink: compact ? 0 : undefined,
      }}
    >
      {item.description && (
        <span
          id={descriptionId}
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}
        >
          {item.description}
        </span>
      )}
      {interactive ? (
        <span
          ref={anchor}
          style={{ display: 'inline-flex', minWidth: 0, maxWidth: '100%', width: side ? '100%' : undefined }}
          onMouseOverCapture={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
              props.onMouseOver?.(item.seriesName);
            }
          }}
          onMouseOutCapture={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
              props.onMouseOut?.(item.seriesName);
            }
          }}
          onContextMenu={
            props.renderContextMenu
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  button.current?.focus();
                  setOpen(true);
                }
              : undefined
          }
        >
          <ActionButton
            ref={button}
            isQuiet
            size="S"
            aria-pressed={!hidden}
            aria-describedby={item.description ? descriptionId : undefined}
            aria-haspopup={props.renderContextMenu ? 'dialog' : undefined}
            aria-expanded={props.renderContextMenu ? open : undefined}
            aria-keyshortcuts={props.renderContextMenu ? 'Shift+F10' : undefined}
            UNSAFE_style={{
              fontSize: 12,
              fontWeight: 400,
              maxWidth: '100%',
              height: 'auto',
              minHeight: 28,
              whiteSpace: 'normal',
              width: side ? '100%' : undefined,
              padding: compact ? 0 : undefined,
              justifyContent: compact ? 'flex-start' : undefined,
            }}
            onPress={() => props.onClick?.(item.seriesName)}
            onFocus={() => props.onMouseOver?.(item.seriesName)}
            onBlur={() => props.onMouseOut?.(item.seriesName)}
            onKeyDown={(event) => {
              if (props.renderContextMenu && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
                event.preventDefault();
                setOpen(true);
              } else event.continuePropagation();
            }}
          >
            <span className="rsc-legend-content" style={contentStyle}>
              {content}
            </span>
          </ActionButton>
        </span>
      ) : (
        <span className="rsc-legend-content" style={contentStyle}>
          {content}
        </span>
      )}
      {props.renderContextMenu && (
        <Popover
          hideArrow
          triggerRef={anchor}
          isOpen={open}
          onOpenChange={setOpen}
          role="dialog"
          aria-label={item.label}
        >
          {open ? props.renderContextMenu(item.seriesName, () => setOpen(false)) : null}
        </Popover>
      )}
    </li>
  );
}
