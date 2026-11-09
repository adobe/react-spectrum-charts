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
import React, {
  Children,
  ComponentProps,
  ReactElement,
  ReactNode,
  isValidElement,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { useColorMode } from '@docusaurus/theme-common';

import {
  Button,
  ButtonGroup,
  Cell,
  Column,
  Content,
  Heading,
  Provider,
  Row,
  TableBody,
  TableHeader,
  TableView,
  Text,
} from '@react-spectrum/s2';

import { Axis, ChartInspect, ChartPopover, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  legendChannelDescriptions,
  legendChannelLabels,
  legendPeriodData,
  legendVisitsData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Legend has no dev dashboard, so examples size the plot to 476 × 288, capped at 512px wide overall.
const PLOT_WIDTH = 476;
const MAX_WIDTH = 512;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 36;
const BOTTOM_AXIS_HEIGHT = 22;
const TITLE_HEIGHT = 34;
// Approximate widths of a legend label and title character.
const LABEL_CHAR_WIDTH = 6.65;
const TITLE_CHAR_WIDTH = 6;
// Room around a horizontal legend, plus the height of each row of entries.
const HORIZONTAL_LEGEND_PADDING = 31;
const HORIZONTAL_LEGEND_ROW_HEIGHT = 28;
const HORIZONTAL_LEGEND_TITLE_HEIGHT = 22;
// Room a horizontal legend entry takes beyond its label: symbol and gap to the next entry.
const HORIZONTAL_ENTRY_PADDING = 36;
// Room a vertical legend takes beyond its widest label or title.
const VERTICAL_LABEL_PADDING = 58;
const VERTICAL_TITLE_PADDING = 30;
const DEFAULT_LABEL_LIMIT = 184;
const FACET_PROPS = ['color', 'lineType', 'lineWidth', 'opacity', 'symbolShape'];

type Props = Record<string, unknown>;

const findElement = (node: ReactNode, name: string): ReactElement<Props> | undefined => {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    const element = child as ReactElement<Props>;
    const type = element.type as { displayName?: string; name?: string };
    if ((type.displayName ?? type.name) === name) return element;
    const match = findElement(element.props.children as ReactNode, name);
    if (match) return match;
  }
  return undefined;
};

/**
 * Gets the labels a chart's legend shows: one per combination of the faceted fields.
 * @param data chart data
 * @param line line props
 * @param legend legend props
 * @returns legend labels
 */
const getLegendLabels = (data: Props[], line: Props = {}, legend: Props = {}): string[] => {
  const facets = [...FACET_PROPS.map((prop) => line[prop]), ...FACET_PROPS.map((prop) => legend[prop])];
  const fields = (legend.keys as string[] | undefined) ?? [
    ...new Set(facets.filter((facet): facet is string => typeof facet === 'string')),
  ];
  const names = [...new Set(data.map((datum) => fields.map((field) => String(datum[field])).join(' | ')))];
  const hiddenEntries = (legend.hiddenEntries as string[] | undefined) ?? [];
  const labels = (legend.legendLabels as { seriesName: string; label: string }[] | undefined) ?? [];
  return names
    .filter((name) => !hiddenEntries.includes(name))
    .map((name) => labels.find((label) => label.seriesName === name)?.label ?? name);
};

/**
 * Sizes a legend example so the plot is up to 476 × 288, leaving room for the axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getLegendPreviewSize = (element: ReactElement): PreviewSize => {
  const props = element.props as { children?: ReactNode; data: Props[] };
  const legend = findElement(props.children, 'Legend')?.props;
  let width = PLOT_WIDTH + LEFT_AXIS_WIDTH;
  let height = PLOT_HEIGHT + BOTTOM_AXIS_HEIGHT + (findElement(props.children, 'Title') ? TITLE_HEIGHT : 0);
  if (!legend) return { width, height };

  const labels = getLegendLabels(props.data, findElement(props.children, 'Line')?.props, legend);
  const labelLimit = (legend.labelLimit as number | undefined) ?? DEFAULT_LABEL_LIMIT;
  const labelWidth = Math.min(Math.max(...labels.map((label) => label.length)) * LABEL_CHAR_WIDTH + 8, labelLimit);
  const title = legend.title as string | undefined;
  const position = (legend.position as string | undefined) ?? 'bottom';
  if (['left', 'right'].includes(position)) {
    const titleLimit = (legend.titleLimit as number | undefined) ?? Infinity;
    const titleWidth = title ? VERTICAL_TITLE_PADDING + Math.min(title.length * TITLE_CHAR_WIDTH, titleLimit) : 0;
    width += Math.ceil(Math.max(VERTICAL_LABEL_PADDING + labelWidth, titleWidth));
  } else {
    const columns = Math.max(1, Math.floor(PLOT_WIDTH / (labelWidth + HORIZONTAL_ENTRY_PADDING)));
    const rows = Math.ceil(labels.length / columns);
    height +=
      HORIZONTAL_LEGEND_PADDING +
      rows * HORIZONTAL_LEGEND_ROW_HEIGHT +
      (title ? HORIZONTAL_LEGEND_TITLE_HEIGHT : 0);
  }
  return { width: Math.min(width, MAX_WIDTH), height };
};

type Position = 'bottom' | 'top' | 'left' | 'right';
type Align = 'start' | 'middle' | 'end';
type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'longDash' | 'twoDash';
type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Converts a "none" or "default" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' || value === 'default' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

/** Converts a select value to a number, or undefined for "none" and "default". */
const toNumber = (value: unknown) => (optional(value) === undefined ? undefined : Number(value));

/** Axes shared by every example. */
const axes = [<Axis key="left" position="left" grid />, <Axis key="bottom" position="bottom" baseline />];

/** Line shared by most examples: one line per marketing channel. */
const channelLine = <Line dimension="day" metric="visits" color="channel" scaleType="point" />;

const legendControls: PlaygroundControl[] = [
  {
    name: 'position',
    type: 'select',
    options: ['bottom', 'top', 'left', 'right'],
    defaultValue: 'bottom',
  },
  { name: 'title', type: 'text', defaultValue: 'Channel' },
  { name: 'isToggleable', type: 'boolean', defaultValue: true },
  { name: 'highlight', type: 'boolean', defaultValue: true },
];

/**
 * Playground for the most common Legend props.
 * @returns playground element
 */
export const LegendPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, title = 'Channel', isToggleable, highlight }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend
          position={position as Position | undefined}
          title={optional(title)}
          isToggleable={isToggleable !== false}
          highlight={highlight !== false}
        />
      </Chart>
    )}
  />
);

