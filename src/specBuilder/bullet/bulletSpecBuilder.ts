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

import { DEFAULT_COLOR_SCHEME } from '@constants';
import { produce } from 'immer';
import { Spec, Data, Mark, Scale } from 'vega';
import { ColorScheme, BulletProps, BulletSpecProps } from '../../types';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';

const DEFAULT_COLOR = 'steelblue';

export const addBullet = produce<
    Spec,
    [BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }]
>(
    (
        spec,
        {
            children,
            colorScheme = DEFAULT_COLOR_SCHEME,
            index = 0,
            name,
            metric,
            dimension,
            target,
            color = DEFAULT_COLOR,
            ...props
        }
    ) => {

        const bulletProps: BulletSpecProps = {
            children: sanitizeMarkChildren(children),
            colorScheme: colorScheme,
            index,
            color: getAdjustedColor(color, colorScheme),
            metric: metric ?? 'currentAmount',
            dimension: dimension ?? 'graphLabel',
            target: target ?? 'target',
            name: toCamelCase(name ?? `bullet${index}`),
            ...props,
        };
        console.log(bulletProps);
        spec.data = getBulletData(bulletProps);
        spec.marks = getBulletMarks(bulletProps);
        spec.scales = getBulletScales();
    }
);

export function getBulletMarks(props: BulletSpecProps): Mark[] {
  
  return [
    {
      "type": "rect",
      "name": `${props.name}rect`,
      "from": {"data": "table"},
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {"field": "index", "mult": 60, "offset": -44},
          "width": {"scale": "xscale", "field": `${props.metric}`},
          "height": {"value": 6},
          "fill": {"value": `${props.color}`},
          "cornerRadiusTopRight": {"value": 2},
          "cornerRadiusBottomRight": {"value": 2}
        }
      }
    },
    {
      "type": "text",
      "name": `${props.name}barlabel`,
      "from": {"data": "table"},
      "description": "graphLabel",
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {"field": "index", "mult": 60, "offset": -60},
          "text": {"field": `${props.dimension}`},
          "align": {"value": "left"},
          "baseline": {"value": "bottom"},
          "fontSize": {"value": 11.5},
          "fill": {"value": "grey"}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "table"},
      "name": `${props.name}amountlabel`,
      "description": "currentAmount",
      "encode": {
        "enter": {
          "x": {"signal": "width"},
          "y": {"field": "index", "mult": 60, "offset": -60},
          "text": {"field": `${props.metric}`},
          "align": {"value": "right"},
          "baseline": {"value": "bottom"},
          "fontSize": {"value": 11.5},
          "fill": {"value": "black"}
        }
      }
    },
    {
      "type": "rule",
      "from": {"data": "table"},
      "name": `${props.name}rule`,
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": `${props.target}`},
          "y": {"field": "index", "mult": 60, "offset": -53},
          "y2": {"field": "index", "mult": 60, "offset": -29},
          "stroke": {"value": "black"},
          "strokeWidth": {"value": 2},
        }
      }
    }
  ]
}

export function getBulletData(props: BulletSpecProps): Data[] {

  const maxValue = `max(datum.${props.metric}, datum.${props.target} * 1.1)`

  const bulletData: Data[] = [
    {
      "name": "table",
      "values": [],
      "transform": [
        {
          "type": "filter",
          "expr": "isValid(datum.graphLabel) && datum.graphLabel !== null && datum.graphLabel !== ''"
        },
        {
          "type": "formula",
          "as": "maxValue",
          "expr": maxValue
        },
        {
          "type": "window",
          "ops": ["row_number"],
          "as": ["index"]
        }
      ]
    },
    {
      "name": "max_values",
      "source": "table",
      "transform": [
        {
          "type": "aggregate",
          "ops": ["max"],
          "fields": ["maxValue"],
          "as": ["maxOverall"]
        }
      ]
    }
  ]

  return bulletData;
}

export function getBulletScales(): Scale[] {

  const bulletScale: Scale[] = [
    {
      "name": "xscale",
      "type": "linear",
      "domain": [
              0,
              {
                "signal": "data('max_values')[0].maxOverall"
              }
            ],
      "range": [0, {"signal": "width"}]
    }
  ]

  return bulletScale;
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/gi, (match) => match.toUpperCase().replace('-', '').replace('_', ''));
}

export function getAdjustedColor(color: string, colorScheme: ColorScheme): string {
  const adjustedColor = getColorValue(color, colorScheme);
  console.log(adjustedColor)
  if(adjustedColor !== color){
    return adjustedColor;
  }else{
    return color
  }
}
