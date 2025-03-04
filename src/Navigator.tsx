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
import { FC, MutableRefObject, useEffect, useRef, useState } from 'react';

import { NAVIGATION_ID_KEY, NAVIGATION_RULES, NAVIGATION_SEMANTICS } from '@constants';
import { buildNavigationStructure, buildStructureHandler } from '@specBuilder/chartSpecBuilder';
import { Scenegraph } from 'vega-scenegraph';
import { View } from 'vega-view';

import { DimensionList, NavigationRules, NodeObject } from '../node_modules/data-navigator/dist/src/data-navigator';
import { describeNode } from '../node_modules/data-navigator/dist/utilities.js';
import { ChartData, CurrentNodeDetails, Navigation, NavigationEvent, SpatialProperties } from './types';

const convertId = (id, nodeLevel) => {
	const getValueBetweenStrings = (text, startString, endString) => {
		const regex = new RegExp(`${startString}(.*?)${endString}`);
		const match = text.match(regex);

		if (match && match[1]) {
			return match[1];
		}
		return null;
	};
	return nodeLevel === 'dimension'
		? id.substring(1)
		: nodeLevel === 'division'
		? getValueBetweenStrings(id, '_', '_key_')
		: +id.substring(1) + 1;
};

export interface NavigationProps {
	data: ChartData[];
	chartView: MutableRefObject<View | undefined>;
	chartLayers: DimensionList;
	navigationEventCallback?: (navEvent: NavigationEvent) => void;
}

