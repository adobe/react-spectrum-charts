/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { Scale, Signal, Data, GroupMark, Mark } from 'vega'
import { BulletSpecProps } from '../../types';
import { getColorValue } from '../specUtils';

export function getBulletScales(props: BulletSpecProps): Scale[] {
    const bulletScale: Scale[] = [
        {
            "name": "yscale",
            "type": "band",
            "domain": { "data": "table", "field": `${props.dimension}` },
            "range": [0, { "signal": "height" }],
            "paddingInner": { "signal": "paddingRatio" }
        },
        {
            "name": "xscale",
            "type": "linear",
            "domain": { "data": "table", "fields": ["xPaddingForTarget", `${props.metric}`] },
            "range": "width",
            "round": true,
            "zero": true
        }
    ]
  
    return bulletScale;
}

export function getBulletSignals(): Signal[] {
    const bulletSignals: Signal[] = [
        { "name": "gap", "value": 12 },
        { "name": "bulletHeight", "value": 8 },
        { "name": "bulletThresholdHeight", "update": "bulletHeight * 3" },
        { "name": "targetHeight", "update": "bulletThresholdHeight + 6" },
        { "name": "bulletGroupHeight", "update": "bulletThresholdHeight + 24" },
        { "name": "paddingRatio", "update": "gap / (gap + bulletGroupHeight)" },
        {
            "name": "height",
            "update": "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap"
        }
    ]

    return bulletSignals;
}

export function getBulletData(props: BulletSpecProps): Data[] {

    //We are multiplying the target by 1.05 to make sure that the target line is never at the very end of the graph
    const bulletData: Data[] = [
        {
            "name": "table",
            "values": [],
            "transform": [
                {
                    "type": "formula",
                    "expr": `round(datum.${props.target} * 1.05)`,
                    "as": "xPaddingForTarget"
                }
            ]
        }
    ]
  
    return bulletData;
}

export function getBulletMarks(props: BulletSpecProps): GroupMark {

    const bulletMark: GroupMark = {
        "name": "bulletGroup",
        "type": "group",
        "from": {
            "facet": { "data": "table", "name": "bulletGroups", "groupby": `${props.dimension}` }
        },
        "encode": {
            "update": {
                "y": { "scale": "yscale", "field": `${props.dimension}` },
                "height": { "signal": "bulletGroupHeight" },
                "width": { "signal": "width" }
            }
        },
        "marks": []
    }

    bulletMark[0].marks?.push(getBulletMarkRect(props));
    bulletMark[0].marks?.push(getBulletMarkTarget(props));
    bulletMark[0].marks?.push(getBulletMarkLabel(props));
    bulletMark[0].marks?.push(getBulletMarkValueLabel(props));

    return bulletMark
}

export function getBulletMarkRect(props: BulletSpecProps): Mark {

    const bulletMarkRect: Mark = {
        "name": `${props.name}Rect`,
        "description": `${props.name}Rect`,
        "type": "rect",
        "from": { "data": "bulletGroups" },
        "encode": {
            "enter": {
            "cornerRadiusTopLeft": [
                { "test": "datum.amount < 0", "value": 3 }
            ],
            "cornerRadiusBottomLeft": [
                { "test": "datum.amount < 0", "value": 3 }
            ],
            "cornerRadiusTopRight": [
                { "test": "datum.amount > 0", "value": 3 }
            ],
            "cornerRadiusBottomRight": [
                { "test": "datum.amount > 0", "value": 3 }
            ],
            "fill": [{ "value": `${props.color}` }]
            },
            "update": {
                "x": { "scale": "xscale", "value": 0 },
                "x2": { "scale": "xscale", "field": `${props.metric}` },
                "height": { "signal": "bulletHeight" },
                "y": { "signal": "bulletGroupHeight - 3 - 2 * bulletHeight" }
            }
        }
    }

    return bulletMarkRect

}

export function getBulletMarkTarget(props: BulletSpecProps): Mark {

    const solidColor = getColorValue('gray-900', props.colorScheme);

    const bulletMarkTarget: Mark = {
        "name": `${props.name}Target`,
        "description": `${props.name}Target`,
        "type": "rule",
        "from": { "data": "bulletGroups" },
        "encode": {
            "enter": {
            "stroke": { "value": `${solidColor}` },
            "strokeWidth": { "value": 2 }
            },
            "update": {
                "x": { "scale": "xscale", "field": `${props.target}` },
                "y": { "signal": "bulletGroupHeight - targetHeight" },
                "y2": { "signal": "bulletGroupHeight" }
            }
        }
    }

    return bulletMarkTarget

}

export function getBulletMarkLabel(props: BulletSpecProps): Mark {

    const barLabelColor = getColorValue('gray-600', props.colorScheme);

    const bulletMarkLabel: Mark = {
        "name": `${props.name}Label`,
        "description": `${props.name}Label`,
        "type": "text",
        "from": { "data": "bulletGroups" },
        "encode": {
            "enter": {
            "text": { "signal": `datum.${props.dimension}` },
            "align": { "value": "left" },
            "baseline": { "value": "top" },
            "fill": {"value": `${barLabelColor}`}
            },
            "update": { "x": { "value": 0 }, "y": { "value": 0 } }
        }
    }

    return bulletMarkLabel

}

export function getBulletMarkValueLabel(props: BulletSpecProps): Mark {

    const solidColor = getColorValue('gray-900', props.colorScheme);

    const bulletMarkValueLabel: Mark = {
        "name": `${props.name}ValueLabel`,
        "description": `${props.name}ValueLabel`,
        "type": "text",
        "from": { "data": "bulletGroups" },
        "encode": {
            "enter": {
            "text": { "signal": `datum.${props.metric}` },
            "align": { "value": "right" },
            "baseline": { "value": "top" },
            "fill": {"value": `${solidColor}`}
            },
            "update": { "x": { "signal": "width" }, "y": { "value": 0 } }
        }
    }

    return bulletMarkValueLabel

}