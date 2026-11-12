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
import { tickStep } from 'd3-array';
import { precisionFixed } from 'd3-format';

import { getChartType } from './charts/chartType.js';
import { Formatter } from './format.js';
import { Layout, LayoutInput } from './layout.js';
import { isDiscreteScaleType } from './scales.js';
import { AriaProps, SceneNode } from './scene.js';
import { AxisOptions, Granularity } from './types.js';

/** Max values a discrete domain caption lists. */
const MAX_CAPTION_VALUES = 7;

/** Time label formats per granularity, mirroring the S2 spec builder's `getTimeLabelFormats`. */
const TIME_FORMATS: Record<Granularity, { secondary: string; primary: string }> = {
  second: { secondary: ':%S', primary: '%-I:%M %p' },
  minute: { secondary: '%-I:%M %p', primary: '%b %-d' },
  hour: { secondary: '%-I %p', primary: '%b %-d' },
  day: { secondary: '%-d', primary: '%b' },
  week: { secondary: '%-d', primary: '%b' },
  month: { secondary: '%b', primary: '%Y' },
  quarter: { secondary: 'Q%q', primary: '%Y' },
  year: { secondary: '%Y', primary: '' },
};

const GROUP_CONTAINER: AriaProps = { role: 'graphics-object', roleDescription: 'group mark container' };

const markContainer = (type: string, label: string): AriaProps => ({
  role: 'graphics-symbol',
  roleDescription: `${type} mark container`,
  label,
});

/** Scene key suffixes of helper marks and the mark type their container reports. */
const HELPER_MARKS: [string, string][] = [
  ['_hoverRule', 'rule'],
  ['_point_highlight', 'symbol'],
];

/**
 * Applies container ARIA: a graphics document described by the chart description.
 * @param container
 * @param description
 */
export const applyContainerAria = (container: HTMLElement, description: string | undefined): void => {
  container.setAttribute('role', 'graphics-document');
  container.setAttribute('aria-roleDescription', 'visualization');
  if (description === undefined || description === null) container.removeAttribute('aria-label');
  else container.setAttribute('aria-label', description);
};

type CaptionScale = { domain: () => unknown[] };

const timeCaptionFormat = (formatter: Formatter, specifier: string | undefined): ((value: unknown) => string) => {
  const spec = specifier ? specifier.replace(/%a/g, '%A').replace(/%b/g, '%B') : '%A, %d %B %Y, %X';
  const format = formatter.time(spec);
  return (value) => format(value as Date);
};

const linearCaptionFormat = (formatter: Formatter, domain: unknown[]): ((value: unknown) => string) => {
  const start = Number(domain[0]);
  const stop = Number(domain.at(-1));
  const precision = Math.max(0, precisionFixed(tickStep(start, stop, 5)));
  const format = formatter.number(`,.${precision}f`);
  return (value) => format(Number(value));
};

/**
 * Describes a scale's domain.
 * @param scale
 * @param type
 * @param format
 * @returns caption
 */
const domainCaption = (scale: CaptionScale, type: string, format: (value: unknown) => string): string => {
  const domain = scale.domain();
  if (type === 'point' || type === 'band' || type === 'ordinal') {
    const n = domain.length;
    const values =
      n > MAX_CAPTION_VALUES
        ? `${domain
            .slice(0, MAX_CAPTION_VALUES - 2)
            .map(format)
            .join(', ')}, ending with ${format(domain[n - 1])}`
        : domain.map(format).join(', ');
    const plural = n === 1 ? '' : 's';
    return `${n} value${plural}: ${values}`;
  }
  return `values from ${format(domain[0])} to ${format(domain.at(-1))}`;
};