export const Navigator: FC<NavigationProps> = ({ data, chartView, chartLayers, navigationEventCallback }) => {
	const focusedElement = useRef({
		id: '',
	} as CurrentNodeDetails);
	const willFocusAfterRender = useRef(false);
	const firstRef = useRef<HTMLDivElement>(null);
	const secondRef = useRef<HTMLDivElement>(null);

	const navigationStructure = buildNavigationStructure(data, { NAVIGATION_ID_KEY }, chartLayers);
	const structureNavigationHandler = buildStructureHandler(
		{
			nodes: navigationStructure.nodes,
			edges: navigationStructure.edges,
		},
		NAVIGATION_RULES as NavigationRules,
		navigationStructure.dimensions || {}
	);

	const entryPoint = structureNavigationHandler.enter();
	
	const [navigation, setNavigation] = useState<Navigation>({
		transform: '',
		buttonTransform: '',
		current: {
			id: entryPoint.id,
			figureRole: 'figure',
			imageRole: 'img',
			hasInteractivity: true,
			spatialProperties: {
				width: '',
				height: '',
				left: '',
				top: '',
			},
			semantics: {
				label: entryPoint.semantics?.label || '',
			},
		},
	});

	const [childrenInitialized, setInitialization] = useState<boolean>(false);

	const setNavigationElement = (target) => {
		setNavigation({
			transform: '',
			buttonTransform: '',
			current: {
				id: target.id,
				figureRole: 'figure',
				imageRole: 'img',
				hasInteractivity: true,
				spatialProperties: target.spatialProperties || {
					width: '',
					height: '',
					left: '',
					top: '',
				},
				semantics: {
					label: target.semantics?.label || '',
				},
			},
		} as Navigation);
	};

	useEffect(() => {
		if (willFocusAfterRender.current && focusedElement.current.id !== navigation.current.id) {
			focusedElement.current = { id: navigation.current.id };
			willFocusAfterRender.current = false;
			let refToFocus: HTMLDivElement | undefined = undefined;
			if (firstRef.current?.id === navigation.current.id) {
				refToFocus = firstRef.current;
			} else if (secondRef.current?.id === navigation.current.id) {
				refToFocus = secondRef.current
			}
			if (refToFocus) {
				refToFocus.focus()
			}
		}
	}, [navigation]);

	const initializeRenderingProperties = (id: string): SpatialProperties | void => {
		const nodeToCheck: NodeObject = navigationStructure.nodes[id];
		if (!nodeToCheck.spatialProperties) {
			if (!chartView.current) {
				// I want to do this, but will leave it out for now
				// window.setTimeout(()=>{
				//     initializeRenderingProperties(id)
				// }, 500)
			} else {
				const root: Scenegraph = chartView.current.scenegraph().root;
				const items = root.items;
				let offset = -root.bounds.x1;
				if (items.length !== 1) {
					// console.log("what is in items??",items)
				}
				if (root.items[0]?.items?.length) {
					// const roles = ["mark", "legend", "axis", "scope"]
					// const marktypes = ["rect", "group", "arc"]
					const dimensions = Object.keys(navigationStructure.dimensions || {});
					const keysToMatch: string[] = [];
					dimensions.forEach((d) => {
						keysToMatch.push(navigationStructure.dimensions?.[d].dimensionKey || '');
					});
					const setDimensionSpatialProperties = (i, semanticKey) => {
						dimensions.forEach((d) => {
							if (navigationStructure.dimensions && navigationStructure.dimensions[d]) {
								const dimension = navigationStructure.dimensions[d];
								const dimensionNode = navigationStructure.nodes[dimension.nodeId];
								const divisions = Object.keys(dimension.divisions);
								const hasDivisions = divisions.length !== 1;
								const childrenCount = hasDivisions
									? divisions.length
									: Object.keys(dimension.divisions[divisions[0]].values).length;
								const isPlural = childrenCount === 1 ? '' : 's';
								dimensionNode.spatialProperties = {
									width: `${i.bounds.x2 - i.bounds.x1}px`,
									height: `${i.bounds.y2 - i.bounds.y1}px`,
									left: `${i.bounds.x1 + offset}px`,
									top: `${i.bounds.y1}px`,
								};
								dimensionNode.semantics = {
									label: `${
										navigationStructure.dimensions?.[d].dimensionKey
									}. Contains ${childrenCount} ${
										hasDivisions
											? NAVIGATION_SEMANTICS[semanticKey].DIVISION
											: NAVIGATION_SEMANTICS[semanticKey].CHILD
									}${isPlural}. Press ${NAVIGATION_RULES.child.key} key to navigate.`,
								};
							}
						});
					};
					const setDivisionSpatialProperties = (i, semanticKey) => {
						dimensions.forEach((d) => {
							if (navigationStructure.dimensions && navigationStructure.dimensions[d]) {
								const dimension = navigationStructure.dimensions[d];
								const divisions = Object.keys(dimension.divisions);
								if (divisions.length > 1) {
									divisions.forEach((div) => {
										const division = dimension.divisions[div];
										const children = Object.keys(division.values);
										const childrenCount = children.length;
										const divisionNode = navigationStructure.nodes[division.id];
										const isPlural = childrenCount === 1 ? '' : 's';
										const spatialBounds = {
											x1: Infinity,
											x2: -Infinity,
											y1: Infinity,
											y2: -Infinity,
										};
										children.forEach((c) => {
											const child = navigationStructure.nodes[c];
											if (child.spatialProperties) {
												const left = +child.spatialProperties.left.replace(/px/g, '');
												const right = +child.spatialProperties.width.replace(/px/g, '') + left;
												const top = +child.spatialProperties.top.replace(/px/g, '');
												const bottom = +child.spatialProperties.height.replace(/px/g, '') + top;
												spatialBounds.x1 = left < spatialBounds.x1 ? left : spatialBounds.x1;
												spatialBounds.x2 = right > spatialBounds.x2 ? right : spatialBounds.x2;
												spatialBounds.y1 = top < spatialBounds.y1 ? top : spatialBounds.y1;
												spatialBounds.y2 =
													bottom > spatialBounds.y2 ? bottom : spatialBounds.y2;
											}
										});
										divisionNode.spatialProperties = {
											width: `${spatialBounds.x2 - spatialBounds.x1}px`,
											height: `${spatialBounds.y2 - spatialBounds.y1}px`,
											left: `${spatialBounds.x1}px`,
											top: `${spatialBounds.y1}px`,
										};
										const key = navigationStructure.dimensions?.[d].dimensionKey || ""
										const divisionType = division.values[Object.keys(division.values)[0]][key]
										divisionNode.semantics = {
											label: `${divisionType}, ${NAVIGATION_SEMANTICS[semanticKey].DIVISION} of ${key}. Contains ${childrenCount} ${NAVIGATION_SEMANTICS[semanticKey].CHILD}${isPlural}. Press ${NAVIGATION_RULES.child.key} key to navigate.`,
										};
									});
								}
							}
						});
					};
					const setChildSpatialProperties = (i, semanticKey) => {
						const datum = {};
						keysToMatch.forEach((key) => {
							datum[key] = i.datum[key];
						});
						if (i.datum[NAVIGATION_ID_KEY] && navigationStructure.nodes[i.datum[NAVIGATION_ID_KEY]]) {
							const correspondingNode = navigationStructure.nodes[i.datum[NAVIGATION_ID_KEY]];
							correspondingNode.spatialProperties = {
								width: `${i.width}px`,
								height: `${i.height}px`,
								left: `${i.x + offset}px`,
								top: `${i.y}px`,
							};
							correspondingNode.semantics = {
								label: describeNode(datum, {
									semanticLabel: NAVIGATION_SEMANTICS[semanticKey].CHILD + '.',
								}),
							};
						}
					};
					root.items[0].items.forEach((i) => {
                        if (i.name && i.name.indexOf('bar0_group') !== -1 && i.name.indexOf('focus') === -1) {
							// these are bars!
							setDimensionSpatialProperties(i, 'BAR');
							i.items.forEach((bg) => {
                                // using the view we can check for additional scales, if they exist, this needs an offset
                                // NOTE: as of right now, only dodged charts have a scale and need this extra offset calc!
								offset = Object.keys(bg.context?.scales || {}).length ? -root.bounds.x1 + bg.bounds.x1 : offset;
								bg.items.forEach((bg_i) => {
									if (
										bg_i.marktype === 'rect' &&
										bg_i.role === 'mark' &&
										bg_i.name.indexOf('_background') === -1 &&
										bg_i.name.indexOf('focus') === -1
									) {
										bg_i.items.forEach((bar) => {
											setChildSpatialProperties(bar, 'BAR');
										});
									}
								});
							});
							setDivisionSpatialProperties(i, 'BAR');
						} else if (i.marktype === 'arc' && i.role === 'mark') {
							// this is a pie chart!
							// console.log("pie slices",i)
						} else if (i.role === 'axis') {
							// this is an axis!
							// console.log(i.role, i)
						} else if (i.role === 'legend') {
							// this is a legend!
							// console.log(i.role, i)
						} else if (i.marktype === 'rule' && i.role === 'mark' && i.name) {
							// this is a special mark?
							// console.log("TBD: possible baseline/etc mark", i)
						} else if (i.role === 'scope' && i.marktype === 'group' && i.name) {
							// console.log("TBD: need to determine if combo, line, or area")
							// ** if scatter: i.items[0].items[0].items
							// ** if line: i.items are lines, forEach(l) :
							// l.items[0].items
						}
					});
					dimensions.forEach((d) => {
						const dimension = navigationStructure.dimensions?.[d];
						if (dimension && dimension.divisions) {
						}
					});
				}
			}
		}
	};

	const enterChart = () => {
		/* 
            this is a brain-melting problem but on chrome, entering the chart with a mouse click doesn't show the focus indication at first
            this works on firefox! so this likely has to do with how chrome interprets focus-visible versus focus (you can play with these 
            options in dev tools, via toggling focus versus focus-visible, to see)
        */
		initializeRenderingProperties(navigation.current.id);
		setInitialization(true);
		setNavigationElement(navigationStructure.nodes[navigation.current.id]);
		willFocusAfterRender.current = true;
		if (navigationEventCallback) {
			const node = navigationStructure.nodes[navigation.current.id];
			const nodeLevel =
				node.dimensionLevel === 1 ? 'dimension' : node.dimensionLevel === 2 ? 'division' : 'child';
			navigationEventCallback({
				nodeId: navigation.current.id,
				eventType: 'enter',
				vegaId: convertId(navigation.current.id, nodeLevel),
				nodeLevel,
			});
		}
	};
	const handleFocus = (e) => {
		initializeRenderingProperties(e.target.id);
		focusedElement.current = { id: e.target.id };
		if (navigationEventCallback) {
			const node = navigationStructure.nodes[e.target.id];
			const nodeLevel =
				node.dimensionLevel === 1 ? 'dimension' : node.dimensionLevel === 2 ? 'division' : 'child';
			navigationEventCallback({
				nodeId: e.target.id,
				eventType: 'focus',
				vegaId: convertId(navigation.current.id, nodeLevel),
				nodeLevel,
			});
		}
	};
	const handleBlur = () => {
		const blurredId = navigation.current.id;
		focusedElement.current = { id: '' };
		if (navigationEventCallback) {
			const node = navigationStructure.nodes[blurredId];
			const nodeLevel =
				node.dimensionLevel === 1 ? 'dimension' : node.dimensionLevel === 2 ? 'division' : 'child';
			navigationEventCallback({
				nodeId: blurredId,
				eventType: 'blur',
				vegaId: convertId(navigation.current.id, nodeLevel),
				nodeLevel,
			});
		}
	};
	const handleKeydown = (e) => {
		const direction = structureNavigationHandler.keydownValidator(e);
		const target = e.target as HTMLElement;
		if (direction) {
			e.preventDefault();
			const nextNode = structureNavigationHandler.move(target.id, direction);
			if (nextNode) {
				setNavigationElement(nextNode);
				willFocusAfterRender.current = true;
			}
		}
		if (e.code === 'Space') {
			e.preventDefault();
			if (navigationEventCallback) {
				const node = navigationStructure.nodes[target.id];
				const nodeLevel =
					node.dimensionLevel === 1 ? 'dimension' : node.dimensionLevel === 2 ? 'division' : 'child';
				navigationEventCallback({
					nodeId: target.id,
					eventType: 'selection',
					vegaId: convertId(navigation.current.id, nodeLevel),
					nodeLevel,
				});
			}
		}
	};

	const dummySpecs: Navigation = {
		...navigation,
	};
	dummySpecs.current = { id: 'old' + navigation.current.id };
	dummySpecs.current.semantics = { label: '' };
	dummySpecs.current.spatialProperties = { ...navigation.current.spatialProperties };
	const firstProps = !firstRef.current || focusedElement.current.id !== firstRef.current.id ? navigation : dummySpecs;
	const secondProps = firstProps.current.id === navigation.current.id ? dummySpecs : navigation;

	const figures = (
		<div>
			<div
				ref={firstRef}
				id={firstProps.current.id}
				className="dn-node dn-test-class"
				tabIndex={firstProps.current.hasInteractivity ? 0 : undefined}
				style={firstProps.current.spatialProperties}
				onFocus={firstProps.current.hasInteractivity ? handleFocus : undefined}
				onKeyDown={firstProps.current.hasInteractivity ? handleKeydown : undefined}
				role={firstProps.current.imageRole || 'presentation'}
				aria-label={firstProps.current.semantics?.label || undefined}
			></div>
			<div
				ref={secondRef}
				id={secondProps.current.id}
				className="dn-node dn-test-class"
				tabIndex={secondProps.current.hasInteractivity ? 0 : undefined}
				style={secondProps.current.spatialProperties}
				onFocus={secondProps.current.hasInteractivity ? handleFocus : undefined}
				onKeyDown={secondProps.current.hasInteractivity ? handleKeydown : undefined}
				role={secondProps.current.imageRole || 'presentation'}
				aria-label={secondProps.current.semantics?.label || undefined}
			></div>
		</div>
	);
	/* 
        goals:
            - add exit event + handling
            - add alt text to root chart element
                - possibly also hide vega's stuff
            - append an exit element within the appended parent element for our navigation stuff
            - add help menu/popup on "help" command?
            - add handling for resizing/etc
    */
	return (
		<>
			<div
				role="application"
				aria-label="Data navigation structure"
				aria-activedescendant={focusedElement.current ? focusedElement.current.id : ''}
				className="dn-wrapper"
				style={{ width: '100%', transform: navigation.transform }}
				onBlur={handleBlur}
			>
				<button
					id="dn-entry-button-data-navigator-schema"
					className="dn-entry-button"
					style={{ transform: navigation.buttonTransform }}
					onClick={enterChart}
				>
					Enter navigation area
				</button>
				{childrenInitialized ? figures : null}
			</div>
		</>
	);
};
