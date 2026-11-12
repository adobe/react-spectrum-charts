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
import { getChartType } from './charts/chartType.js';
import { Layout, LayoutInput } from './layout.js';
import { isDiscreteScaleType } from './scales.js';
import { AriaProps, SceneNode } from './scene.js';
import { AxisOptions, Granularity } from './types.js';

/** Long, screen-reader-friendly date formats per granularity. */
const CAPTION_TIME_FORMATS: Record<Granularity, string> = {
  second: '%B %-d, %Y, %-I:%M:%S %p',
  minute: '%B %-d, %Y, %-I:%M %p',
  hour: '%B %-d, %Y, %-I %p',
  day: '%B %-d, %Y',
  week: '%B %-d, %Y',
  month: '%B %Y',
  quarter: 'Q%q %Y',
  year: '%Y',
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

/**
 * Describes a domain by its first and last values, with a count for discrete domains.
 * @param domain
 * @param discrete
 * @param format
 * @returns description
 */
const describeDomain = (domain: unknown[], discrete: boolean, format: (value: unknown) => string): string => {
  if (!domain.length) return 'no values';
  const first = format(domain[0]);
  const last = format(domain.at(-1));
  if (!discrete) return `from ${first} to ${last}`;
  if (domain.length === 1) return `1 value, ${first}`;
  return `${domain.length} values, from ${first} to ${last}`;
};

const axisCaption = (axis: AxisOptions, layout: Layout, input: LayoutInput, xScaleType: string): string => {
  const vertical = axis.position === 'left' || axis.position === 'right';
  const scale = (vertical ? layout.yScale : layout.xScale) as unknown as { domain: () => unknown[] };
  const type = vertical ? 'linear' : xScaleType;
  let format: (value: unknown) => string = String;
  if (type === 'time') {
    const time = input.formatter.time(CAPTION_TIME_FORMATS[axis.granularity ?? 'day']);
    format = (value) => time(value as Date);
  } else if (type === 'linear') {
    const number = input.formatter.number(',~f');
    format = (value) => number(Number(value));
  }
  const titled = axis.title ? `, ${axis.title}` : '';
  const name = `${vertical ? 'Y' : 'X'} axis${titled}`;
  return `${name}, ${describeDomain(scale.domain(), isDiscreteScaleType(type), format)}`;
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
    // a time axis draws two label rows; caption the axis once, on its first row
    const first = layout.axes.find((result) => result.node.key.startsWith(prefix));
    if (first) captions.set(first.node.key, axisCaption(axis, layout, input, xScaleType));
  });
  layout.legends.forEach((legend, i) => {
    const title = input.options.legends?.[i]?.title;
    const titled = title ? `, ${title}` : '';
    const labels = legend.entries.map((entry) => entry.label);
    captions.set(legend.node.key, `Legend${titled}, ${labels.length} items: ${labels.join(', ')}`);
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
    return label ? { role: 'graphics-symbol', roleDescription: node.role, label } : { hidden: true };
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
