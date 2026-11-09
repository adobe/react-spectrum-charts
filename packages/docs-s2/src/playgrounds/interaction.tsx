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

import {
  Axis,
  Bar,
  ChartInspect,
  ChartPopover,
  Datum,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  interactionDownloadsData,
  interactionEstimatesData,
  interactionVisitorsData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// A 471 × 288 plot, plus room for axes and legend, keeps examples within 512px wide.
const PLOT_WIDTH = 471;
const PLOT_HEIGHT = 288;
const AXIS_WIDTH = 11;
const AXIS_HEIGHT = 24;
const AXIS_TITLE_WIDTH = 30;
const AXIS_TITLE_HEIGHT = 25;
const LEGEND_HEIGHT = 64;

const findElements = (node: ReactNode, name: string): ReactElement<Record<string, unknown>>[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    const matches = (type.displayName ?? type.name) === name ? [element] : [];
    return [...matches, ...findElements(element.props.children as ReactNode, name)];
  });

/**
 * Sizes an example so the plot is 471 × 288, leaving room for axes, axis titles, and a bottom legend.
 * @param element chart element
 * @returns preview width and height
 */
const getInteractionPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  const axes = findElements(children, 'Axis');
  const hasTitle = (position: string) => axes.some((axis) => axis.props.position === position && axis.props.title);
  const hasLegend = findElements(children, 'Legend').length > 0;
  return {
    width: PLOT_WIDTH + AXIS_WIDTH + (hasTitle('left') ? AXIS_TITLE_WIDTH : 0),
    height: PLOT_HEIGHT + AXIS_HEIGHT + (hasTitle('bottom') ? AXIS_TITLE_HEIGHT : 0) + (hasLegend ? LEGEND_HEIGHT : 0),
  };
};

type Mark = 'Line' | 'Bar';
type HighlightBy = 'item' | 'series' | 'dimension';
type Target = 'item' | 'dimensionArea';

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

/** Converts a numeric select value, keeping 'auto'. */
const toSize = (value: unknown): number | 'auto' | undefined => {
  const size = optional(value);
  if (size === 'auto') return 'auto';
  return size === undefined ? undefined : Number(size);
};

const formatNumber = (value: unknown) => Number(value).toLocaleString('en-US');

const visitorsContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.device)}, {String(datum.month)}: {formatNumber(datum.visitors)} visitors
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.device}, {datum.month}: {datum.visitors} visitors\n  </div>\n)'
);

const downloadsContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.browser)} on {String(datum.os)}: {formatNumber(datum.downloads)} downloads
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.browser} on {datum.os}: {datum.downloads} downloads\n  </div>\n)'
);

const S2_POPOVER_IMPORTS = { '@react-spectrum/s2': ['Button', 'ButtonGroup', 'Content', 'Heading', 'Text'] };

/**
 * Builds popover content from Spectrum 2 components: a heading, a line of text, and a Close button.
 * @param heading heading text
 * @param text body text
 * @param close closes the popover
 * @returns popover content
 */
const renderPopover = (heading: string, text: string, close: () => void) => (
  <>
    <Heading level={4}>{heading}</Heading>
    <Content>
      <Text>{text}</Text>
    </Content>
    <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
      <Button variant="secondary" size="S" onPress={close}>
        Close
      </Button>
    </ButtonGroup>
  </>
);

/**
 * Builds the source shown for renderPopover content.
 * @param heading heading expression
 * @param text body text JSX
 * @returns popover source
 */
const popoverSource = (heading: string, text: string) =>
  [
    '(datum, close) => (',
    '  <>',
    `    <Heading level={4}>{${heading}}</Heading>`,
    '    <Content>',
    `      <Text>${text}</Text>`,
    '    </Content>',
    '    <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>',
    '      <Button variant="secondary" size="S" onPress={close}>Close</Button>',
    '    </ButtonGroup>',
    '  </>',
    ')',
  ].join('\n');

const visitorsPopoverContent = withSource(
  (datum: Datum, close: () => void) =>
    renderPopover(String(datum.device), `${datum.month}: ${formatNumber(datum.visitors)} visitors`, close),
  popoverSource('datum.device', '{datum.month}: {datum.visitors} visitors'),
  S2_POPOVER_IMPORTS
);

