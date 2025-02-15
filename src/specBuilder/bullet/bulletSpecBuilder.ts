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

import { toCamelCase } from '@utils';
import { DEFAULT_COLOR_SCHEME } from '@constants';
import { Spec, Data, Mark, Scale } from 'vega';
import { ColorScheme, BulletProps, BulletSpecProps } from '../../types';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';
import { spectrumColors } from '@themes';

const DEFAULT_COLOR = spectrumColors.light['static-blue']

export const addBullet = (
    spec: Spec,
    {
        children,
        colorScheme = DEFAULT_COLOR_SCHEME,
        index = 0,
        name,
        metric,
        dimension,
        target,
        color = DEFAULT_COLOR,
        direction,
        ...props
    }: BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }
): Spec => {

    const bulletProps: BulletSpecProps = {
        children: sanitizeMarkChildren(children),
        colorScheme: colorScheme,
        index,
        color: getColorValue(color, colorScheme),
        metric: metric ?? 'currentAmount',
        dimension: dimension ?? 'graphLabel',
        target: target ?? 'target',
        name: toCamelCase(name ?? `bullet${index}`),
        //direction must be horizontal or vertical
        direction: direction === 'vertical' || direction === 'horizontal' ? direction : 'vertical',
        ...props,
    };
    return {
        ...spec,
        data: getBulletData(bulletProps),
        marks: getBulletMarks(bulletProps),
        scales: getBulletScales(bulletProps),
    };
};

export function getBulletMarks(props: BulletSpecProps): Mark[] {

  const solidColor = getColorValue('gray-900', props.colorScheme);
  const barLabelColor = getColorValue('gray-600', props.colorScheme);

  // The positional encoding variables are the biggest difference
  // between the horizontal and vertical layouts
  const verticalPositionEncoding = {
    rectX: {"value": 0},
    rectY: {"field": "index", "mult": 60, "offset": -44},
    leftTextX: {"value": 0},
    leftTextY: {"field": "index", "mult": 60, "offset": -60},
    rightTextX: {"signal": "width"},
    rightTextY: {"field": "index", "mult": 60, "offset": -60},
    ruleX: {"scale": "xscale", "field": `${props.target}`},
    ruleY: {"field": "index", "mult": 60, "offset": -53},
    ruleY2: {"field": "index", "mult": 60, "offset": -29}
  }

  const horizontalPositionEncoding = {
    rectX: {"field": "index", "mult": 200, "offset": -200},
    rectY: {"value": 21},
    leftTextX: {"field": "index", "mult": 200, "offset": -200},
    leftTextY: {"value": 5},
    rightTextX: {"field": "index", "mult": 200, "offset": -30},
    rightTextY: {"value": 5},
    ruleX: {
      "scale": "xscale",
      "field": "target",
      "offset": {
          "field": "index",
          "mult": 200,
          "offset": -200
      }
    },
    ruleY: {"value": 12},
    ruleY2: {"value": 36}
  }

  const finalPositionEncoding = props.direction === 'vertical' ? verticalPositionEncoding : horizontalPositionEncoding
  
  const bulletMarks: Mark[] = [
    {
      "type": "rect",
      "name": `${props.name}rect`,
      "from": {"data": "table"},
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": finalPositionEncoding.rectX,
          "y": finalPositionEncoding.rectY,
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
          "x": finalPositionEncoding.leftTextX,
          "y": finalPositionEncoding.leftTextY,
          "text": {"field": `${props.dimension}`},
          "align": {"value": "left"},
          "baseline": {"value": "bottom"},
          "fontSize": {"value": 11.5},
          "fill": {"value": `${barLabelColor}`}
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
          "x": finalPositionEncoding.rightTextX,
          "y": finalPositionEncoding.rightTextY,
          "text": {"field": `${props.metric}`},
          "align": {"value": "right"},
          "baseline": {"value": "bottom"},
          "fontSize": {"value": 11.5},
          "fill": {"value": `${solidColor}`}
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
          "x": finalPositionEncoding.ruleX,
          "y": finalPositionEncoding.ruleY,
          "y2": finalPositionEncoding.ruleY2,
          "stroke": {"value": `${solidColor}`},
          "strokeWidth": {"value": 2},
        }
      }
    }
  ];

  return bulletMarks
}

export function getBulletData(props: BulletSpecProps): Data[] {

  //We are multiplying the target by 1.1 to make sure that the target line is never at the very end of the graph
  const maxValue = `max(datum.${props.metric}, datum.${props.target} * 1.1)`
  const filter = `isValid(datum.${props.dimension}) && datum.${props.dimension} !== null && datum.${props.dimension} !== ''`

  const bulletData: Data[] = [
    {
      "name": "table",
      "values": [],
      "transform": [
        {
          "type": "filter",
          "expr": filter
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

  //Only needed in horizontal mode
  if(props.direction === 'horizontal'){
    bulletData[0].transform?.push({
      "type": "extent",
      "field": "currentAmount",
      "signal": "maxValue"
    })
  }

  return bulletData;
}

export function getBulletScales(props: BulletSpecProps): Scale[] {

  //Range must be fixed if horizontal mode is specified
  const bulletScaleRange = props.direction === 'vertical' ? [0, {"signal": "width"}] : [0, 170];

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
      "range": bulletScaleRange
    }
  ]

  return bulletScale
}
