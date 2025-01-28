// /*
//  * Copyright 2025 Adobe. All rights reserved.
// * This file is licensed to you under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License. You may obtain a copy
// * of the License at http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software distributed under
// * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
// * OF ANY KIND, either express or implied. See the License for the specific language
// * governing permissions and limitations under the License.
// */

import { DEFAULT_COLOR_SCHEME } from '@constants';
import { produce } from 'immer';
import { Spec, Data, Mark, Scale, Signal } from 'vega';
import { ColorScheme, BulletProps, BulletSpecProps } from '../../types';

export const addBullet = produce<
    Spec,
    [BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }]
>(
    (
        spec,
        {
            colorScheme = DEFAULT_COLOR_SCHEME,
            index = 0,
            graphLabel,
            currentAmount,
            target,
            markType = 'bullet',
            ...props
        }
    ) => {
        const bulletProps: BulletSpecProps = {
            colorScheme,
            index,
            graphLabel,
            target,
            markType: "bullet",
            name: toCamelCase(name ?? `bullet${index}`),
            ...props,
        };
        spec.data = getBulletData();
        spec.marks = getBulletMarks();
        spec.scales = getBulletScales();
        console.log(spec)
    }
);

function getBulletMarks(): Mark[] {
  // Implementation of addBulletMarks
  return [
    {
      "type": "rect",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {"field": "index", "mult": 60, "offset": -44},
          "width": {"scale": "xscale", "field": "currentAmount"},
          "height": {"value": 6},
          "fill": {"value": "steelblue"},
          "cornerRadiusTopRight": {"value": 2},
          "cornerRadiusBottomRight": {"value": 2}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {"field": "index", "mult": 60, "offset": -60},
          "text": {"field": "graphLabel"},
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
      "encode": {
        "enter": {
          "x": {"signal": "width"},
          "y": {"field": "index", "mult": 60, "offset": -60},
          "text": {"field": "currentAmount"},
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
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "target"},
          "y": {"field": "index", "mult": 60, "offset": -53},
          "y2": {"field": "index", "mult": 60, "offset": -29},
          "stroke": {"value": "black"},
          "strokeWidth": {"value": 2},
        }
      }
    }
  ]
}

function getBulletData(): Data[] {
    // Implementation of addBulletMarks

    let bulletData: Data[] = [
      {
        "name": "table",
        "values": [
          {"graphLabel": "New Customer Count", "currentAmount": 400, "target": 450},
          {"graphLabel": "Downloads of Adobe Acrobat", "currentAmount": 180, "target": 170},
          {"graphLabel": "Third Customer", "currentAmount": 140, "target": 50},
          {"graphLabel": "Fourth Customer", "currentAmount": 90, "target": 100},
          {"graphLabel": "Hey yall", "currentAmount": 100, "target": 400}
        ],
        "transform": [
          {"type": "window", "ops": ["row_number"], "as": ["index"]}
        ]
      }
    ]

    return bulletData;
}

function getBulletScales(): Scale[] {
  // Implementation of addBulletMarks

  let bulletScale: Scale[] = [
    {
      "name": "xscale",
      "type": "linear",
      "domain": {
        "fields": [
          {"data": "table", "field": "currentAmount"},
          {"data": "table", "field": "target"}
        ]
      },
      "range": [0, {"signal": "width"}]
    }
  ]

  return bulletScale;
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/gi, (match) => match.toUpperCase().replace('-', '').replace('_', ''));
}
