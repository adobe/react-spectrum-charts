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
export type Navigation = {
    transform: string;
    buttonTransform: string;
    current: CurrentNodeDetails;
}

export type NavigationEvent = {
    // focus and blur should be self-explanatory
    // selection emits if spacebar is pressed
    // enter is an event that only happens when the "enter" button is run, this emits BEFORE focus
    // exit is an event that only happens when the "exit" key is pressed, this emits BEFORE blur
    // help is an event that only happens when the "help" key is pressed (if set)
    eventType: "focus" | "blur" | "selection" | "enter" | "exit" | "help";
    // the ID of the node being focused, blurred, exited from, selected, etc
    nodeId: string;
    // the vega-compatible ID of the node being focused, blurred, exited from, selected, etc
    vegaId: string;
    // these correspond to the 3 layers within data navigator
    // dimensions are like the keys used in the data (eg "country")
    // divisions are the collections of values within that dimension (eg "USA" or "1-50" if numerical)
    // child is the lowest level of a dimension, the children of divisions
    // if divisions only ever have 1 child each, they are skipped and the level goes straight from
    // dimension to child (this is what happens in a basic bar chart)
    nodeLevel: "dimension" | "division" | "child";
}

export type SpatialProperties = {
    height?: string;
    width?: string;
    left?: string;
    top?: string;
}

export type CurrentNodeDetails = {
    id: string;
    figureRole?: "figure";
    imageRole?: "img";
    hasInteractivity?: boolean;
    spatialProperties?: SpatialProperties;
    semantics?: {
        label: string
    };
}