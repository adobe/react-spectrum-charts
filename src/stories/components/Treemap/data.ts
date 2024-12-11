/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// export const basicTreemapData = [
// 	{ id: 'Root', name: 'Company Sales', size: 0 },
// 	{ id: 'Region1', parentId: 'Root', name: 'North America', size: 0 },
// 	{ id: 'Region2', parentId: 'Root', name: 'Europe', size: 0 },
// 	{ id: 'Region3', parentId: 'Root', name: 'Asia', size: 0 },
// 	{ id: 'Category1', parentId: 'Region1', name: 'Electronics', size: 0 },
// 	{ id: 'Category2', parentId: 'Region1', name: 'Furniture', size: 0 },
// 	{ id: 'Category3', parentId: 'Region2', name: 'Clothing', size: 0 },
// 	{ id: 'Category4', parentId: 'Region3', name: 'Beauty', size: 0 },
// 	{ id: 'Product1', parentId: 'Category1', name: 'Smartphones', size: 120000 },
// 	{ id: 'Product2', parentId: 'Category1', name: 'Laptops', size: 80000 },
// 	{ id: 'Product3', parentId: 'Category2', name: 'Chairs', size: 45000 },
// 	{ id: 'Product4', parentId: 'Category2', name: 'Tables', size: 30000 },
// 	{ id: 'Product5', parentId: 'Category3', name: "Men's Wear", size: 50000 },
// 	{ id: 'Product6', parentId: 'Category3', name: "Women's Wear", size: 70000 },
// 	{ id: 'Product7', parentId: 'Category4', name: 'Skincare', size: 65000 },
// 	{ id: 'Product8', parentId: 'Category4', name: 'Makeup', size: 55000 },
// ];