const downloadsPopoverContent = withSource(
  (datum: Datum, close: () => void) =>
    renderPopover(String(datum.browser), `${datum.os}: ${formatNumber(datum.downloads)} downloads`, close),
  popoverSource('datum.browser', '{datum.os}: {datum.downloads} downloads'),
  S2_POPOVER_IMPORTS
);

const visitorsAxes = [
  <Axis key="left" position="left" grid title="Visitors" />,
  <Axis key="bottom" position="bottom" baseline title="Month" />,
];

const downloadsAxes = [
  <Axis key="left" position="left" grid title="Downloads" />,
  <Axis key="bottom" position="bottom" baseline title="Browser" />,
];

/**
 * Renders a Line or Bar example with the given interactive children.
 * @param mark which mark to render
 * @param children ChartInspect and ChartPopover elements
 * @param chartProps extra Chart props
 * @returns chart element
 */
const renderMark = (mark: Mark, children: ReactNode, chartProps: Record<string, unknown> = {}) =>
  mark === 'Bar' ? (
    <Chart data={interactionDownloadsData} {...chartProps}>
      {downloadsAxes}
      <Bar dimension="browser" metric="downloads" color="os">
        {children as ReactElement[]}
      </Bar>
      <Legend />
    </Chart>
  ) : (
    <Chart data={interactionVisitorsData} {...chartProps}>
      {visitorsAxes}
      <Line dimension="month" metric="visitors" color="device" scaleType="point">
        {children as ReactElement[]}
      </Line>
      <Legend />
    </Chart>
  );

const markControl: PlaygroundControl = {
  group: 'Example',
  name: 'mark',
  label: 'Mark',
  doc: 'Chart',
  type: 'select',
  options: ['Line', 'Bar'],
  defaultValue: 'Line',
};

const interactionControls: PlaygroundControl[] = [
  markControl,
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  {
    group: 'ChartInspect',
    name: 'highlightBy',
    type: 'select',
    options: ['item', 'series', 'dimension'],
    defaultValue: 'item',
    isDisabled: (values) => !values.inspect,
  },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => !values.popover,
  },
];

/**
 * Playground for ChartInspect and ChartPopover on a line or bar chart.
 * @returns playground element
 */
export const InteractionPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={interactionControls}
    render={({ mark = 'Line', inspect, highlightBy, popover, rightClick }) => {
      const isBar = mark === 'Bar';
      return renderMark(
        mark as Mark,
        [
          inspect !== false && (
            <ChartInspect key="inspect" highlightBy={highlightBy as HighlightBy | undefined}>
              {isBar ? downloadsContent : visitorsContent}
            </ChartInspect>
          ),
          popover !== false && (
            <ChartPopover key="popover" rightClick={rightClick as boolean | undefined}>
              {isBar ? downloadsPopoverContent : visitorsPopoverContent}
            </ChartPopover>
          ),
        ].filter(Boolean)
      );
    }}
  />
);

const RAW_KEYS_HIDDEN = new Set(['rscGroupData']);

const rawDatumContent = withSource(
  (datum: Datum) => (
    <pre style={{ margin: 0, fontSize: 12 }}>
      {JSON.stringify(
        Object.fromEntries(Object.entries(datum).filter(([key]) => !RAW_KEYS_HIDDEN.has(key))),
        null,
        2
      )}
    </pre>
  ),
  '(datum) => <pre>{JSON.stringify(datum, null, 2)}</pre>'
);

const contentControls: PlaygroundControl[] = [
  markControl,
  {
    group: 'ChartInspect',
    name: 'content',
    doc: 'ChartInspect.children',
    type: 'select',
    options: ['formatted', 'raw datum', 'none'],
    defaultValue: 'raw datum',
  },
];

/**
 * Playground for the datum passed to ChartInspect children.
 * @returns playground element
 */
export const InteractionContentPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={contentControls}
    render={({ mark = 'Line', content = 'raw datum' }) => {
      const formatted = mark === 'Bar' ? downloadsContent : visitorsContent;
      const contentByOption: Record<string, ((datum: Datum) => ReactNode) | undefined> = {
        formatted,
        'raw datum': rawDatumContent,
      };
      return renderMark(mark as Mark, <ChartInspect>{contentByOption[String(content)]}</ChartInspect>);
    }}
  />
);

