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
import { FC, useEffect, useRef, useState, MutableRefObject } from 'react'
import { DimensionList, NavigationRules, NodeObject } from '../node_modules/data-navigator/dist/src/data-navigator'
import { describeNode } from '../node_modules/data-navigator/dist/utilities.js'
import { buildNavigationStructure, buildStructureHandler } from '@specBuilder/chartSpecBuilder';
import { Navigation, NavigationEvent, CurrentNodeDetails, ChartData, SpatialProperties} from './types'
import { View } from 'vega-view'
import { Scenegraph } from 'vega-scenegraph';
import { NAVIGATION_ID_KEY, NAVIGATION_RULES, NAVIGATION_SEMANTICS } from '@constants'

export interface NavigationProps {
    data: ChartData[];
    chartView: MutableRefObject<View | undefined>;
    chartLayers: DimensionList;
    navigationEventCallback?: (navEvent: NavigationEvent) => void;
}

export const Navigator: FC<NavigationProps> = ({data, chartView, chartLayers, navigationEventCallback}) => {
    const focusedElement = useRef({
        id: ""
    } as CurrentNodeDetails)
    const willFocusAfterRender = useRef(false);
    const firstRef = useRef<HTMLElement>(null);
    const secondRef = useRef<HTMLElement>(null);

    const navigationStructure = buildNavigationStructure(data, {NAVIGATION_ID_KEY}, chartLayers)
    const structureNavigationHandler = buildStructureHandler(
        {
            nodes: navigationStructure.nodes,
            edges: navigationStructure.edges,
        },
        NAVIGATION_RULES as NavigationRules, 
        navigationStructure.dimensions || {}
    )
    const entryPoint = structureNavigationHandler.enter()
    const [navigation, setNavigation] = useState<Navigation>({
        transform: "",
        buttonTransform: "",
        current: {
            id: entryPoint.id,
            figureRole: "figure",
            imageRole: "image",
            hasInteractivity: true,
            spatialProperties: {
                width: "",
                height: "",
                left: "",
                top: ""
            },
            semantics: {
                label: entryPoint.semantics?.label || "initial element test"
            }
        }
    })

    const [childrenInitialized, setInitialization] = useState<boolean>(false)

    const setNavigationElement = (target) => {
        setNavigation({
            transform: "",
            buttonTransform: "",
            current: {
                id: target.id,
                figureRole: "figure",
                imageRole: "image",
                hasInteractivity: true,
                spatialProperties: target.spatialProperties || {
                    width: "",
                    height: "",
                    left: "",
                    top: ""
                },
                semantics: {
                    label: target.semantics?.label || "no label yet"
                }
            }
        })
    }
    
    useEffect(()=>{
        if (willFocusAfterRender.current && focusedElement.current.id !== navigation.current.id) {
            focusedElement.current = {id: navigation.current.id}
            willFocusAfterRender.current = false
            if (firstRef.current?.id === navigation.current.id) {
                firstRef.current.focus()
            } else if (secondRef.current?.id === navigation.current.id) {
                secondRef.current.focus()
            }
        }
    }, [navigation])

    const initializeRenderingProperties = (id: string): SpatialProperties | void => {
        const nodeToCheck: NodeObject = navigationStructure.nodes[id]
        if (!nodeToCheck.spatialProperties) {
            if (!chartView.current) {
                // I want to do this, but will leave it out for now
                // window.setTimeout(()=>{
                //     initializeRenderingProperties(id)
                // }, 500)
            } else {
                const root: Scenegraph = chartView.current.scenegraph().root
                const items = root.items
                const offset = -root.bounds.x1
                if (items.length !== 1) {
                    // console.log("what is in items??",items)
                }
                if (root.items[0]?.items?.length) {
                    // const roles = ["mark", "legend", "axis", "scope"]
                    // const marktypes = ["rect", "group", "arc"]
                    const dimensions = Object.keys(navigationStructure.dimensions || {})
                    const keysToMatch: string[] = []
                    dimensions.forEach(d=>{
                        keysToMatch.push(navigationStructure.dimensions?.[d].dimensionKey || "")
                    })
                    const setDimensionSpatialProperties = (i, semanticKey) => {
                        dimensions.forEach(d=>{
                            if (navigationStructure.dimensions && navigationStructure.dimensions[d]) {
                                const dimension = navigationStructure.dimensions[d]
                                const dimensionNode = navigationStructure.nodes[dimension.nodeId]
                                const divisions = Object.keys(dimension.divisions)
                                const hasDivisions = divisions.length !== 1
                                const childrenCount = hasDivisions ? divisions.length : Object.keys(dimension.divisions[divisions[0]].values).length
                                const isPlural = childrenCount === 1 ? "" : "s"
                                dimensionNode.spatialProperties = {
                                    width: `${i.bounds.x2 - i.bounds.x1}px`,
                                    height: `${i.bounds.y2 - i.bounds.y1}px`,
                                    left: `${i.bounds.x1 + offset}px`,
                                    top: `${i.bounds.y1}px`,
                                }
                                dimensionNode.semantics = {
                                    label: `${navigationStructure.dimensions?.[d].dimensionKey}. Contains ${childrenCount} ${hasDivisions ? NAVIGATION_SEMANTICS[semanticKey].DIVISION : NAVIGATION_SEMANTICS[semanticKey].CHILD}${isPlural}. Press ${NAVIGATION_RULES.child.key} key to navigate.`
                                }
                            }
                        })
                    }
                    const setDivisionSpatialProperties = (i, semanticKey) => {
                        dimensions.forEach(d => {
                            if (navigationStructure.dimensions && navigationStructure.dimensions[d]) {
                                const dimension = navigationStructure.dimensions[d]
                                const divisions = Object.keys(dimension.divisions)
                                if (divisions.length > 1) {
                                    divisions.forEach(div => {
                                        const division = dimension.divisions[div]
                                        const children = Object.keys(division.values)
                                        const childrenCount = children.length
                                        const divisionNode = navigationStructure.nodes[division.id]
                                        const isPlural = childrenCount === 1 ? "" : "s"
                                        const spatialBounds = {
                                            x1: 0,
                                            x2: 0,
                                            y1: 0,
                                            y2: 0
                                        }
                                        children.forEach(c => {
                                            const child = navigationStructure.nodes[c]
                                            if (child.spatialProperties) {
                                                const left = +child.spatialProperties.left.replace(/px/g,'')
                                                const right = +child.spatialProperties.width.replace(/px/g,'') + left
                                                const top = +child.spatialProperties.top.replace(/px/g,'')
                                                const bottom = +child.spatialProperties.height.replace(/px/g,'') + top
                                                spatialBounds.x1 = left < spatialBounds.x1 ? left : spatialBounds.x1
                                                spatialBounds.x2 = right > spatialBounds.x2 ? right : spatialBounds.x2
                                                spatialBounds.y1 = top < spatialBounds.y1 ? top : spatialBounds.y1
                                                spatialBounds.y2 = bottom > spatialBounds.y2 ? bottom : spatialBounds.y2
                                            }
                                        })
                                        divisionNode.spatialProperties = {
                                            width: `${spatialBounds.x1 + spatialBounds.x2}px`,
                                            height: `${spatialBounds.y1 + spatialBounds.y2}px`,
                                            left: `${spatialBounds.x1 + offset}px`,
                                            top: `${spatialBounds.y1}px`,
                                        }
                                        divisionNode.semantics = {
                                            label: `${NAVIGATION_SEMANTICS[semanticKey].DIVISION} of ${navigationStructure.dimensions?.[d].dimensionKey}. Contains ${childrenCount} ${NAVIGATION_SEMANTICS[semanticKey].CHILD}${isPlural}. Press ${NAVIGATION_RULES.child.key} key to navigate.`
                                        }
                                    })
                                }
                            }
                        })
                    }
                    root.items[0].items.forEach((i) => {
                        if (i.marktype === "rect" && i.role === "mark" && i.name.indexOf("_background") === -1) {
                            // these are the bars in a bar chart!
                            setDimensionSpatialProperties(i, "BAR")
                            i.items.forEach(bar => {
                                const datum = {}
                                keysToMatch.forEach(key => {
                                    datum[key] = bar.datum[key]
                                })
                                if (bar.datum[NAVIGATION_ID_KEY] && navigationStructure.nodes[bar.datum[NAVIGATION_ID_KEY]]) {
                                    const correspondingNode = navigationStructure.nodes[bar.datum[NAVIGATION_ID_KEY]];
                                    
                                    correspondingNode.spatialProperties = {
                                        width: `${bar.width}px`,
                                        height: `${bar.height}px`,
                                        left: `${bar.x + offset}px`,
                                        top: `${bar.y}px`,
                                    }
                                    correspondingNode.semantics = {
                                        label: describeNode(datum, {semanticLabel: NAVIGATION_SEMANTICS.BAR.CHILD + '.'})
                                    }
                                }
                            })
                            setDivisionSpatialProperties(i, "BAR")
                        } else if (i.marktype === "arc" && i.role === "mark") {
                            // this is a pie chart!
                            // console.log("pie slices",i)
                        } else if (i.role === "axis") {
                            // this is an axis!
                            // console.log(i.role, i)
                        } else if (i.role === "legend") {
                            // this is a legend!
                            // console.log(i.role, i)
                        } else if (i.marktype === "rule" && i.role === "mark" && i.name) {
                            // this is a special mark?
                            // console.log("TBD: possible baseline/etc mark", i)
                        } else if (i.role === "scope" && i.marktype === "group" && i.name) {
                            // console.log("TBD: need to determine if combo, line, or area")
                            // ** if scatter: i.items[0].items[0].items
                            // ** if line: i.items are lines, forEach(l) :
                                // l.items[0].items
                        }
                    })
                    dimensions.forEach(d=>{
                        const dimension = navigationStructure.dimensions?.[d]
                        if (dimension && dimension.divisions) {
                            
                        }
                    })
                }
            }
        }
    }

    const enterChart = () => {
        /* 
            this is a brain-melting problem but on chrome, entering the chart with a mouse click doesn't show the focus indication at first
            this works on firefox! so this likely has to do with how chrome interprets focus-visible versus focus (you can play with these 
            options in dev tools, via toggling focus versus focus-visible, to see)
        */
        initializeRenderingProperties(navigation.current.id)
        setInitialization(true)
        setNavigationElement(navigationStructure.nodes[navigation.current.id]);
        willFocusAfterRender.current = true
        if (navigationEventCallback) {
            const node = navigationStructure.nodes[navigation.current.id]
            navigationEventCallback({
                nodeId: navigation.current.id,
                eventType: "enter",
                nodeLevel: node.dimensionLevel === 1 ? "dimension" : node.dimensionLevel === 2 ? "division" : "child"
            })
        }
    }
    const handleFocus = (e) => {
        initializeRenderingProperties(e.target.id)
        focusedElement.current = {id: e.target.id}
        if (navigationEventCallback) {
            const node = navigationStructure.nodes[e.target.id]
            navigationEventCallback({
                nodeId: e.target.id,
                eventType: "focus",
                nodeLevel: node.dimensionLevel === 1 ? "dimension" : node.dimensionLevel === 2 ? "division" : "child"
            })
        }
    }
    const handleBlur = () => {
        const blurredId = navigation.current.id
        focusedElement.current = {id: ""}
        if (navigationEventCallback) {
            const node = navigationStructure.nodes[blurredId]
            navigationEventCallback({
                nodeId: blurredId,
                eventType: "blur",
                nodeLevel: node.dimensionLevel === 1 ? "dimension" : node.dimensionLevel === 2 ? "division" : "child"
            })
        }
    }
    const handleKeydown = (e) => {
        const direction = structureNavigationHandler.keydownValidator(e);
        console.log("e.code",e.code,"direction",direction)
        const target = e.target as HTMLElement
        if (direction) {
            e.preventDefault();
            const nextNode = structureNavigationHandler.move(target.id, direction);
            if (nextNode) {
                setNavigationElement(nextNode);
                willFocusAfterRender.current = true
            }
        }
        if (e.code === "Space") {
            e.preventDefault();
            if (navigationEventCallback) {
                const node = navigationStructure.nodes[target.id]
                navigationEventCallback({
                    nodeId: target.id,
                    eventType: "selection",
                    nodeLevel: node.dimensionLevel === 1 ? "dimension" : node.dimensionLevel === 2 ? "division" : "child"
                })
            }
        }
    }

    const dummySpecs: Navigation = {
        ...navigation
    }
    dummySpecs.current = { id : "old" + navigation.current.id }
    dummySpecs.current.semantics = { label: ""}
    dummySpecs.current.spatialProperties = { ...navigation.current.spatialProperties }
    const firstProps = !firstRef.current || focusedElement.current.id !== firstRef.current.id ? navigation : dummySpecs
    const secondProps = firstProps.current.id === navigation.current.id ? dummySpecs : navigation

    const figures = (
        <div>
            <figure ref={firstRef} role={firstProps.current.figureRole || "presentation"} id={firstProps.current.id} className="dn-node dn-test-class" tabIndex={firstProps.current.hasInteractivity ? 0 : undefined} style={firstProps.current.spatialProperties} onFocus={firstProps.current.hasInteractivity ? handleFocus : undefined} onKeyDown={firstProps.current.hasInteractivity ? handleKeydown : undefined}>
                <div role={firstProps.current.imageRole || "presentation"} className="dn-node-text" aria-label={firstProps.current.semantics?.label || undefined}></div>
            </figure>
            <figure ref={secondRef} role={secondProps.current.figureRole || "presentation"} id={secondProps.current.id} className="dn-node dn-test-class" tabIndex={secondProps.current.hasInteractivity ? 0 : undefined} style={secondProps.current.spatialProperties} onFocus={secondProps.current.hasInteractivity ? handleFocus : undefined} onKeyDown={secondProps.current.hasInteractivity ? handleKeydown : undefined}>
                <div role={secondProps.current.imageRole || "presentation"} className="dn-node-text" aria-label={secondProps.current.semantics?.label || undefined}></div>
            </figure>
        </div>
    )
    /* 
        goals:
            - add exit event + handling
            - create semantics for axes, legends, etc
            - create spatialProperties for axes, legends, etc
            - add alt text to root chart element
                - possibly also hide vega's stuff
            - append an exit element within the appended parent element for our navigation stuff
            - add help menu and "return to chart" button?
            - add handling for resizing/etc
    */
	return (
        <>
            <div id="dn-wrapper-data-navigator-schema" role="application" aria-label="Data navigation structure" aria-activedescendant={focusedElement.current ? focusedElement.current.id : ""} className="dn-wrapper" style={{width: "100%", transform: navigation.transform}} onBlur={handleBlur}>
                    <button id="dn-entry-button-data-navigator-schema" className="dn-entry-button" style={{transform: navigation.buttonTransform}} onClick={enterChart}>Enter navigation area</button>
                    {childrenInitialized ? figures : null}
            </div>
        </>
    )
}
