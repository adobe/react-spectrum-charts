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
import { CSSProperties, ComponentRef, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ActionButton, Popover } from '@react-spectrum/s2';
import {
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  ROUNDED_SQUARE_PATH,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';
import {
  expressionFunctions,
  getLegendColumnLayout,
  getLegendColumnLayoutForPage,
  getLegendPages,
  legendSymbolShape,
  wrapLabelText,
} from '@spectrum-charts/vega-spec-builder-s2';

import { LegendItem, LegendProps } from '../../types/legend.types.js';

type Props = Pick<
  LegendProps,
  | 'align'
  | 'colorScheme'
  | 'dataTestId'
  | 'hiddenSeries'
  | 'hiddenEntries'
  | 'labelLimit'
  | 'onClick'
  | 'onMouseOut'
  | 'onMouseOver'
  | 'overflow'
  | 'preferredColumns'
  | 'maxRows'
  | 'labelWrap'
  | 'onPagesChange'
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
  const automatic = props.preferredColumns === 'auto';
  const preferred = !side && !scroll && Boolean(props.preferredColumns?.length);
  if (
    (props.preferredColumns !== 'auto' &&
      props.preferredColumns?.some((columns) => !Number.isInteger(columns) || columns < 1)) ||
    (props.maxRows !== undefined && (!Number.isInteger(props.maxRows) || props.maxRows < 1)) ||
    (props.labelWrap !== undefined && (!Number.isInteger(props.labelWrap) || props.labelWrap < 1))
  ) {
    throw new Error('Standalone legend columns, row limits, and line limits must be positive integers.');
  }
  const list = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState<number>();
  const [fontRevision, setFontRevision] = useState(0);
  useLayoutEffect(() => {
    if (!preferred || !list.current) return;
    let active = true;
    let previous: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (next === previous) return;
      clearTimeout(timer);
      if (previous === undefined) setWidth(next);
      else timer = setTimeout(() => setWidth(next), 150);
      previous = next;
    });
    observer.observe(list.current);
    const refreshFonts = () => {
      if (active) setFontRevision((revision) => revision + 1);
    };
    document.fonts?.ready.then(refreshFonts);
    document.fonts?.addEventListener('loadingdone', refreshFonts);
    return () => {
      active = false;
      clearTimeout(timer);
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', refreshFonts);
    };
  }, [preferred]);
  const labelsKey = JSON.stringify(props.items.map((item) => [item.seriesName, item.label]));
  const measured = useMemo(
    () =>
      (preferred ? props.items : []).map((item) => ({
        entryKey: item.seriesName,
        displayLabel: item.label,
        labelWidth: expressionFunctions.getLabelWidth(item.label, 'normal', 14),
      })),
    // Color and visibility edits do not change label measurements.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferred, labelsKey, fontRevision]
  );
  const automaticLabelWidth = Math.min(
    props.labelLimit ?? DEFAULT_LEGEND_LABEL_LIMIT,
    measured.reduce((maximum, item) => Math.max(maximum, item.labelWidth), 0)
  );
  const itemChrome = DEFAULT_LEGEND_SYMBOL_WIDTH + 6;
  const automaticColumns = Math.max(
    1,
    Math.min(
      props.items.length,
      Math.floor(
        ((width ?? 0) + DEFAULT_LEGEND_COLUMN_PADDING) /
          (automaticLabelWidth + itemChrome + DEFAULT_LEGEND_COLUMN_PADDING)
      )
    )
  );
  const candidates = props.preferredColumns === 'auto' ? [automaticColumns] : props.preferredColumns ?? [];
  const lines = props.labelWrap ?? 1;
  const pages =
    preferred && props.maxRows ? getLegendPages(measured, width ?? 0, candidates, props.maxRows, lines) : [];
  const pagesKey = JSON.stringify(pages);
  const measuredWidth = width !== undefined;
  useLayoutEffect(() => {
    if (preferred && measuredWidth && props.maxRows) props.onPagesChange?.(pages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesKey, preferred, measuredWidth, props.maxRows, props.onPagesChange]);
  const visible = measured.filter((item) => !props.hiddenEntries?.includes(item.entryKey));
  const layout = preferred
    ? props.maxRows
      ? getLegendColumnLayoutForPage(visible, measured, pages, candidates, width ?? 0, lines)
      : getLegendColumnLayout(visible, width ?? 0, candidates, lines)
    : undefined;
  const visibleItems = props.items
    .filter((item) => !props.hiddenEntries?.includes(item.seriesName))
    .slice(0, layout && props.maxRows ? layout.columns * props.maxRows : undefined);
  const wrapWidth = layout
    ? Math.max(
        1,
        automatic
          ? Math.min(
              props.labelLimit ?? DEFAULT_LEGEND_LABEL_LIMIT,
              ((width ?? 0) - (layout.columns - 1) * DEFAULT_LEGEND_COLUMN_PADDING) / layout.columns - itemChrome
            )
          : lines > 1
          ? layout.wrapWidth
          : layout.labelLimit || width || 1
      )
    : undefined;
  const wrapped = new Map(
    layout
      ? visibleItems.map((item) => [item.seriesName, wrapLabelText(item.label, wrapWidth ?? 1, lines).join('\n')])
      : []
  );
  const columnWidths: number[] = new Array(Math.max(1, Math.min(layout?.columns ?? 1, visibleItems.length))).fill(0);
  if (layout && !automatic) {
    visibleItems.forEach((item, index) => {
      const textWidth = Math.max(
        0,
        ...(wrapped.get(item.seriesName) ?? '')
          .split('\n')
          .map((line) => expressionFunctions.getLabelWidth(line, 'normal', 14))
      );
      const column = index % layout.columns;
      columnWidths[column] = Math.max(columnWidths[column], Math.min(wrapWidth ?? 1, textWidth));
    });
  }
  const preferredGrid = columnWidths.map((value) => `${Math.ceil(value) + 22}px`).join(' ');
  const align = props.align ?? (side ? 'middle' : 'start');
  return (
    <ul
      ref={list}
      data-testid={props.dataTestId}
      className="rsc-legend"
      style={{
        display: side || scroll ? 'flex' : 'grid',
        gridTemplateColumns: layout
          ? automatic
            ? `repeat(${layout.columns}, minmax(0, 1fr))`
            : preferredGrid
          : side || scroll
          ? undefined
          : `repeat(auto-fit, minmax(0, ${(props.labelLimit ?? DEFAULT_LEGEND_LABEL_LIMIT) + 32}px))`,
        flexDirection: side ? 'column' : 'row',
        flexWrap: side || scroll ? 'nowrap' : 'wrap',
        alignItems: side || scroll ? 'stretch' : 'center',
        justifyContent: scroll || align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
        gap: 0,
        rowGap: layout ? 8 : undefined,
        columnGap: layout ? DEFAULT_LEGEND_COLUMN_PADDING : undefined,
        padding: 0,
        margin: 0,
        listStyle: 'none',
        boxSizing: 'border-box',
        minHeight: side && align === 'middle' ? '100%' : undefined,
        width: scroll ? 'max-content' : undefined,
        minWidth: scroll ? '100%' : 0,
      }}
    >
      {visibleItems.map((item) => (
        <StandaloneLegendEntry
          key={item.seriesName}
          {...props}
          item={item}
          side={side}
          compact={side || scroll}
          wrappedLabel={wrapped.get(item.seriesName)}
          wrapWidth={wrapWidth}
        />
      ))}
    </ul>
  );
}