const groupVisitorsContent = withSource(
  (datum: Datum) => {
    const group = (datum.rscGroupData as Datum[] | undefined) ?? [datum];
    const total = group.reduce((sum, row) => sum + Number(row.visitors), 0);
    return (
      <div>
        {group.length} points, {formatNumber(total)} visitors
      </div>
    );
  },
  `(datum) => {
  const group = datum.rscGroupData ?? [datum];
  const total = group.reduce((sum, row) => sum + row.visitors, 0);
  return <div>{group.length} points, {total} visitors</div>;
}`
);

const groupDownloadsContent = withSource(
  (datum: Datum) => {
    const group = (datum.rscGroupData as Datum[] | undefined) ?? [datum];
    const total = group.reduce((sum, row) => sum + Number(row.downloads), 0);
    return (
      <div>
        {group.length} bars, {formatNumber(total)} downloads
      </div>
    );
  },
  `(datum) => {
  const group = datum.rscGroupData ?? [datum];
  const total = group.reduce((sum, row) => sum + row.downloads, 0);
  return <div>{group.length} bars, {total} downloads</div>;
}`
);

const highlightByControls: PlaygroundControl[] = [
  markControl,
  {
    group: 'ChartInspect',
    name: 'highlightBy',
    type: 'select',
    options: ['item', 'series', 'dimension'],
    defaultValue: 'series',
  },
];

/**
 * Playground for which marks stay highlighted while the inspect is visible.
 * @returns playground element
 */
export const InteractionHighlightByPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={highlightByControls}
    render={({ mark = 'Line', highlightBy = 'series' }) =>
      renderMark(
        mark as Mark,
        <ChartInspect highlightBy={highlightBy as HighlightBy}>
          {mark === 'Bar' ? groupDownloadsContent : groupVisitorsContent}
        </ChartInspect>
      )
    }
  />
);

const targetsControls: PlaygroundControl[] = [
  {
    group: 'ChartInspect',
    name: 'targets',
    type: 'select',
    options: ['item', 'dimensionArea', 'dimensionArea, item'],
    defaultValue: 'dimensionArea, item',
  },
];

/**
 * Playground for inspecting a whole stacked column from the space around it.
 * @returns playground element
 */
export const InteractionTargetsPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={targetsControls}
    render={({ targets = 'dimensionArea, item' }) =>
      renderMark(
        'Bar',
        <ChartInspect targets={toList(targets) as Target[]}>{groupDownloadsContent}</ChartInspect>
      )
    }
  />
);

const estimateContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.browser)} on {String(datum.os)}: {formatNumber(datum.downloads)} downloads
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.browser} on {datum.os}: {datum.downloads} downloads\n  </div>\n)'
);

const excludeControls: PlaygroundControl[] = [
  {
    group: 'ChartInspect',
    name: 'excludeDataKeys',
    type: 'select',
    options: ['none', 'isEstimate'],
    defaultValue: 'isEstimate',
  },
];

/**
 * Playground for turning off the inspect on flagged rows.
 * @returns playground element
 */
export const InteractionExcludePlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={excludeControls}
    render={({ excludeDataKeys = 'isEstimate' }) => (
      <Chart data={interactionEstimatesData}>
        {downloadsAxes}
        <Bar dimension="browser" metric="downloads" color="os">
          <ChartInspect excludeDataKeys={toList(excludeDataKeys)}>{estimateContent}</ChartInspect>
        </Bar>
        <Legend />
      </Chart>
    )}
  />
);

const sizeContent = withSource(
  (datum: Datum, close: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.4 }}>
      <strong style={{ fontSize: 16 }}>
        {String(datum.browser)} on {String(datum.os)}
      </strong>
      <span>
        {formatNumber(datum.downloads)} downloads this quarter. Use the popover for details and actions that
        don&apos;t fit in a tooltip, like links to a report or a filter.
      </span>
      <button style={{ alignSelf: 'flex-start', cursor: 'pointer' }} onClick={close}>
        Close
      </button>
    </div>
  ),
  `(datum, close) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <strong>{datum.browser} on {datum.os}</strong>
    <span>{datum.downloads} downloads this quarter. …</span>
    <button onClick={close}>Close</button>
  </div>
)`
);

