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
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// AUTO-GENERATED from intl/*.json by `yarn intl:compile`. Do not edit by hand.
import type { LocalizedString } from '@internationalized/string';

export type MessageKey =
  | 'actionBar.dragHandle'
  | 'actionBar.label'
  | 'actionBar.moreActions'
  | 'chart.emptyState'
  | 'chart.loading'
  | 'navigation.axisDescription'
  | 'navigation.barDescription'
  | 'navigation.barDescriptionWithoutCount'
  | 'navigation.colorLabel'
  | 'navigation.enter'
  | 'navigation.exit'
  | 'navigation.region'
  | 'navigation.stackedBarDescription';

export const messages: Record<string, Record<MessageKey, LocalizedString>> = {
  'en-US': {  "actionBar.dragHandle": `Drag to reposition action bar. Use arrow keys to move.`,
  "actionBar.label": `Action bar`,
  "actionBar.moreActions": `More actions`,
  "chart.emptyState": `No data found`,
  "chart.loading": `Loading`,
  "navigation.axisDescription": (args, formatter) => `${args.axisName} axis. ${formatter.plural(args.count, {one: () => `Contains ${formatter.number(args.count)} tick value.`, other: () => `Contains ${formatter.number(args.count)} tick values.`})} Use the left and right arrow keys to browse.`,
  "navigation.barDescription": (args, formatter) => `${args.metricLabel} by ${args.dimension} chart. ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} bar.`, other: () => `${formatter.number(args.count)} bars.`})}`,
  "navigation.barDescriptionWithoutCount": (args) => `${args.metricLabel} by ${args.dimension} chart.`,
  "navigation.colorLabel": `Color`,
  "navigation.enter": `Enter navigation area`,
  "navigation.exit": `End of data structure.`,
  "navigation.region": `Accessible chart navigation`,
  "navigation.stackedBarDescription": (args, formatter) => `${args.metricLabel} by ${args.dimension} chart, grouped by ${args.color}. ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} group`, other: () => `${formatter.number(args.count)} groups`})}.`,
},
};