function StandaloneLegendEntry({
  item,
  side,
  compact,
  wrappedLabel,
  wrapWidth,
  ...props
}: Props & {
  item: LegendItem;
  side: boolean;
  compact: boolean;
  wrappedLabel?: string;
  wrapWidth?: number;
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
    minHeight: wrappedLabel !== undefined ? 18 : undefined,
    maxWidth: '100%',
    width: side ? '100%' : undefined,
    padding: wrappedLabel !== undefined ? 0 : compact ? `4px ${side ? 8 : 12}px` : undefined,
    boxSizing: 'border-box',
    whiteSpace: wrappedLabel !== undefined ? 'pre-line' : 'nowrap',
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
          fontSize: wrappedLabel !== undefined ? 14 : 12,
          lineHeight: wrappedLabel !== undefined ? '14px' : '18px',
          whiteSpace: wrappedLabel !== undefined ? 'pre-line' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: wrapWidth ?? props.labelLimit,
          color: textColor,
        }}
      >
        {wrappedLabel ?? item.label}
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
            aria-label={wrappedLabel !== undefined ? item.label : undefined}
            aria-describedby={item.description ? descriptionId : undefined}
            aria-haspopup={props.renderContextMenu ? 'dialog' : undefined}
            aria-expanded={props.renderContextMenu ? open : undefined}
            aria-keyshortcuts={props.renderContextMenu ? 'Shift+F10' : undefined}
            UNSAFE_style={{
              fontSize: 12,
              fontWeight: 400,
              maxWidth: '100%',
              height: 'auto',
              minHeight: wrappedLabel !== undefined ? 18 : 28,
              whiteSpace: 'normal',
              width: side ? '100%' : undefined,
              padding: compact || wrappedLabel !== undefined ? 0 : undefined,
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