const axisCaption = (
  axis: AxisOptions,
  part: string,
  layout: Layout,
  input: LayoutInput,
  xScaleType: string
): string => {
  const vertical = axis.position === 'left' || axis.position === 'right';
  const scale = (vertical ? layout.yScale : layout.xScale) as unknown as CaptionScale;
  const type = vertical ? 'linear' : xScaleType;
  const formats = TIME_FORMATS[axis.granularity ?? 'day'];
  let format: (value: unknown) => string;
  if (type === 'time') {
    const timeSpecifiers: Record<string, string | undefined> = {
      secondary: vertical ? `${formats.primary}\u2000${formats.secondary}` : formats.secondary,
      primary: formats.primary,
    };
    format = timeCaptionFormat(input.formatter, timeSpecifiers[part]);
  } else if (type === 'linear') {
    format = linearCaptionFormat(input.formatter, scale.domain());
  } else {
    format = String;
  }
  const title = part === 'primary' ? undefined : axis.title;
  const titled = title ? ` titled '${title}'` : '';
  const scaleCaption = isDiscreteScaleType(type) ? 'discrete' : type;
  return `${vertical ? 'Y' : 'X'}-axis${titled} for a ${scaleCaption} scale with ${domainCaption(scale, type, format)}`;
};

const captionCache = new WeakMap<Layout, Map<string, string>>();

/**
 * Gets the axis and legend captions for a layout, keyed by their scene group key.
 * @param layout
 * @param input
 * @returns captions
 */
const getGuideCaptions = (layout: Layout, input: LayoutInput): Map<string, string> => {
  const cached = captionCache.get(layout);
  if (cached) return cached;
  const captions = new Map<string, string>();
  const xScaleType = getXScaleType(input);
  (input.options.axes ?? []).forEach((axis, i) => {
    const prefix = `axis${i}-`;
    for (const result of layout.axes) {
      const { key } = result.node;
      if (!key.startsWith(prefix)) continue;
      captions.set(key, axisCaption(axis, key.slice(prefix.length), layout, input, xScaleType));
    }
  });
  layout.legends.forEach((legend, i) => {
    const title = input.options.legends?.[i]?.title;
    const titled = title ? ` titled '${title}'` : '';
    const scale = { domain: () => legend.entries.map((entry) => entry.value) };
    captions.set(
      legend.node.key,
      `Symbol legend${titled} for fill color with ${domainCaption(scale, 'ordinal', String)}`
    );
  });
  captionCache.set(layout, captions);
  return captions;
};

const getXScaleType = (input: LayoutInput): string => {
  const first = input.options.marks?.[0];
  return first ? getChartType(first.markType)?.dimensionScaleType(first) ?? 'time' : 'linear';
};

const ariaFor = (
  node: SceneNode,
  markName: string | undefined,
  captions: Map<string, string>
): AriaProps | undefined => {
  if (node.key === 'background' || node.key === 'focusRing') return { hidden: true };
  if (node.role === 'frame') return GROUP_CONTAINER;
  if (node.role === 'axis' || node.role === 'legend') {
    const label = captions.get(node.key);
    return label ? { role: 'graphics-symbol', roleDescription: node.role, label } : undefined;
  }
  if (node.type === 'group' && node.key.endsWith('_group')) return GROUP_CONTAINER;
  if (node.role === 'line' && markName) return markContainer('line', markName);
  if (node.key === 'xBaseline') return markContainer('rule', node.key);
  const helper = HELPER_MARKS.find(([suffix]) => node.key.endsWith(suffix));
  return helper ? markContainer(helper[1], node.key) : undefined;
};

/**
 * Annotates scene nodes with ARIA attributes for screen readers.
 * @param scene
 * @param layout
 * @param input
 */
export const annotateAria = (scene: SceneNode[], layout: Layout, input: LayoutInput): void => {
  const captions = getGuideCaptions(layout, input);
  const visit = (node: SceneNode, markName: string | undefined) => {
    const aria = ariaFor(node, markName, captions);
    if (aria) node.aria = aria;
    if (node.type !== 'group' || node.role === 'axis') return;
    if (node.role === 'legend') {
      // the entries group is the only legend part with ARIA
      node.children.forEach((child) => {
        if (child.role === 'legend-entry') child.aria = GROUP_CONTAINER;
      });
      return;
    }
    const name = node.key.endsWith('_group') ? node.key.slice(0, -'_group'.length) : markName;
    node.children.forEach((child) => visit(child, name));
  };
  scene.forEach((node) => visit(node, undefined));
};
