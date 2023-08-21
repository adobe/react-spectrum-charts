/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import usePrismProps from '@hooks/usePrismProps';
import { Prism } from '@prism';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement } from 'react';

import { barData } from './components/Bar/data';
import carsData from './data/cars.json';
import { packedBubbleData } from './data/data';

export default {
	title: 'Prism/Prism/UNSAFE_vegaSpec',
	component: Prism,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Chart component doc page.',
			},
		},
	},
};

const UnsafeVegaSpecStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const prismProps = usePrismProps(args);
	return <Prism {...prismProps} />;
};

const BasicBar = bindWithProps(UnsafeVegaSpecStory);
BasicBar.args = {
	data: barData,
	height: 500,
	maxWidth: 400,
	width: 'auto',
	description: 'A basic bar chart example, with value labels shown upon mouse hover.',
	UNSAFE_vegaSpec: {
		$schema: 'https://vega.github.io/schema/vega/v5.json',

		signals: [
			{
				name: 'tooltip',
				value: {},
				on: [{ events: 'rect:mouseover', update: 'datum' }],
			},
		],

		scales: [
			{
				name: 'xscale',
				type: 'band',
				domain: { data: 'table', field: 'browser' },
				range: 'width',
				padding: 0.1,
				round: true,
			},
			{
				name: 'yscale',
				domain: { data: 'table', field: 'downloads' },
				nice: true,
				range: 'height',
			},
		],

		axes: [
			{ orient: 'bottom', scale: 'xscale' },
			{ orient: 'left', scale: 'yscale' },
		],

		marks: [
			{
				type: 'rect',
				from: { data: 'table' },
				encode: {
					enter: {
						x: { scale: 'xscale', field: 'browser' },
						width: { scale: 'xscale', band: 1 },
						y: { scale: 'yscale', field: 'downloads' },
						y2: { scale: 'yscale', value: 0 },
					},
				},
			},
			{
				type: 'text',
				encode: {
					enter: {
						align: { value: 'center' },
						baseline: { value: 'bottom' },
					},
					update: {
						x: { scale: 'xscale', signal: 'tooltip.browser', band: 0.5 },
						y: { scale: 'yscale', signal: 'tooltip.downloads', offset: -2 },
						text: { signal: 'tooltip.percentLabel' },
						fillOpacity: [{ test: 'datum === tooltip', value: 0 }, { value: 1 }],
					},
				},
			},
		],
	},
};

const PackedBubbleChart = bindWithProps(UnsafeVegaSpecStory);
PackedBubbleChart.args = {
	data: packedBubbleData,
	height: 500,
	maxWidth: 400,
	width: 'auto',
	description:
		'A packed bubble chart displays relatively sized circles arbitrarily packed together. You can change the shape of the packing by adjusting the x or y gravity. This example shows dummy categorical data where node areas are proportional to the amount value.',
	UNSAFE_vegaSpec: {
		signals: [
			{ name: 'cx', update: 'width / 2' },
			{ name: 'cy', update: 'height / 2' },
			{
				name: 'gravityX',
				value: 0.2,
				bind: { input: 'range', min: 0, max: 1 },
			},
			{
				name: 'gravityY',
				value: 0.1,
				bind: { input: 'range', min: 0, max: 1 },
			},
		],
		scales: [
			{
				name: 'size',
				domain: { data: 'table', field: 'amount' },
				range: [100, 3000],
			},
			{
				name: 'color',
				type: 'ordinal',
				domain: { data: 'table', field: 'category' },
				range: 'ramp',
			},
		],
		marks: [
			{
				name: 'nodes',
				type: 'symbol',
				from: { data: 'table' },
				encode: {
					enter: {
						fill: { scale: 'color', field: 'category' },
						xfocus: { signal: 'cx' },
						yfocus: { signal: 'cy' },
					},
					update: {
						size: { signal: 'pow(2 * datum.amount, 2)', scale: 'size' },
						stroke: { value: 'white' },
						strokeWidth: { value: 1 },
						tooltip: { signal: 'datum' },
					},
				},
				transform: [
					{
						type: 'force',
						iterations: 100,
						static: false,
						forces: [
							{
								force: 'collide',
								iterations: 2,
								radius: { expr: 'sqrt(datum.size) / 2' },
							},
							{ force: 'center', x: { signal: 'cx' }, y: { signal: 'cy' } },
							{ force: 'x', x: 'xfocus', strength: { signal: 'gravityX' } },
							{ force: 'y', y: 'yfocus', strength: { signal: 'gravityY' } },
						],
					},
				],
			},
			{
				type: 'text',
				from: { data: 'nodes' },
				encode: {
					enter: {
						align: { value: 'center' },
						baseline: { value: 'middle' },
						fontSize: { value: 15 },
						fontWeight: { value: 'bold' },
						fill: { value: 'white' },
						text: { field: 'datum.category' },
					},
					update: { x: { field: 'x' }, y: { field: 'y' } },
				},
			},
		],
	},
};