const positionControls: PlaygroundControl[] = [
  {
    name: 'position',
    type: 'select',
    options: ['bottom', 'top', 'left', 'right'],
    defaultValue: 'bottom',
  },
  { name: 'align', type: 'select', options: ['default', 'start', 'middle', 'end'], defaultValue: 'default' },
];

/**
 * Playground for legend position and alignment.
 * @returns playground element
 */
export const LegendPositionPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={positionControls}
    component="Legend"
    render={({ position, align }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend position={position as Position | undefined} align={optional(align) as Align | undefined} />
      </Chart>
    )}
  />
);

const titleControls: PlaygroundControl[] = [
  { name: 'position', type: 'select', options: ['bottom', 'right'], defaultValue: 'right' },
  { name: 'title', type: 'text', defaultValue: 'Marketing channel (last 7 days)' },
  { name: 'titleLimit', type: 'select', options: ['none', '80', '120', '160'], defaultValue: '120' },
];

/**
 * Playground for the legend title and its truncation.
 * @returns playground element
 */
export const LegendTitlePlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={titleControls}
    component="Legend"
    render={({ position = 'right', title = 'Marketing channel (last 7 days)', titleLimit = '120' }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend position={position as Position} title={optional(title)} titleLimit={toNumber(titleLimit)} />
      </Chart>
    )}
  />
);

