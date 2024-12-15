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
import { DimensionList } from '../node_modules/data-navigator/dist/src/data-navigator'
import { buildNavigationStructure, buildStructureHandler } from '@specBuilder/chartSpecBuilder';
import { Navigation, CurrentNodeDetails, ChartData} from './types'
import { View } from 'vega';

export interface NavigationProps {
    data: ChartData;
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

    const navigationStructure = buildNavigationStructure(data, {}, chartLayers)
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

    const setNavigationElement = (target) => {
        console.log("changing to new target",target.id)
        // console.log("navigationStructure.navigationRules",navigationStructure.navigationRules)
        setSpatialProperties()
        setNavigation({
            transform: "",
            buttonTransform: "",
            current: {
                id: target.id,
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
                    label: "testing semantics!"
                }
            }
        })
    }
    // setNavigationElement(entryPoint)
    
    useEffect(()=>{
        if (willFocusAfterRender.current && focusedElement.current.id !== navigation.current.id) {
            focusedElement.current = {id: navigation.current.id}
            willFocusAfterRender.current = false
            console.log("firstRef",firstRef)
            console.log("secondRef",secondRef)
            // console.log("navigation.current.id",navigation)
            // console.log("focusedElement",focusedElement)
            if (firstRef.current?.id === navigation.current.id) {
                firstRef.current.focus()
            } else if (secondRef.current?.id === navigation.current.id) {
                secondRef.current.focus()
            }
        }
    }, [navigation])

    const handleFocus = (e) => {
        console.log("focused",e)
        focusedElement.current = {id: e.target.id}
    }
    const handleBlur = (e) => {
        console.log("bluring at parent",e)
        focusedElement.current = {id: ""}
    }
    const handleKeydown = (e) => {
        // console.log("keydown",e)
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
    const setSpatialProperties = () => {
        console.log(chartView?.current)
    }

    const dummySpecs: Navigation = {
        ...navigation
    }
    dummySpecs.current = { id : "old" + navigation.current.id }
    dummySpecs.current.semantics = { label: ""}
    dummySpecs.current.spatialProperties = { ...navigation.current.spatialProperties }
    const firstProps = !firstRef.current || focusedElement.current.id !== firstRef.current.id ? navigation : dummySpecs
    const secondProps = firstProps.current.id === navigation.current.id ? dummySpecs : navigation

	return (
        <>
            <div id="dn-wrapper-data-navigator-schema" role="application" aria-label="Data navigation structure" aria-activedescendant={focusedElement.current ? focusedElement.current.id : ""} className="dn-wrapper" style={{width: "100%", transform: navigation.transform}} onBlur={handleBlur}>
                    {/* <button id="dn-entry-button-data-navigator-schema" className="dn-entry-button" style={{transform: navigation.buttonTransform}}>Enter navigation area</button> */}
                    <figure ref={firstRef} role={firstProps.current.figureRole || "presentation"} id={firstProps.current.id} className="dn-node dn-test-class" tabIndex={firstProps.current.hasInteractivity ? 0 : undefined} style={firstProps.current.spatialProperties} onFocus={firstProps.current.hasInteractivity ? handleFocus : undefined} onKeyDown={firstProps.current.hasInteractivity ? handleKeydown : undefined}>
                        <div role={firstProps.current.imageRole || "presentation"} className="dn-node-text" aria-label={firstProps.current.semantics?.label || undefined}></div>
                    </figure>
                    <figure ref={secondRef} role={secondProps.current.figureRole || "presentation"} id={secondProps.current.id} className="dn-node dn-test-class" tabIndex={secondProps.current.hasInteractivity ? 0 : undefined} style={secondProps.current.spatialProperties} onFocus={secondProps.current.hasInteractivity ? handleFocus : undefined} onKeyDown={secondProps.current.hasInteractivity ? handleKeydown : undefined}>
                        <div role={secondProps.current.imageRole || "presentation"} className="dn-node-text" aria-label={secondProps.current.semantics?.label || undefined}></div>
                    </figure>
            </div>
        </>
    )
}