const sizeControls: PlaygroundControl[] = [
  {
    group: 'Width',
    name: 'width',
    doc: 'ChartPopover.width',
    type: 'select',
    options: ['none', 'auto', '200', '320'],
    defaultValue: '320',
  },
  {
    group: 'Width',
    name: 'minWidth',
    doc: 'ChartPopover.minWidth',
    type: 'number',
    min: 0,
    max: 400,
    step: 20,
    defaultValue: 0,
  },
  {
    group: 'Width',
    name: 'maxWidth',
    doc: 'ChartPopover.maxWidth',
    type: 'select',
    options: ['none', '240', '400'],
    defaultValue: 'none',
  },
  {
    group: 'Height',
    name: 'height',
    doc: 'ChartPopover.height',
    type: 'select',
    options: ['none', 'auto', '120', '200'],
    defaultValue: 'none',
  },
  {
    group: 'Height',
    name: 'minHeight',
    doc: 'ChartPopover.minHeight',
    type: 'select',
    options: ['none', '160', '240'],
    defaultValue: 'none',
  },
  {
    group: 'Height',
    name: 'maxHeight',
    doc: 'ChartPopover.maxHeight',
    type: 'select',
    options: ['none', '100', '160'],
    defaultValue: 'none',
  },
  {
    group: 'Spacing',
    name: 'contentMargin',
    doc: 'ChartPopover.contentMargin',
    type: 'number',
    min: 0,
    max: 32,
    step: 4,
    defaultValue: 12,
  },
  {
    group: 'Spacing',
    name: 'containerPadding',
    doc: 'ChartPopover.containerPadding',
    type: 'number',
    min: 0,
    max: 48,
    step: 4,
    defaultValue: 12,
  },
];

/**
 * Playground for popover width, height, and spacing.
 * @returns playground element
 */
export const InteractionPopoverSizePlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={sizeControls}
    render={({ width = '320', minWidth, maxWidth, height, minHeight, maxHeight, contentMargin, containerPadding }) =>
      renderMark(
        'Bar',
        <ChartPopover
          width={toSize(width)}
          minWidth={minWidth as number | undefined}
          maxWidth={toSize(maxWidth) as number | undefined}
          height={toSize(height)}
          minHeight={toSize(minHeight) as number | undefined}
          maxHeight={toSize(maxHeight) as number | undefined}
          contentMargin={contentMargin as number | undefined}
          containerPadding={containerPadding as number | undefined}
        >
          {sizeContent}
        </ChartPopover>
      )
    }
  />
);

const anchorControls: PlaygroundControl[] = [
  markControl,
  {
    group: 'Chart',
    name: 'tooltipAnchor',
    type: 'select',
    options: ['cursor', 'mark'],
    defaultValue: 'mark',
  },
  {
    group: 'Chart',
    name: 'tooltipPlacement',
    type: 'select',
    options: ['top', 'bottom', 'left', 'right'],
    defaultValue: 'top',
    isDisabled: (values) => values.tooltipAnchor !== 'mark',
  },
];

/**
 * Playground for where the inspect tooltip appears.
 * @returns playground element
 */
export const InteractionAnchorPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={anchorControls}
    render={({ mark = 'Line', tooltipAnchor = 'mark', tooltipPlacement }) =>
      renderMark(
        mark as Mark,
        <ChartInspect>{mark === 'Bar' ? downloadsContent : visitorsContent}</ChartInspect>,
        { tooltipAnchor, tooltipPlacement }
      )
    }
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
 * Creates a store so chart callbacks can update the table without re-rendering, and so re-embedding, the chart.
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

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OPERATING_SYSTEMS = ['Windows', 'Mac', 'Linux'];
const downloadsById = new Map(interactionDownloadsData.map((datum) => [datum.id, datum.downloads]));

/** Gets the row IDs for a browser's bars. */
const getBrowserIds = (browser: string) => OPERATING_SYSTEMS.map((os) => `${browser}-${os}`);

interface BrowserTableProps {
  width?: number;
  selectedBrowsers: Set<string>;
  onSelectionChange: (browsers: Set<string>) => void;
  onHoverChange: (browser?: string) => void;
  /** ID of the bar hovered in the chart; its cell is bolded. */
  hoveredIdStore: Store<string | undefined>;
}

/**
 * Table of downloads with a row per browser and a column per operating system.
 * @param props
 * @returns table element
 */
