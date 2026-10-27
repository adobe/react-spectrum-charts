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

/* eslint-disable react/prop-types -- story args are typed via StoryFn generics */
import { ReactElement, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';

import { StoryFn } from '@storybook/react';
import { View } from 'vega';

import { ActionButton } from '@react-spectrum/s2';
import {
  ANIMATION_TIMER,
  AnimationType,
  DRAW_IN_DURATION,
  DRAW_IN_START,
  TABLE,
} from '@spectrum-charts/core-s2/constants';
import { ChartData, Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart.js';
import {
  Axis,
  Bar,
  BarDirectLabel,
  ChartInspect,
  ChartPopover,
  Donut,
  DonutSummary,
  Legend,
  Line,
  SegmentLabel,
} from '../../../../components/index.js';
import { Combo } from '../../../../lab/index.js';
import { visitsByChannelData } from '../../../../stories/Line/lineData.js';
import { basicDonutData } from '../../../../storyShared/Donut/data.js';
import { barData, channelDeviceData, newSubscribersData } from '../../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ChartChildElement } from '../../../../types/index.js';

type Variant =
  | 'barSimple'
  | 'barStacked'
  | 'barHorizontal'
  | 'barDodged'
  | 'barDirectLabels'
  | 'lineMultiSeries'
  | 'lineStaticPoints'
  | 'donutSummary'
  | 'donutSegmentLabels'
  | 'combo';

type Scenario =
  | 'none'
  | 'rebuildAt50'
  | 'rebuildAt250'
  | 'rebuildAt500'
  | 'rebuildNearEnd'
  | 'rebuildAfterEnd'
  | 'rapidEvery16'
  | 'rapidEvery50'
  | 'valuesEvery200'
  | 'streamAppend'
  | 'themeFlip'
  | 'rendererSwitch'
  | 'localeSwitch'
  | 'highlightCycle'
  | 'hideSeries'
  | 'drawInOffOn'
  | 'animationsOffOn'
  | 'resizeOnly';

type HighlightBy = 'item' | 'series' | 'dimension';

interface RenderOptions {
  /** ChartInspect and ChartPopover children for a mark plotting the given metric */
  dialogs: (metric: string) => ReactElement[];
  legendHighlight: boolean;
}

interface VariantConfig {
  data: ChartData[];
  dimension: string;
  metric: string;
  series?: string;
  render: (options: RenderOptions) => ChartChildElement[];
}

const comboData = [
  { datetime: 1667890800000, orders: 42, visits: 58 },
  { datetime: 1667977200000, orders: 55, visits: 63 },
  { datetime: 1668063600000, orders: 61, visits: 70 },
  { datetime: 1668150000000, orders: 48, visits: 66 },
  { datetime: 1668236400000, orders: 70, visits: 82 },
  { datetime: 1668322800000, orders: 65, visits: 90 },
];

const stackedBar = (extra: { orientation?: 'horizontal'; type?: 'dodged' } = {}) => ({
  data: channelDeviceData,
  dimension: 'channel',
  metric: 'signups',
  series: 'device',
  render: ({ dialogs, legendHighlight }: RenderOptions) => [
    <Axis key="x" position={extra.orientation ? 'left' : 'bottom'} baseline />,
    <Axis key="y" position={extra.orientation ? 'bottom' : 'left'} grid />,
    <Bar key="bar" dimension="channel" metric="signups" color="device" order="order" {...extra}>
      {dialogs('signups')}
    </Bar>,
    <Legend key="legend" highlight={legendHighlight} isToggleable />,
  ],
});

const variants: Record<Variant, VariantConfig> = {
  barSimple: {
    data: barData,
    dimension: 'browser',
    metric: 'downloads',
    render: ({ dialogs }) => [
      <Axis key="x" position="bottom" baseline />,
      <Axis key="y" position="left" grid />,
      <Bar key="bar" dimension="browser" metric="downloads">
        {dialogs('downloads')}
      </Bar>,
    ],
  },
  barStacked: stackedBar(),
  barHorizontal: stackedBar({ orientation: 'horizontal' }),
  barDodged: stackedBar({ type: 'dodged' }),
  barDirectLabels: {
    data: newSubscribersData,
    dimension: 'channel',
    metric: 'subscribers',
    render: ({ dialogs }) => [
      <Axis key="x" position="bottom" baseline />,
      <Axis key="y" position="left" grid />,
      <Bar key="bar" dimension="channel" metric="subscribers" color="series">
        {[<BarDirectLabel key="label" position="end-outside" />, ...dialogs('subscribers')]}
      </Bar>,
    ],
  },
  lineMultiSeries: {
    data: visitsByChannelData,
    dimension: 'datetime',
    metric: 'visits',
    series: 'channel',
    render: ({ dialogs, legendHighlight }) => [
      <Axis key="y" position="left" grid />,
      <Axis key="x" position="bottom" labelFormat="time" baseline ticks />,
      <Line key="line" dimension="datetime" metric="visits" color="channel">
        {dialogs('visits')}
      </Line>,
      <Legend key="legend" highlight={legendHighlight} isToggleable />,
    ],
  },
  lineStaticPoints: {
    data: visitsByChannelData,
    dimension: 'datetime',
    metric: 'visits',
    series: 'channel',
    render: ({ dialogs, legendHighlight }) => [
      <Axis key="y" position="left" grid />,
      <Axis key="x" position="bottom" labelFormat="time" baseline ticks />,
      <Line key="line" dimension="datetime" metric="visits" color="channel" staticPoint="hasEvent">
        {dialogs('visits')}
      </Line>,
      <Legend key="legend" highlight={legendHighlight} isToggleable />,
    ],
  },
  donutSummary: {
    data: basicDonutData,
    dimension: 'browser',
    metric: 'count',
    series: 'browser',
    render: ({ dialogs, legendHighlight }) => [
      <Donut key="donut" color="browser" metric="count">
        {[<DonutSummary key="summary" label="Visitors" />, ...dialogs('count')]}
      </Donut>,
      <Legend key="legend" highlight={legendHighlight} isToggleable />,
    ],
  },
  donutSegmentLabels: {
    data: basicDonutData,
    dimension: 'browser',
    metric: 'count',
    series: 'browser',
    render: ({ dialogs, legendHighlight }) => [
      <Donut key="donut" color="browser" metric="count">
        {[<SegmentLabel key="labels" percent />, ...dialogs('count')]}
      </Donut>,
      <Legend key="legend" highlight={legendHighlight} isToggleable />,
    ],
  },
  combo: {
    data: comboData,
    dimension: 'datetime',
    metric: 'orders',
    render: ({ dialogs }) => [
      <Axis key="y" position="left" grid />,
      <Axis key="x" position="bottom" labelFormat="time" baseline ticks />,
      <Combo key="combo" dimension="datetime">
        <Bar metric="orders">{dialogs('orders')}</Bar>
        <Line metric="visits" color={{ value: 'categorical-200' }} scaleType="point">
          {dialogs('visits')}
        </Line>
      </Combo>,
    ],
  },
};

export default {
  title: 'React Spectrum Charts 2/Chart/Performance/Draw In Stability',
  tags: ['alpha'],
  component: Chart,
  argTypes: {
    variant: { control: 'select', options: Object.keys(variants) },
    slowdown: {
      control: 'inline-radio',
      options: [1, 2, 4, 10],
      description: 'Stretches the draw-in and the scripted scenario timings; label fades keep their real speed.',
    },
    inspect: { control: 'boolean', description: 'Adds a ChartInspect to each mark.' },
    highlightBy: {
      control: 'inline-radio',
      options: ['item', 'series', 'dimension'],
      description: 'What the ChartInspect keeps highlighted while it is visible.',
      if: { arg: 'inspect' },
    },
    popover: { control: 'boolean', description: 'Adds a ChartPopover, opened by clicking a mark, to each mark.' },
    legendHighlight: { control: 'boolean', description: 'Highlights a series while its legend entry is hovered.' },
    scenario: {
      control: 'select',
      options: [
        'none',
        'rebuildAt50',
        'rebuildAt250',
        'rebuildAt500',
        'rebuildNearEnd',
        'rebuildAfterEnd',
        'rapidEvery16',
        'rapidEvery50',
        'valuesEvery200',
        'streamAppend',
        'themeFlip',
        'rendererSwitch',
        'localeSwitch',
        'highlightCycle',
        'hideSeries',
        'drawInOffOn',
        'animationsOffOn',
        'resizeOnly',
      ],
    },
  },
};

type Verdict = 'fresh' | 'continued' | 'finished' | 'no draw-in' | 'empty' | 'REPLAYED';

interface LogEntry {
  id: number;
  at: number;
  label: string;
  view?: { empty: boolean; firstPaintT?: number; start?: number };
}

const readSignal = (view: View, name: string): number | undefined => {
  try {
    const value = Number(view.signal(name));
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const getVerdicts = (log: LogEntry[]): (Verdict | undefined)[] => {
  let baseline: number | undefined;
  return log.map(({ view }) => {
    if (!view) {
      return undefined;
    }
    // an empty chart resets the draw-in, so the next data starts fresh
    if (view.empty) {
      baseline = undefined;
      return 'empty';
    }
    if (view.start === undefined) {
      return 'no draw-in';
    }
    if (baseline === undefined) {
      baseline = view.start;
      return 'fresh';
    }
    if (Math.abs(view.start - baseline) > 2) {
      return 'REPLAYED';
    }
    return (view.firstPaintT ?? 0) >= 1 ? 'finished' : 'continued';
  });
};

const WITH_DRAW_IN: AnimationType[] = ['hover', 'drawIn'];
const HOVER_ONLY: AnimationType[] = ['hover'];

let nextLogId = 0;
const logEntry = (entry: Omit<LogEntry, 'id'>): LogEntry => ({ id: nextLogId++, ...entry });

const createLogStore = () => {
  let entries: LogEntry[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => entries,
    set: (next: LogEntry[]) => {
      entries = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

type LogStore = ReturnType<typeof createLogStore>;

// Lives outside the chart's parent so logging never re-renders (and rebuilds) the chart.
const LogPanel = ({ store, state }: { store: LogStore; state: string }): ReactElement => {
  const log = useSyncExternalStore(store.subscribe, store.get);
  const verdicts = getVerdicts(log);
  const replayed = verdicts.includes('REPLAYED');
  return (
    <>
      <output
        data-testid="draw-in-verdict"
        style={{ fontFamily: 'monospace', fontWeight: 'bold', color: replayed ? 'crimson' : 'seagreen' }}
      >
        {replayed ? 'FAIL: draw-in replayed within one mount' : 'PASS'} · state: {state}
      </output>
      <table data-testid="draw-in-log" style={{ fontFamily: 'monospace', fontSize: 12, borderSpacing: '12px 2px' }}>
        <thead>
          <tr>
            <th align="left">ms</th>
            <th align="left">event</th>
            <th align="left">draw-in start (ms)</th>
            <th align="left">first-paint t</th>
            <th align="left">verdict</th>
          </tr>
        </thead>
        <tbody>
          {log.map((entry, index) => (
            <tr key={entry.id} data-verdict={verdicts[index]}>
              <td>{entry.at}</td>
              <td>{entry.label}</td>
              <td>{entry.view?.start ?? ''}</td>
              <td>{entry.view?.firstPaintT?.toFixed(2) ?? ''}</td>
              <td style={{ color: verdicts[index] === 'REPLAYED' ? 'crimson' : undefined }}>{verdicts[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const nextDimensionValue = (row: ChartData, dimension: string, count: number) => {
  const value = row[dimension];
  return typeof value === 'number' ? value + 86400000 : `${String(value)} ${count}`;
};

interface StabilityArgs {
  variant: Variant;
  scenario: Scenario;
  slowdown: number;
  inspect: boolean;
  highlightBy: HighlightBy;
  popover: boolean;
  legendHighlight: boolean;
}

/**
 * Gets dialog content listing the hovered or clicked row's dimension, series and metric.
 * @param dimension - dimension field
 * @param metric - metric field
 * @param series - series field, if the variant has one
 * @returns dialog content renderer
 */
const getDialogContent = (dimension: string, metric: string, series?: string) =>
  function DialogContent(datum: Datum): ReactElement {
    return (
      <div>
        <div>{String(datum[dimension])}</div>
        {series ? <div>{String(datum[series])}</div> : null}
        <div>
          {metric}: {Number(datum[metric]).toLocaleString()}
        </div>
      </div>
    );
  };

interface DialogOptions {
  inspect: boolean;
  highlightBy: HighlightBy;
  popover: boolean;
  legendHighlight: boolean;
}

/**
 * Renders a variant's chart children with the selected inspect, popover and legend options.
 * @param config - variant config
 * @param options - dialog options
 * @returns chart children
 */
const renderVariant = (config: VariantConfig, { inspect, highlightBy, popover, legendHighlight }: DialogOptions) =>
  config.render({
    dialogs: (metric) => {
      const content = getDialogContent(config.dimension, metric, config.series);
      return [
        ...(inspect
          ? [
              <ChartInspect key="inspect" highlightBy={highlightBy}>
                {content}
              </ChartInspect>,
            ]
          : []),
        ...(popover ? [<ChartPopover key="popover">{content}</ChartPopover>] : []),
      ];
    },
    legendHighlight,
  });

/**
 * Stretches a view's draw-in by the slowdown factor.
 * @param view - vega view
 * @param slowdown - draw-in duration multiplier
 * @returns draw-in progress (0-1) at the view's first paint
 */
const slowDrawIn = (view: View, slowdown: number): number => {
  const duration = readSignal(view, DRAW_IN_DURATION);
  const restored = readSignal(view, DRAW_IN_START);
  if (duration && slowdown > 1) {
    view.signal(DRAW_IN_DURATION, duration * slowdown);
    void view.runAsync();
  }
  if (!duration || !restored) {
    return 0;
  }
  const timer = readSignal(view, ANIMATION_TIMER) ?? 0;
  return Math.min(1, Math.max(0, (timer - restored) / (duration * slowdown)));
};

/**
 * Lists the labels of the active story toggles.
 * @param flags - toggle label to whether it's active
 * @returns active labels
 */
const describeState = (flags: Record<string, boolean>): string[] =>
  Object.entries(flags)
    .filter(([, active]) => active)
    .map(([label]) => label);

// Every view of one mount must share a draw-in start; only Remount, Loading → data, and Empty → data restart it.
const DrawInStabilityStory: StoryFn<StabilityArgs> = ({
  variant,
  scenario,
  slowdown,
  inspect,
  highlightBy,
  popover,
  legendHighlight,
}): ReactElement => {
  const config = variants[variant];
  const [rows, setRows] = useState(config.data);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const [width, setWidth] = useState(640);
  const [loading, setLoading] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [title, setTitle] = useState<string | undefined>();
  const [dark, setDark] = useState(false);
  const [canvas, setCanvas] = useState(false);
  const [german, setGerman] = useState(false);
  const [padding, setPadding] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hideFirst, setHideFirst] = useState(false);
  const [drawIn, setDrawIn] = useState(true);
  const [animations, setAnimations] = useState(true);
  const store = useMemo(createLogStore, []);
  const valueStep = useRef(0);
  const mountedAt = useRef(Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const seriesValues = config.series ? [...new Set(config.data.map((row) => String(row[config.series ?? ''])))] : [];
  const later = (ms: number, callback: () => void) => timers.current.push(setTimeout(callback, ms));
  const slowLater = (ms: number, callback: () => void) => later(ms * slowdown, callback);
  const repeat = (count: number, everyMs: number, callback: () => void) => {
    for (let i = 1; i <= count; i++) {
      slowLater(everyMs * i, callback);
    }
  };
  const record = (label: string) =>
    store.set([...store.get(), logEntry({ at: Date.now() - mountedAt.current, label })]);
  const act = (label: string, change: () => void) => {
    record(label);
    change();
  };
  const restart = (label: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    mountedAt.current = Date.now();
    store.set([logEntry({ at: 0, label })]);
  };

  const actions = {
    rerender: () => act('re-render parent', rerender),
    newArray: () => act('same data, new array', () => setRows((current) => current.map((row) => ({ ...row })))),
    changeValues: () =>
      act('change values', () => {
        valueStep.current += 1;
        const step = valueStep.current;
        setRows((current) =>
          current.map((row, i) => ({
            ...row,
            [config.metric]: Math.round(Number(row[config.metric]) * (0.5 + ((i + step) % 5) / 4)),
          }))
        );
      }),
    addRow: () =>
      act('add row', () =>
        setRows((current) => {
          const last = current.at(-1) ?? config.data[0];
          return [
            ...current,
            { ...last, [config.dimension]: nextDimensionValue(last, config.dimension, current.length) },
          ];
        })
      ),
    removeRow: () => act('remove row', () => setRows((current) => current.slice(0, Math.max(1, current.length - 1)))),
    toggleTitle: () => act('toggle title', () => setTitle((current) => (current ? undefined : 'Draw-in stability'))),
    toggleTheme: () => act('toggle theme', () => setDark((current) => !current)),
    toggleRenderer: () => act('toggle renderer', () => setCanvas((current) => !current)),
    toggleLocale: () => act('toggle locale', () => setGerman((current) => !current)),
    togglePadding: () => act('toggle padding', () => setPadding((current) => (current ? 0 : 24))),
    cycleHighlight: () =>
      act('cycle highlightedSeries', () =>
        setHighlightIndex((current) => (current + 1 < seriesValues.length ? current + 1 : -1))
      ),
    toggleHidden: () => act('toggle hiddenSeries', () => setHideFirst((current) => !current)),
    toggleDrawIn: () => act('toggle drawIn type', () => setDrawIn((current) => !current)),
    toggleAnimations: () => act('toggle animations', () => setAnimations((current) => !current)),
    resize: () => act('resize', () => setWidth((current) => (current === 640 ? 480 : 640))),
  };

  const scenarios: Record<Scenario, () => void> = {
    none: () => undefined,
    rebuildAt50: () => slowLater(50, actions.rerender),
    rebuildAt250: () => slowLater(250, actions.rerender),
    rebuildAt500: () => slowLater(500, actions.rerender),
    rebuildNearEnd: () => slowLater(650, actions.rerender),
    rebuildAfterEnd: () => slowLater(1500, actions.rerender),
    rapidEvery16: () => repeat(60, 16, actions.rerender),
    rapidEvery50: () => repeat(20, 50, actions.rerender),
    valuesEvery200: () => repeat(5, 200, actions.changeValues),
    streamAppend: () => repeat(6, 400, actions.addRow),
    themeFlip: () => slowLater(300, actions.toggleTheme),
    rendererSwitch: () => slowLater(300, actions.toggleRenderer),
    localeSwitch: () => slowLater(300, actions.toggleLocale),
    highlightCycle: () => repeat(6, 150, actions.cycleHighlight),
    hideSeries: () => slowLater(300, actions.toggleHidden),
    drawInOffOn: () => {
      slowLater(200, actions.toggleDrawIn);
      slowLater(400, actions.toggleDrawIn);
    },
    animationsOffOn: () => {
      slowLater(200, actions.toggleAnimations);
      slowLater(400, actions.toggleAnimations);
    },
    resizeOnly: () => slowLater(300, actions.resize),
  };

  useEffect(() => {
    restart(`mount (${scenario})`);
    setRows(config.data);
    scenarios[scenario]();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, scenario, slowdown, mountKey]);

  const onView = (view: View) => {
    const at = Date.now() - mountedAt.current;
    const restored = readSignal(view, DRAW_IN_START);
    const firstPaintT = slowDrawIn(view, slowdown);
    const empty = !view.data(TABLE).length;
    const entry = logEntry({ at, label: 'new Vega view', view: { empty, firstPaintT } });
    store.set([...store.get(), entry]);
    // a fresh start latches on the first ticker frame
    later(100, () => {
      const start = restored || readSignal(view, DRAW_IN_START);
      entry.view = { empty, firstPaintT, start: start ? start - mountedAt.current : undefined };
      store.set([...store.get()]);
    });
  };

  const dialogOptions: DialogOptions = { inspect, highlightBy, popover, legendHighlight };

  const highlightedSeries = highlightIndex >= 0 ? seriesValues[highlightIndex] : undefined;
  const hiddenSeries = hideFirst && seriesValues.length ? [seriesValues[0]] : undefined;
  const state = describeState({
    dark,
    canvas,
    'de-DE': german,
    'padding 24': padding > 0,
    title: Boolean(title),
    [`highlight ${highlightedSeries}`]: Boolean(highlightedSeries),
    [`hide ${hiddenSeries?.[0]}`]: Boolean(hiddenSeries),
    'drawIn off': !drawIn,
    'animations off': !animations,
    [`inspect by ${highlightBy}`]: inspect,
    popover,
    'legend highlight off': !legendHighlight,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ActionButton onPress={actions.rerender}>Re-render parent</ActionButton>
        <ActionButton onPress={actions.newArray}>Same data, new array</ActionButton>
        <ActionButton onPress={actions.changeValues}>Change values</ActionButton>
        <ActionButton onPress={actions.addRow}>Add row</ActionButton>
        <ActionButton onPress={actions.removeRow}>Remove row</ActionButton>
        <ActionButton onPress={actions.toggleTitle}>Title</ActionButton>
        <ActionButton onPress={actions.toggleTheme}>Theme</ActionButton>
        <ActionButton onPress={actions.toggleRenderer}>SVG / canvas</ActionButton>
        <ActionButton onPress={actions.toggleLocale}>Locale</ActionButton>
        <ActionButton onPress={actions.togglePadding}>Padding</ActionButton>
        {seriesValues.length ? (
          <>
            <ActionButton onPress={actions.cycleHighlight}>Cycle highlightedSeries</ActionButton>
            <ActionButton onPress={actions.toggleHidden}>Toggle hiddenSeries</ActionButton>
          </>
        ) : null}
        <ActionButton onPress={actions.toggleDrawIn}>Draw-in type on / off</ActionButton>
        <ActionButton onPress={actions.toggleAnimations}>Animations on / off</ActionButton>
        <ActionButton onPress={actions.resize}>Resize</ActionButton>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ActionButton onPress={() => setMountKey((key) => key + 1)}>Remount (replays)</ActionButton>
        <ActionButton
          onPress={() => {
            restart('loading → data (replays)');
            setLoading(true);
            later(800, () => setLoading(false));
          }}
        >
          Loading → data (replays)
        </ActionButton>
        <ActionButton
          onPress={() => {
            restart('empty → data (replays)');
            setRows([]);
            later(800, () => setRows(config.data));
          }}
        >
          Empty → data (replays)
        </ActionButton>
      </div>
      <Chart
        key={mountKey}
        data={[...rows]}
        width={width}
        height={360}
        loading={loading}
        title={title}
        colorScheme={dark ? 'dark' : 'light'}
        renderer={canvas ? 'canvas' : 'svg'}
        locale={german ? 'de-DE' : 'en-US'}
        padding={padding}
        highlightedSeries={highlightedSeries}
        hiddenSeries={hiddenSeries}
        animations={animations}
        animationTypes={drawIn ? WITH_DRAW_IN : HOVER_ONLY}
        onVegaViewReady={onView}
      >
        {renderVariant(config, dialogOptions)}
      </Chart>
      <LogPanel store={store} state={state.join(', ') || 'default'} />
    </div>
  );
};

const story = (variant: Variant) => {
  const bound = bindWithProps(DrawInStabilityStory);
  bound.args = {
    variant,
    scenario: 'none',
    slowdown: 1,
    inspect: true,
    highlightBy: 'item',
    popover: true,
    legendHighlight: true,
  };
  return bound;
};

const BarSimple = story('barSimple');
const BarStacked = story('barStacked');
const BarHorizontal = story('barHorizontal');
const BarDodged = story('barDodged');
const BarDirectLabels = story('barDirectLabels');
const LineMultiSeries = story('lineMultiSeries');
const LineStaticPoints = story('lineStaticPoints');
const DonutSummaryStability = story('donutSummary');
const DonutSegmentLabels = story('donutSegmentLabels');
const ComboStability = story('combo');

export {
  BarSimple,
  BarStacked,
  BarHorizontal,
  BarDodged,
  BarDirectLabels,
  LineMultiSeries,
  LineStaticPoints,
  DonutSummaryStability,
  DonutSegmentLabels,
  ComboStability,
};