const hiddenEntriesControls: PlaygroundControl[] = [
  {
    name: 'hiddenEntries',
    type: 'select',
    options: ['none', 'Direct', 'Email, Direct'],
    defaultValue: 'Direct',
  },
];

/**
 * Playground for removing entries from the legend without hiding their series.
 * @returns playground element
 */
export const LegendHiddenEntriesPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={hiddenEntriesControls}
    component="Legend"
    render={({ hiddenEntries = 'Direct' }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend hiddenEntries={toList(hiddenEntries)} />
      </Chart>
    )}
  />
);

const labelControls: PlaygroundControl[] = [
  { name: 'legendLabels', label: 'Custom labels', type: 'boolean', defaultValue: true },
  { name: 'position', type: 'select', options: ['bottom', 'right'], defaultValue: 'bottom' },
  { name: 'labelLimit', type: 'select', options: ['default', '80', '100', '140'], defaultValue: 'default' },
];

/**
 * Playground for custom legend labels and label truncation.
 * @returns playground element
 */
export const LegendLabelsPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={labelControls}
    component="Legend"
    render={({ legendLabels, position, labelLimit }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend
          legendLabels={legendLabels === false ? undefined : legendChannelLabels}
          position={position as Position | undefined}
          labelLimit={toNumber(labelLimit)}
        />
      </Chart>
    )}
  />
);

const keysControls: PlaygroundControl[] = [
  { name: 'keys', type: 'select', options: ['none', 'channel', 'period'], defaultValue: 'channel' },
];

/**
 * Playground for choosing which faceted fields generate legend entries.
 * @returns playground element
 */
export const LegendKeysPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={keysControls}
    component="Legend"
    render={({ keys = 'channel' }) => (
      <Chart data={legendPeriodData}>
        {axes}
        <Line dimension="day" metric="visits" color="channel" lineType="period" scaleType="point" />
        <Legend keys={toList(keys)} />
      </Chart>
    )}
  />
);

const symbolControls: PlaygroundControl[] = [
  {
    group: 'Legend',
    name: 'symbolShape',
    type: 'select',
    options: ['default', 'circle', 'diamond', 'channel'],
    defaultValue: 'circle',
  },
  {
    group: 'Legend',
    name: 'color',
    type: 'select',
    options: ['default', 'gray-700'],
    defaultValue: 'default',
  },
  { group: 'Legend', name: 'opacity', type: 'select', options: ['default', '0.25', '0.5'], defaultValue: 'default' },
  {
    group: 'Legend',
    name: 'lineType',
    type: 'select',
    options: ['default', 'dashed', 'dotted'],
    defaultValue: 'default',
  },
  {
    group: 'Legend',
    name: 'lineWidth',
    type: 'select',
    options: ['default', 'S', 'M', 'L', 'XL'],
    defaultValue: 'default',
  },
];

/**
 * Builds a static facet value, or undefined when the select is left at its default.
 * @param value select value
 * @param toValue converts the select value
 * @returns static facet
 */
const staticFacet = <T,>(value: unknown, toValue: (text: string) => T) => {
  const text = optional(value);
  return text === undefined ? undefined : { value: toValue(text) };
};

/**
 * Playground for legend symbol shape, color, opacity, and outline.
 * @returns playground element
 */
export const LegendSymbolsPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={symbolControls}
    render={({ symbolShape = 'circle', color, opacity, lineType, lineWidth }) => (
      <Chart
        data={legendVisitsData}
        symbolShapes={symbolShape === 'channel' ? ['circle', 'square', 'diamond', 'triangle-up'] : undefined}
      >
        {axes}
        {channelLine}
        <Legend
          symbolShape={symbolShape === 'channel' ? 'channel' : staticFacet(symbolShape, String)}
          color={staticFacet(color, String)}
          opacity={staticFacet(opacity, Number)}
          lineType={staticFacet(lineType, (text) => text as LineType)}
          lineWidth={staticFacet(lineWidth, (text) => text as LineWidth)}
        />
      </Chart>
    )}
  />
);