const BrowserTable = ({ width, selectedBrowsers, onSelectionChange, onHoverChange, hoveredIdStore }: BrowserTableProps) => {
  const hoveredId = useSyncExternalStore(hoveredIdStore.subscribe, hoveredIdStore.get, hoveredIdStore.get);
  return (
    <DocsProvider>
      <TableView
        aria-label="Downloads by browser"
        density="compact"
        selectionMode="multiple"
        selectedKeys={selectedBrowsers}
        onSelectionChange={(keys) => onSelectionChange(new Set(keys === 'all' ? BROWSERS : [...keys].map(String)))}
        UNSAFE_style={{ width }}
      >
        <TableHeader>
          <Column isRowHeader>Browser</Column>
          {OPERATING_SYSTEMS.map((os) => (
            <Column key={os} align="end">
              {os}
            </Column>
          ))}
        </TableHeader>
        <TableBody>
          {BROWSERS.map((browser) => (
            <Row
              key={browser}
              id={browser}
              onMouseEnter={() => onHoverChange(browser)}
              onMouseLeave={() => onHoverChange(undefined)}
            >
              <Cell>{browser}</Cell>
              {getBrowserIds(browser).map((id) => {
                const downloads = formatNumber(downloadsById.get(id));
                return (
                  <Cell key={id} align="end">
                    {id === hoveredId ? <strong>{downloads}</strong> : downloads}
                  </Cell>
                );
              })}
            </Row>
          ))}
        </TableBody>
      </TableView>
    </DocsProvider>
  );
};

/**
 * Playground for highlighting bars from table rows, and table cells from hovered bars.
 * @returns playground element
 */
export const InteractionHighlightPlayground = () => {
  const [selectedBrowsers, setSelectedBrowsers] = useState<Set<string>>(new Set(['Safari']));
  const [tableHoverBrowser, setTableHoverBrowser] = useState<string>();
  const [hoveredIdStore] = useState(() => createStore<string | undefined>(undefined));
  const handlers = useMemo(
    () => ({
      onMouseOver: withSource(
        (datum: Datum) => hoveredIdStore.set(String(datum.id)),
        '(datum) => setHoveredId(datum.id)'
      ),
      onMouseOut: withSource(() => hoveredIdStore.set(undefined), '() => setHoveredId(undefined)'),
      onClick: withSource(
        (datum: Datum) =>
          setSelectedBrowsers((browsers) => {
            const next = new Set(browsers);
            const browser = String(datum.browser);
            if (next.has(browser)) next.delete(browser);
            else next.add(browser);
            return next;
          }),
        '(datum) => toggleBrowser(datum.browser)'
      ),
    }),
    [hoveredIdStore]
  );
  const highlightedBrowsers = tableHoverBrowser ? [tableHoverBrowser] : [...selectedBrowsers];
  const highlightedItem = highlightedBrowsers.length ? highlightedBrowsers.flatMap(getBrowserIds) : undefined;
  return (
    <PropPlayground
      previewSize={getInteractionPreviewSize}
      controls={[]}
      render={() => (
        <ChartWithTable
          data={interactionDownloadsData}
          idKey="id"
          highlightedItem={highlightedItem}
          renderTable={(width) => (
            <BrowserTable
              width={width}
              selectedBrowsers={selectedBrowsers}
              onSelectionChange={setSelectedBrowsers}
              onHoverChange={setTableHoverBrowser}
              hoveredIdStore={hoveredIdStore}
            />
          )}
        >
          {downloadsAxes}
          <Bar dimension="browser" metric="downloads" color="os" {...handlers}>
            <ChartInspect>{downloadsContent}</ChartInspect>
          </Bar>
          <Legend />
        </ChartWithTable>
      )}
    />
  );
};

const legendPopoverContent = withSource(
  (datum: Datum, close: () => void) =>
    renderPopover(String(datum.value), `Open the ${datum.value} report`, close),
  popoverSource('datum.value', 'Open the {datum.value} report'),
  S2_POPOVER_IMPORTS
);

const legendControls: PlaygroundControl[] = [
  { group: 'ChartPopover', name: 'rightClick', type: 'boolean', defaultValue: false },
];

/**
 * Playground for a popover on legend entries.
 * @returns playground element
 */
export const InteractionLegendPlayground = () => (
  <PropPlayground
    previewSize={getInteractionPreviewSize}
    controls={legendControls}
    render={({ rightClick }) => (
      <Chart data={interactionVisitorsData}>
        {visitorsAxes}
        <Line dimension="month" metric="visitors" color="device" scaleType="point" />
        <Legend>
          <ChartPopover rightClick={rightClick as boolean | undefined}>{legendPopoverContent}</ChartPopover>
        </Legend>
      </Chart>
    )}
  />
);
