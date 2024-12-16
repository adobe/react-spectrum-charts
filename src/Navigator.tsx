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
import { DimensionList, NodeObject } from '../node_modules/data-navigator/dist/src/data-navigator'
import { describeNode } from '../node_modules/data-navigator/dist/utilities.js'
import { buildNavigationStructure, buildStructureHandler } from '@specBuilder/chartSpecBuilder';
import { Navigation, CurrentNodeDetails, ChartData, SpatialProperties} from './types'
import { View } from 'vega-view'
import { Scenegraph } from 'vega-scenegraph';
import { NAVIGATION_ID_KEY } from '@constants'

export interface NavigationProps {
    data: ChartData[];
    chartView: MutableRefObject<View | undefined>;
    chartLayers: DimensionList;
}

export const Navigator: FC<NavigationProps> = ({data, chartView, chartLayers}) => {
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
        navigationStructure.navigationRules || {}, 
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
        console.log("changing to new target",target.id,target)
        // console.log("navigationStructure.navigationRules",navigationStructure.navigationRules)
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
    // setNavigationElement(entryPoint)
    
    useEffect(()=>{
        if (willFocusAfterRender.current && focusedElement.current.id !== navigation.current.id) {
            focusedElement.current = {id: navigation.current.id}
            willFocusAfterRender.current = false
            // console.log("firstRef",firstRef)
            // console.log("secondRef",secondRef)
            // console.log("navigation.current.id",navigation)
            // console.log("focusedElement",focusedElement)
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
            console.log("INITIALIZING PROPERTIES!")
            if (!chartView.current) {
                // I want to do this, but will leave it out for now
                // window.setTimeout(()=>{
                //     initializeRenderingProperties(id)
                // }, 500)
            } else {
                const root: Scenegraph = chartView.current.scenegraph().root
                const items = root.items
                if (items.length !== 1) {
                    console.log("what is in items??",items)
                }
                if (root.items[0]?.items?.length) {
                    // const roles = ["mark", "legend", "axis", "scope"]
                    // const marktypes = ["rect", "group", "arc"]
                    const dimensions = Object.keys(navigationStructure.dimensions || {})
                    const keysToMatch: string[] = []
                    dimensions.forEach(d=>{
                        keysToMatch.push(navigationStructure.dimensions?.[d].dimensionKey || "")
                    })
                    root.items[0].items.forEach((i) => {
                        if (i.marktype === "rect" && i.role === "mark" && i.name.indexOf("_background") === -1) {
                            // these are the bars in a bar chart!
                            // console.log("bars",i)
                            i.items.forEach(bar => {
                                // console.log("bar", bar, bar.datum)
                                const datum = {}
                                keysToMatch.forEach(key => {
                                    datum[key] = bar.datum[key]
                                })
                                if (bar.datum[NAVIGATION_ID_KEY] && navigationStructure.nodes[bar.datum[NAVIGATION_ID_KEY]]) {
                                    const correspondingNode = navigationStructure.nodes[bar.datum[NAVIGATION_ID_KEY]];
                                    
                                    correspondingNode.spatialProperties = {
                                        width: `${bar.width}px`,
                                        height: `${bar.height}px`,
                                        left: `${bar.x}px`,
                                        top: `${bar.y}px`,
                                    }
                                    correspondingNode.semantics = {
                                        label: describeNode(datum, {semanticLabel: "Bar."})
                                    }
                                    console.log("correspondingNode",correspondingNode)
                                }
                            })
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
                }
            }
        }
    }

    const enterChart = () => {
        initializeRenderingProperties(navigation.current.id)
        setInitialization(true)
        setNavigationElement(navigationStructure.nodes[navigation.current.id]);
        willFocusAfterRender.current = true
        // document.getElementById(navigation.current.id)?.focus()
    }
    const handleFocus = (e) => {
        console.log("focused",e)
        initializeRenderingProperties(e.target.id)
        focusedElement.current = {id: e.target.id}
    }
    const handleBlur = (e) => {
        console.log("bluring at parent",e)
        focusedElement.current = {id: ""}
    }
    const handleKeydown = (e) => {
        const direction = structureNavigationHandler.keydownValidator(e);
        console.log("direction",direction)
        if (direction) {
            e.preventDefault();
            const nextNode = structureNavigationHandler.move(e.target.id, direction);
            if (nextNode) {
                setNavigationElement(nextNode);
                willFocusAfterRender.current = true
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
            - fix over-initialization (on every focus)
            - fix off placement of focus
            - fix bugs in line, combo, and area
            - [dn work] create dataNavigator functions to:
                - compress divisions if all divisions of a dimension only have a single child (as an option), aka make a "list" within that dimension (this is good for regular bar charts, as an example)
                    - create a function to hide a particular division/dimension parent? this would be helpful for some cases like a bar chart, where you want sorted numerical nav at the child level, but not division/dimension parents
                - nest n divisions within divisions (make this a much smarter process)
                - add type for what Input returns, improve consistency of those functions
            - create semantics for axes, legends, groups, etc
            - create spatialProperties for axes, legends, groups, etc
            - add alt text to root chart element
                - possibly also hide vega's stuff
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
