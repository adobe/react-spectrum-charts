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
            name,
            markType = 'bullet', // Correct assignment of markType
            ...props
        }
    ) => {
        const bulletProps: BulletSpecProps = {
            colorScheme,
            index,
            markType: "bullet", // Correct assignment of markType
            name: toCamelCase(name ?? `bullet${index}`), // Ensure name is correctly assigned
            ...props,
        };
        spec.data = getBulletData();
        spec.marks = getBulletMarks();
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
          "y": {"field": "index", "mult": 60, "offset": -50},
          "width": {"signal": "width"},
          "height": {"value": 18},
          "fill": {"value": "lightgrey"}
        }
      }
    },
    {
      "type": "rect",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"value": 0},
          "y": {"field": "index", "mult": 60, "offset": -44},
          "width": {"field": "amount"},
          "height": {"value": 6},
          "fill": {"value": "steelblue"}
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
          "text": {"field": "category"},
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
          "text": {"field": "myvalue"},
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
          "x": {"field": "tickposition"},
          "y": {"field": "index", "mult": 60, "offset": -53},
          "y2": {"field": "index", "mult": 60, "offset": -29},
          "stroke": {"value": "black"},
          "strokeWidth": {"value": 2}
        }
      }
    }
  ]
}

function getBulletData(): Data[] {
    // Implementation of addBulletMarks
    return [
      {
        "name": "table",
        "values": [
          {"category": "New Customer Count", "amount": 180, "myvalue": "20", "tickposition": 150},
          {"category": "Downloads of Adobe Acrobat", "amount": 180, "myvalue": "1.42 M", "tickposition": 170},
          {"category": "Third Customer", "amount": 140, "myvalue": "15", "tickposition": 50},
          {"category": "Fourth Customer", "amount": 90, "myvalue": "15", "tickposition": 100}
        ],
        "transform": [
          {"type": "window", "ops": ["row_number"], "as": ["index"]}
        ]
      }
    ];
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/gi, (match) => match.toUpperCase().replace('-', '').replace('_', ''));
}