const toggleControls: PlaygroundControl[] = [
  {
    name: 'defaultHiddenSeries',
    type: 'select',
    options: ['none', 'Email', 'Email, Direct'],
    defaultValue: 'Email',
  },
];

/**
 * Playground for a toggleable legend that starts with some series hidden.
 * @returns playground element
 */
export const LegendToggleablePlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={toggleControls}
    component="Legend"
    render={({ defaultHiddenSeries = 'Email' }) => (
      // defaultHiddenSeries is only read on mount, so remount the chart when it changes.
      <Chart key={String(defaultHiddenSeries)} data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend isToggleable defaultHiddenSeries={toList(defaultHiddenSeries)} />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  {
    group: 'Chart',
    name: 'hiddenSeries',
    type: 'select',
    options: ['none', 'Email', 'Email, Direct'],
    defaultValue: 'Email',
  },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const LegendHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={hiddenSeriesControls}
    render={({ hiddenSeries = 'Email' }) => (
      <Chart data={legendVisitsData} hiddenSeries={toList(hiddenSeries)}>
        {axes}
        {channelLine}
        <Legend />
      </Chart>
    )}
  />
);

type ChartWithTableProps = ComponentProps<typeof Chart> & { renderTable: (width?: number) => ReactNode };

/**
 * Chart with a table under it; renderTable is a function, so the code panel shows only the chart.
 * @param props Chart props and the table renderer
 * @returns chart and table
 */
const ChartWithTable = ({ renderTable, ...props }: ChartWithTableProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Chart {...props} />
    {renderTable(typeof props.width === 'number' ? props.width : undefined)}
  </div>
);
ChartWithTable.displayName = 'Chart';

/**
 * Wraps a table in a Spectrum 2 provider that follows the docs site's light or dark mode.
 * @param props
 * @returns provider element
 */
const DocsProvider = ({ children }: { children: ReactNode }) => {
  const { colorMode } = useColorMode();
  return <Provider colorScheme={colorMode}>{children}</Provider>;
};

interface Store<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * Creates a store so legend callbacks can update the table without re-rendering, and so re-embedding, the chart.
 * @param initial initial value
 * @returns store
 */
const createStore = <T,>(initial: T): Store<T> => {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

interface LegendState {
  /** Series whose legend entry is hovered. */
  hovered?: string;
  /** Last legend callback for each series. */
  lastEvents: Record<string, string>;
}

const CHANNELS = [...new Set(legendVisitsData.map((datum) => datum.channel))];

/** Sums a channel's visits for the week. */
const getChannelVisits = (channel: string) =>
  legendVisitsData.filter((datum) => datum.channel === channel).reduce((sum, datum) => sum + datum.visits, 0);

/** Bolds a cell's text while its legend entry is hovered. */
const emphasize = (text: string, isActive: boolean) => (isActive ? <strong>{text}</strong> : text);

interface ChannelTableProps {
  width?: number;
  /** Second column: visits for the week, or the last legend event. */
  column: 'visits' | 'lastEvent';
  selectedChannel?: string;
  onSelectedChannelChange: (channel?: string) => void;
  onHoverChange: (channel?: string) => void;
  legendStore: Store<LegendState>;
}

/**
 * Single-select table with one row per channel, synced with a chart.
 * @param props
 * @returns table element
 */
const ChannelTable = ({
  width,
  column,
  selectedChannel,
  onSelectedChannelChange,
  onHoverChange,
  legendStore,
}: ChannelTableProps) => {
  const { hovered, lastEvents } = useSyncExternalStore(legendStore.subscribe, legendStore.get, legendStore.get);
  const align = column === 'visits' ? 'end' : 'start';
  const getValue = (channel: string) =>
    column === 'visits' ? getChannelVisits(channel).toLocaleString('en-US') : lastEvents[channel] ?? '';
  return (
    <DocsProvider>
      <TableView
        aria-label="Channels"
        density="compact"
        selectionMode="single"
        selectedKeys={selectedChannel ? [selectedChannel] : []}
        onSelectionChange={(keys) => {
          const [key] = keys === 'all' ? [] : [...keys];
          onSelectedChannelChange(key === undefined ? undefined : String(key));
        }}
        UNSAFE_style={{ width }}
      >
        <TableHeader>
          <Column isRowHeader>Channel</Column>
          <Column align={align}>{column === 'visits' ? 'Visits' : 'Last event'}</Column>
        </TableHeader>
        <TableBody>
          {CHANNELS.map((channel) => (
            <Row
              key={channel}
              id={channel}
              onMouseEnter={() => onHoverChange(channel)}
              onMouseLeave={() => onHoverChange(undefined)}
            >
              <Cell>{emphasize(channel, channel === hovered)}</Cell>
              <Cell align={align}>{emphasize(getValue(channel), channel === hovered)}</Cell>
            </Row>
          ))}
        </TableBody>
      </TableView>
    </DocsProvider>
  );
};

/**
 * Creates a legend store and the legend callbacks that write to it.
 * @param onClick extra work for a click
 * @returns store and callbacks
 */
const useLegendStore = (onClick?: (seriesName: string) => void) => {
  const [legendStore] = useState(() => createStore<LegendState>({ lastEvents: {} }));
  const handlers = useMemo(() => {
    const log = (seriesName: string, event: string, hovered?: string) => {
      const state = legendStore.get();
      legendStore.set({ hovered, lastEvents: { ...state.lastEvents, [seriesName]: event } });
    };
    return {
      onClick: withSource((seriesName: string) => {
        log(seriesName, 'onClick', legendStore.get().hovered);
        onClick?.(seriesName);
      }, '(seriesName) => setSelectedSeries(seriesName)'),
      onMouseOver: withSource(
        (seriesName: string) => log(seriesName, 'onMouseOver', seriesName),
        '(seriesName) => setHoveredSeries(seriesName)'
      ),
      onMouseOut: withSource(
        (seriesName: string) => log(seriesName, 'onMouseOut', undefined),
        '() => setHoveredSeries(undefined)'
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legendStore]);
  return { legendStore, handlers };
};

const highlightControls: PlaygroundControl[] = [
  { group: 'Legend', name: 'highlight', type: 'boolean', defaultValue: true },
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: false },
];

/**
 * Playground for highlighting a series from a table, and table rows from the legend.
 * @returns playground element
 */
export const LegendHighlightPlayground = () => {
  const [selectedChannel, setSelectedChannel] = useState<string>();
  const [tableHoverChannel, setTableHoverChannel] = useState<string>();
  const { legendStore, handlers } = useLegendStore();
  return (
    <PropPlayground
      previewSize={getLegendPreviewSize}
      controls={highlightControls}
      render={({ highlight, inspect }) => (
        <ChartWithTable
          data={legendVisitsData}
          highlightedSeries={tableHoverChannel ?? selectedChannel}
          renderTable={(width) => (
            <ChannelTable
              width={width}
              column="visits"
              selectedChannel={selectedChannel}
              onSelectedChannelChange={setSelectedChannel}
              onHoverChange={setTableHoverChannel}
              legendStore={legendStore}
            />
          )}
        >
          {axes}
          <Line dimension="day" metric="visits" color="channel" scaleType="point">
            {inspect === true && <ChartInspect />}
          </Line>
          <Legend highlight={highlight !== false} onMouseOver={handlers.onMouseOver} onMouseOut={handlers.onMouseOut} />
        </ChartWithTable>
      )}
    />
  );
};

const descriptionControls: PlaygroundControl[] = [
  { name: 'descriptions', label: 'Show descriptions', type: 'boolean', defaultValue: true },
  { name: 'position', type: 'select', options: ['bottom', 'right'], defaultValue: 'bottom' },
];

/**
 * Playground for legend entry descriptions shown on hover.
 * @returns playground element
 */
export const LegendDescriptionsPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={descriptionControls}
    component="Legend"
    render={({ descriptions, position }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend
          descriptions={descriptions === false ? undefined : legendChannelDescriptions}
          position={position as Position | undefined}
        />
      </Chart>
    )}
  />
);

const eventControls: PlaygroundControl[] = [
  { name: 'onClick', type: 'boolean', defaultValue: true },
  { name: 'onMouseOver', type: 'boolean', defaultValue: true },
  { name: 'onMouseOut', type: 'boolean', defaultValue: true },
  { name: 'isToggleable', type: 'boolean', defaultValue: false },
];

/**
 * Playground for legend click and hover callbacks, synced with a table of channels.
 * @returns playground element
 */
export const LegendEventsPlayground = () => {
  const [selectedChannel, setSelectedChannel] = useState<string>();
  const [tableHoverChannel, setTableHoverChannel] = useState<string>();
  const { legendStore, handlers } = useLegendStore((seriesName) =>
    setSelectedChannel((channel) => (channel === seriesName ? undefined : seriesName))
  );
  return (
    <PropPlayground
      previewSize={getLegendPreviewSize}
      controls={eventControls}
      component="Legend"
      render={({ onClick, onMouseOver, onMouseOut, isToggleable }) => (
        <ChartWithTable
          data={legendVisitsData}
          highlightedSeries={tableHoverChannel ?? selectedChannel}
          renderTable={(width) => (
            <ChannelTable
              width={width}
              column="lastEvent"
              selectedChannel={selectedChannel}
              onSelectedChannelChange={setSelectedChannel}
              onHoverChange={setTableHoverChannel}
              legendStore={legendStore}
            />
          )}
        >
          {axes}
          {channelLine}
          <Legend
            onClick={onClick === false ? undefined : handlers.onClick}
            onMouseOver={onMouseOver === false ? undefined : handlers.onMouseOver}
            onMouseOut={onMouseOut === false ? undefined : handlers.onMouseOut}
            isToggleable={isToggleable as boolean | undefined}
          />
        </ChartWithTable>
      )}
    />
  );
};

const popoverContent = withSource(
  (datum: Props, close: () => void) => (
    <>
      <Heading level={4}>{String(datum.value)}</Heading>
      <Content>
        <Text>Open the {String(datum.value)} channel report</Text>
      </Content>
      <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
        <Button variant="secondary" size="S" onPress={close}>
          Close
        </Button>
      </ButtonGroup>
    </>
  ),
  `(datum, close) => (
  <>
    <Heading level={4}>{datum.value}</Heading>
    <Content>
      <Text>Open the {datum.value} channel report</Text>
    </Content>
    <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
      <Button variant="secondary" size="S" onPress={close}>Close</Button>
    </ButtonGroup>
  </>
)`,
  { '@react-spectrum/s2': ['Button', 'ButtonGroup', 'Content', 'Heading', 'Text'] }
);

const popoverControls: PlaygroundControl[] = [
  { group: 'ChartPopover', name: 'rightClick', type: 'boolean', defaultValue: false },
  {
    group: 'Legend',
    name: 'isToggleable',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.rightClick !== true,
  },
];

/**
 * Playground for a popover that opens from a legend entry.
 * @returns playground element
 */
export const LegendPopoverPlayground = () => (
  <PropPlayground
    previewSize={getLegendPreviewSize}
    controls={popoverControls}
    render={({ rightClick, isToggleable }) => (
      <Chart data={legendVisitsData}>
        {axes}
        {channelLine}
        <Legend isToggleable={rightClick === true && isToggleable === true ? true : undefined}>
          <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
            {popoverContent}
          </ChartPopover>
        </Legend>
      </Chart>
    )}
  />
);