export const basicTreemapData = [
	{
		id: 1,
		name: 'flare',
	},
	{
		id: 2,
		name: 'analytics',
		parent: 1,
	},
	{
		id: 3,
		name: 'cluster',
		parent: 2,
	},
	{
		id: 4,
		name: 'AgglomerativeCluster',
		parent: 3,
		size: 3938,
	},
	{
		id: 5,
		name: 'CommunityStructure',
		parent: 3,
		size: 3812,
	},
	{
		id: 6,
		name: 'HierarchicalCluster',
		parent: 3,
		size: 6714,
	},
	{
		id: 7,
		name: 'MergeEdge',
		parent: 3,
		size: 743,
	},
	{
		id: 8,
		name: 'graph',
		parent: 2,
	},
	{
		id: 9,
		name: 'BetweennessCentrality',
		parent: 8,
		size: 3534,
	},
	{
		id: 10,
		name: 'LinkDistance',
		parent: 8,
		size: 5731,
	},
	{
		id: 11,
		name: 'MaxFlowMinCut',
		parent: 8,
		size: 7840,
	},
	{
		id: 12,
		name: 'ShortestPaths',
		parent: 8,
		size: 5914,
	},
	{
		id: 13,
		name: 'SpanningTree',
		parent: 8,
		size: 3416,
	},
	{
		id: 14,
		name: 'optimization',
		parent: 2,
	},
	{
		id: 15,
		name: 'AspectRatioBanker',
		parent: 14,
		size: 7074,
	},
	{
		id: 16,
		name: 'animate',
		parent: 1,
	},
	{
		id: 17,
		name: 'Easing',
		parent: 16,
		size: 17010,
	},
	{
		id: 18,
		name: 'FunctionSequence',
		parent: 16,
		size: 5842,
	},
	{
		id: 19,
		name: 'interpolate',
		parent: 16,
	},
	{
		id: 20,
		name: 'ArrayInterpolator',
		parent: 19,
		size: 1983,
	},
	{
		id: 21,
		name: 'ColorInterpolator',
		parent: 19,
		size: 2047,
	},
	{
		id: 22,
		name: 'DateInterpolator',
		parent: 19,
		size: 1375,
	},
	{
		id: 23,
		name: 'Interpolator',
		parent: 19,
		size: 8746,
	},
	{
		id: 24,
		name: 'MatrixInterpolator',
		parent: 19,
		size: 2202,
	},
	{
		id: 25,
		name: 'NumberInterpolator',
		parent: 19,
		size: 1382,
	},
	{
		id: 26,
		name: 'ObjectInterpolator',
		parent: 19,
		size: 1629,
	},
	{
		id: 27,
		name: 'PointInterpolator',
		parent: 19,
		size: 1675,
	},
	{
		id: 28,
		name: 'RectangleInterpolator',
		parent: 19,
		size: 2042,
	},
	{
		id: 29,
		name: 'ISchedulable',
		parent: 16,
		size: 1041,
	},
	{
		id: 30,
		name: 'Parallel',
		parent: 16,
		size: 5176,
	},
	{
		id: 31,
		name: 'Pause',
		parent: 16,
		size: 449,
	},
	{
		id: 32,
		name: 'Scheduler',
		parent: 16,
		size: 5593,
	},
	{
		id: 33,
		name: 'Sequence',
		parent: 16,
		size: 5534,
	},
	{
		id: 34,
		name: 'Transition',
		parent: 16,
		size: 9201,
	},
	{
		id: 35,
		name: 'Transitioner',
		parent: 16,
		size: 19975,
	},
	{
		id: 36,
		name: 'TransitionEvent',
		parent: 16,
		size: 1116,
	},
	{
		id: 37,
		name: 'Tween',
		parent: 16,
		size: 6006,
	},
	{
		id: 38,
		name: 'data',
		parent: 1,
	},
	{
		id: 39,
		name: 'converters',
		parent: 38,
	},
	{
		id: 40,
		name: 'Converters',
		parent: 39,
		size: 721,
	},
	{
		id: 41,
		name: 'DelimitedTextConverter',
		parent: 39,
		size: 4294,
	},
	{
		id: 42,
		name: 'GraphMLConverter',
		parent: 39,
		size: 9800,
	},
	{
		id: 43,
		name: 'IDataConverter',
		parent: 39,
		size: 1314,
	},
	{
		id: 44,
		name: 'JSONConverter',
		parent: 39,
		size: 2220,
	},
	{
		id: 45,
		name: 'DataField',
		parent: 38,
		size: 1759,
	},
	{
		id: 46,
		name: 'DataSchema',
		parent: 38,
		size: 2165,
	},
	{
		id: 47,
		name: 'DataSet',
		parent: 38,
		size: 586,
	},
	{
		id: 48,
		name: 'DataSource',
		parent: 38,
		size: 3331,
	},
	{
		id: 49,
		name: 'DataTable',
		parent: 38,
		size: 772,
	},
	{
		id: 50,
		name: 'DataUtil',
		parent: 38,
		size: 3322,
	},
	{
		id: 51,
		name: 'display',
		parent: 1,
	},
	{
		id: 52,
		name: 'DirtySprite',
		parent: 51,
		size: 8833,
	},
	{
		id: 53,
		name: 'LineSprite',
		parent: 51,
		size: 1732,
	},
	{
		id: 54,
		name: 'RectSprite',
		parent: 51,
		size: 3623,
	},
	{
		id: 55,
		name: 'TextSprite',
		parent: 51,
		size: 10066,
	},
	{
		id: 56,
		name: 'flex',
		parent: 1,
	},
	{
		id: 57,
		name: 'FlareVis',
		parent: 56,
		size: 4116,
	},
	{
		id: 58,
		name: 'physics',
		parent: 1,
	},
	{
		id: 59,
		name: 'DragForce',
		parent: 58,
		size: 1082,
	},
	{
		id: 60,
		name: 'GravityForce',
		parent: 58,
		size: 1336,
	},
	{
		id: 61,
		name: 'IForce',
		parent: 58,
		size: 319,
	},
	{
		id: 62,
		name: 'NBodyForce',
		parent: 58,
		size: 10498,
	},
	{
		id: 63,
		name: 'Particle',
		parent: 58,
		size: 2822,
	},
	{
		id: 64,
		name: 'Simulation',
		parent: 58,
		size: 9983,
	},
];
