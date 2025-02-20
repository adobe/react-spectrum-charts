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
import { DEFAULT_COLOR_SCHEME, DEFAULT_BULLET_DIRECTION } from '@constants';
import { Spec, Data, Mark, Scale, GroupMark } from 'vega';
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
        direction = DEFAULT_BULLET_DIRECTION,
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
        direction,
        ...props,
    };
    return {
        ...spec,
        data: getBulletData(bulletProps),
        marks: getBulletMarks(bulletProps),
        scales: getBulletScales(bulletProps),
    };
};

export function getBulletMarks(props: BulletSpecProps): Mark[] | GroupMark[] {

  const solidColor = getColorValue('gray-900', props.colorScheme);
  const barLabelColor = getColorValue('gray-600', props.colorScheme);
  
  const bulletMarksColumn: Mark[] = [
    {
      "type": "rect",
      "name": `${props.name}_bullet`,
      "from": {"data": "table"},
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {
            "field": "index",
            "mult": 60,
            "offset": -44
          },
          "width": {
            "scale": "xscale",
            "field": `${props.metric}`
          },
          "height": {"value": 6},
          "fill": {"value": `${props.color}`},
          "cornerRadiusTopRight": {"value": 2},
          "cornerRadiusBottomRight": {"value": 2}
        }
      }
    },
    {
      "type": "text",
      "name": `${props.name}_label`,
      "from": {"data": "table"},
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {
            "field": "index",
            "mult": 60,
            "offset": -60
          },
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
      "name": `${props.name}_valueLabel`,
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {"signal": "width"},
          "y": {
            "field": "index",
            "mult": 60,
            "offset": -60
          },
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
      "name": `${props.name}_rule`,
      "description": `${props.name}`,
      "encode": {
        "enter": {
          "x": {
            "scale": "xscale",
            "field": `${props.target}`
          },
          "y": {
            "field": "index",
            "mult": 60,
            "offset": -53
          },
          "y2": {
            "field": "index",
            "mult": 60,
            "offset": -29
          },
          "stroke": {"value": `${solidColor}`},
          "strokeWidth": {"value": 2}
        }
      }
    }
  ]

  const bulletMarksRow : GroupMark[] = [
    {
      "name": `${props.name}_group`,
      "description": `${props.name}`,
      "type": "group",
      "from": {
        "facet": {
          "data": "table",
          "name": "bulletGroups",
          "groupby": `${props.dimension}`
        }
      },
      "signals": [{ "name": "width", "update": "bandwidth('xGroupScale')" }],
      "encode": {
        "update": {
          "x": { "scale": "xGroupScale", "field": `${props.dimension}` },
          "height": {"value": 20},
          "width": { "signal": "bandwidth('xGroupScale')" }
        }
      },
      "scales": [
        {
          "name": "xscale",
          "type": "linear",
          "domain": [0, { "signal": "data('max_values')[0].maxOverall" }],
          "range": [0, { "signal": "width" }],
          "round": true,
          "zero": true
        }
      ],
      "marks": [
        {
          "name": `${props.name}_bullet`,
          "type": "rect",
          "from": { "data": "bulletGroups" },
          "encode": {
            "enter": {
              "x": { "scale": "xscale", "value": 0 },
              "x2": { "scale": "xscale", "field": `${props.metric}` },
              "y": { "value": 21 },
              "height": {"value": 6},
              "fill": { "value": `${props.color}` },
              "cornerRadiusTopRight": { "value": 2 },
              "cornerRadiusBottomRight": { "value": 2 }
            }
          }
        },
        {
          "type": "text",
          "name": `${props.name}_label`,
          "from": { "data": "bulletGroups" },
          "description": "graphLabel",
          "encode": {
            "enter": {
              "x": { "value": 0 },
              "y": {"value": 5},
              "text": {"field": `${props.dimension}`},
              "align": {"value": "left"},
              "baseline": {"value": "bottom"},
              "fill": {"value": `${barLabelColor}`},
              "fontSize": {"value": 11.5}
            }
          }
        },
        {
          "type": "text",
          "from": { "data": "bulletGroups" },
          "name": `${props.name}_valueLabel`,
          "encode": {
            "enter": {
              "x": { "signal": "width", "offset": 0 },
              "y": { "value": 5 }, 
              "text": { "field": `${props.metric}` },
              "align": { "value": "right" }, 
              "baseline": { "value": "bottom" },
              "fontSize": { "value": 11.5 },
              "fill": { "value": `${solidColor}` }
            }
          }
        },
        {
          "type": "rule",
          "from": { "data": "bulletGroups" },
          "name": `${props.name}_target`,
          "encode": {
            "enter": {
              "x": { "scale": "xscale", "field": `${props.target}` },
              "y": { "value": 12 }, 
              "y2": { "value": 36 }, 
              "stroke": { "value": `${solidColor}` },
              "strokeWidth": { "value": 2 }
            }
          }
        }
      ]
    }
  ]

  return props.direction === 'column' ?  bulletMarksColumn : bulletMarksRow
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

  return bulletData;
}

export function getBulletScales(props: BulletSpecProps): Scale[] {

  const bulletScaleColumn: Scale[] = [
    {
      "name": "xscale",
      "type": "linear",
      "domain": [0, {"signal": "data('max_values')[0].maxOverall"}],
      "range": [0, {"signal": "width"}]
    }
  ]

  const bulletScaleRow: Scale[] = [
    {
      "name": "xGroupScale",
      "type": "band",
      "domain": { "data": "table", "field": `${props.dimension}` },
      "range": [0, { "signal": "width" }],
      "paddingInner": 0.1
    }
  ]

  return props.direction === 'column' ? bulletScaleColumn : bulletScaleRow
}
