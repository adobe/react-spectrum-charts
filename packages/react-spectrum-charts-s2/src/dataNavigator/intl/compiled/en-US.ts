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
// @ts-nocheck
// AUTO-GENERATED from intl/en-US.json. Do not edit by hand.
import type { LocalizedString } from '@internationalized/string';

const messages: Record<string, LocalizedString> = {
  'bar.description': (args, formatter) => `${args.metricLabel} by ${args.dimension} chart.${formatter.plural(args.count, { '=0': () => ``, one: () => ` ${formatter.number(args.count)} bar.`, other: () => ` ${formatter.number(args.count)} bars.`})}`,
  'bar.stackedDescription': (args, formatter) => `${args.metricLabel} by ${args.dimension} chart, grouped by ${args.color}. ${formatter.plural(args.count, {one: () => `${formatter.number(args.count)} group`, other: () => `${formatter.number(args.count)} groups`})}.`,
};

export default messages;
