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
/* eslint-disable */
// @ts-nocheck -- compiled formatter functions call protected LocalizedStringFormatter members, exactly as react-aria's untyped-JS intl output does.
// AUTO-GENERATED from intl/en-US.json by scripts/compileIntl.mjs. Do not edit by hand.
import type { LocalizedString } from '@internationalized/string';

const messages: Record<string, LocalizedString> = {
  "bar.description": (args, formatter) => `${formatter.select({true: () => `${args.title}. `, other: ``}, args.hasTitle)}Bar chart. ${args.dimension} along the category axis. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} bar`, other: () => `${formatter.number(args.count)} bars`})}. Use the ${args.siblingKeys} arrow keys to navigate.`,
  "bar.stackedDescription": (args, formatter) => `${formatter.select({true: () => `${args.title}. `, other: ``}, args.hasTitle)}Stacked bar chart. ${args.dimension} along the category axis, stacked by ${args.color}. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} stack`, other: () => `${formatter.number(args.count)} stacks`})}. Use the ${args.siblingKeys} arrow keys to move between stacks, and Enter, ${args.lastDrillKey}, or ${args.firstDrillKey} to drill into a stack's segments (${args.firstDrillKey} or Enter focuses the first segment, ${args.lastDrillKey} focuses the last); once drilled in, ${args.withinKeys} move through every segment in the chart, and ${args.siblingKeys} jump to the same segment in the adjacent stack.`,
  "bar.dimensionNode": (args, formatter) => `${args.dimensionKey} dimension. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} division`, other: () => `${formatter.number(args.count)} divisions`})}.`,
  "bar.stackNode": (args, formatter) => `${args.id}. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} bar`, other: () => `${formatter.number(args.count)} bars`})}${formatter.select({true: () => `, ${formatter.number(args.total)} ${args.metricLabel}`, other: ``}, args.hasTotal)}.`,
  "line.description": (args, formatter) => `${formatter.select({true: () => `${args.title}. `, other: ``}, args.hasTitle)}Line chart. ${args.dimension} along the x-axis. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} point`, other: () => `${formatter.number(args.count)} points`})}. Use Enter or the right arrow key to drill into the line's points, then the left and right arrow keys to navigate.`,
  "line.multiDescription": (args, formatter) => `${formatter.select({true: () => `${args.title}. `, other: ``}, args.hasTitle)}Multi-series line chart. ${args.dimension} along the x-axis, stacked by ${args.color}. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} line`, other: () => `${formatter.number(args.count)} lines`})}. Use the up and down arrow keys to move between lines, and Enter or the right arrow key to drill into a line's points.`,
  "line.lineNode": (args, formatter) => `${formatter.select({true: () => `Line ${args.value}`, other: `Line`}, args.hasValue)}. Contains ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} point`, other: () => `${formatter.number(args.count)} points`})}.`,
};

export default messages;