const ContourPlot = bindWithProps(UnsafeVegaSpecStory);
ContourPlot.args = {
	data: [
		{
			name: 'source',
			values: carsData,
			transform: [
				{
					type: 'filter',
					expr: 'datum.Horsepower != null && datum.Miles_per_Gallon != null',
				},
			],
		},
		{
			name: 'density',
			source: 'source',
			transform: [
				{
					type: 'kde2d',
					groupby: ['Origin'],
					size: [{ signal: 'width' }, { signal: 'height' }],
					x: { expr: "scale('x', datum.Horsepower)" },
					y: { expr: "scale('y', datum.Miles_per_Gallon)" },
					bandwidth: { signal: '[bandwidth, bandwidth]' },
					counts: { signal: 'counts' },
				},
			],
		},
		{
			name: 'contours',
			source: 'density',
			transform: [
				{
					type: 'isocontour',
					field: 'grid',
					resolve: { signal: 'resolve' },
					levels: 3,
				},
			],
		},
	],
	height: 400,
	width: 500,
	description:
		'A packed bubble chart displays relatively sized circles arbitrarily packed together. You can change the shape of the packing by adjusting the x or y gravity. This example shows dummy categorical data where node areas are proportional to the amount value.',
	UNSAFE_vegaSpec: {
		signals: [
			{
				name: 'bandwidth',
				value: -1,
				bind: { input: 'range', min: -1, max: 100, step: 1 },
			},
			{
				name: 'resolve',
				value: 'shared',
				bind: { input: 'select', options: ['independent', 'shared'] },
			},
			{
				name: 'counts',
				value: true,
				bind: { input: 'checkbox' },
			},
		],

		scales: [
			{
				name: 'x',
				type: 'linear',
				round: true,
				nice: true,
				zero: true,
				domain: { data: 'source', field: 'Horsepower' },
				range: 'width',
			},
			{
				name: 'y',
				type: 'linear',
				round: true,
				nice: true,
				zero: true,
				domain: { data: 'source', field: 'Miles_per_Gallon' },
				range: 'height',
			},
			{
				name: 'color',
				type: 'ordinal',
				domain: {
					data: 'source',
					field: 'Origin',
					sort: { order: 'descending' },
				},
				range: 'category',
			},
		],

		axes: [
			{
				scale: 'x',
				grid: true,
				domain: false,
				orient: 'bottom',
				tickCount: 5,
				title: 'Horsepower',
			},
			{
				scale: 'y',
				grid: true,
				domain: false,
				orient: 'left',
				titlePadding: 5,
				title: 'Miles_per_Gallon',
			},
		],

		legends: [{ stroke: 'color', symbolType: 'stroke' }],

		marks: [
			{
				name: 'marks',
				type: 'symbol',
				from: { data: 'source' },
				encode: {
					update: {
						x: { scale: 'x', field: 'Horsepower' },
						y: { scale: 'y', field: 'Miles_per_Gallon' },
						size: { value: 4 },
						fill: { value: '#ccc' },
					},
				},
			},
			{
				type: 'image',
				from: { data: 'density' },
				encode: {
					update: {
						x: { value: 0 },
						y: { value: 0 },
						width: { signal: 'width' },
						height: { signal: 'height' },
						aspect: { value: false },
					},
				},
				transform: [
					{
						type: 'heatmap',
						field: 'datum.grid',
						resolve: { signal: 'resolve' },
						color: { expr: "scale('color', datum.datum.Origin)" },
					},
				],
			},
			{
				type: 'path',
				clip: true,
				from: { data: 'contours' },
				encode: {
					enter: {
						strokeWidth: { value: 1 },
						strokeOpacity: { value: 1 },
						stroke: { scale: 'color', field: 'Origin' },
					},
				},
				transform: [{ type: 'geopath', field: 'datum.contour' }],
			},
		],
	},
};

export { BasicBar, PackedBubbleChart, ContourPlot };
