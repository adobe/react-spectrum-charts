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
import { produce } from 'immer';
import { Mark } from 'vega';

import { DEFAULT_COLOR_SCHEME, BACKGROUND_COLOR } from '@spectrum-charts/constants';

import { GaugeSpecOptions } from '../types';
import { spectrumColors } from '@spectrum-charts/themes';
import { defaultGaugeOptions } from './gaugeTestUtils';

export const addGaugeMarks = produce<Mark[], [GaugeSpecOptions]>((marks, opt) => {
  const {
    name,
    colorScheme = DEFAULT_COLOR_SCHEME,
    needle,
    targetLine
  } = opt;
  const backgroundFill = spectrumColors[colorScheme]['gray-200'];
  const backgroundStroke = spectrumColors[colorScheme]['gray-300'];
  const fillerColorSignal = 'fillerColorToCurrVal';

  // Background arc
  marks.push(getBackgroundArc(name, backgroundFill, backgroundStroke));

  // Filler arc (fills to clampedValue)
  marks.push(getFillerArc(name, fillerColorSignal));
  marks.push(getStartCap(name, fillerColorSignal, backgroundFill));
  marks.push(getEndCap(name, fillerColorSignal, backgroundFill));

  // Needle to clampedValue
  if (needle) {
      marks.push(getNeedle(name));
      marks.push(getNeedleHole(name, BACKGROUND_COLOR));
  }
  if (targetLine){
    marks.push(getTargetLine(name));
  }
});

export function getBackgroundArc(name: string, fill: string, stroke: string): Mark {
  return {
    name: `${name}BackgroundArcRounded`,
    description: 'Background Arc (Round Edge)',
    type: 'arc',
    encode: {
      enter: {
        x:           { signal: 'centerX' },
        y:           { signal: 'centerY' },
        innerRadius: { signal: 'innerRadius' },
        outerRadius: { signal: 'outerRadius' },
        startAngle:  { signal: 'startAngle' },
        endAngle:    { signal: 'endAngle' },
        fill:        { value: fill },
      }
    }
  };
}

export function getFillerArc(name: string, fillerColorSignal: string): Mark {
  return {
    name: `${name}FillerArc`,
    description: 'Filler Arc',
    type: 'arc',
    encode: {
      enter: {
        x:           { signal: 'centerX' },
        y:           { signal: 'centerY' },
        innerRadius: { signal: 'innerRadius' },
        outerRadius: { signal: 'outerRadius' },
        startAngle:  { signal: 'startAngle' },
        endAngle:    { signal: 'endAngle' },
        fill:        { signal: fillerColorSignal },
        stroke:      { signal: fillerColorSignal }
      },
      update: {
        endAngle:     { signal: "scale('angleScale', clampedVal)" },
        stroke:       { signal: `currVal > arcMinVal ? ${fillerColorSignal} : ""`}
      }
    }
  };
}

export function getNeedle(name: string): Mark {
  return {
    name: `${name}Needle`,
    description: 'Needle',
    type: 'symbol',
    encode: {
    enter: {
      x: { signal: "centerX" },
      y: { signal: "centerY" }
    },
    update: {
      shape: {
        signal:
            "'M -4 0 A 4 4 0 1 0 4 0 L 2 -' + needleLength + 'A 2 2 0 1 0 -2 -' + needleLength + ' ' +  'L -4 0 Z'"
        },
      angle: { signal: "needleAngleDeg" },
      fill: { signal: "fillerColorToCurrVal" },
      stroke: { signal: "fillerColorToCurrVal" },
    }
    }
  };
}

export function getNeedleHole(name: string, backgroundColor): Mark {
  return {
    name: `${name}Needle Hole`,
    description: 'Needle Hole',
    type: 'symbol',
    encode: {
    enter: {
      x: { signal: "centerX" },
      y: { signal: "centerY" }
    },
    update: {
      shape: {
        value:
            "circle"  
        },
      size: {value: 750},
      fill: { signal: backgroundColor },
      stroke: { signal: backgroundColor },
    }
  }
  };
}

export function getTargetLine(name: string): Mark {
  return {
    name: `${name}Target Line`,
    description: 'Target Line',
    type: 'rule',
    encode: {
    enter: {
      stroke: { value: "black" },
      strokeWidth: { value: 6 },
      strokeCap: { value: "round" }
    },
    update: {
      x:  { signal: "targetLineX" },
      y:  { signal: "targetLineY" },
      x2: { signal: "targetLineX2" },
      y2: { signal: "targetLineY2" }
    }
  }
  }
};

export function getStartCap(name: string, fillColor: string, backgroundColor: string): Mark {
  const xOffset = 'centerX+(sin(startAngle)*((outerRadius+innerRadius)/2))'
  const yOffset = 'centerY-(cos(startAngle)*((outerRadius+innerRadius)/2))'
  return {
    name: `${name}Start Cap`,
    description: `Start Cap`,
    type: `arc`,
    encode: {
      enter: {
        "x":  { signal: xOffset },
        "y":  { signal: yOffset },
        "innerRadius":  { signal: '0' },
        "outerRadius": { signal: "(outerRadius - innerRadius) / 2" },
        "startAngle": { signal: "startAngle" },
        "endAngle": { signal: "startAngle-PI"},
        "stroke": { signal: fillColor },
      },
      update: {
        "fill": {signal: `currVal <= arcMinVal ? ${backgroundColor} : ${fillColor}`},
        "stroke": { signal: `currVal <= arcMinVal ? ${backgroundColor} : ${fillColor}`}
      }
    }
  }
}

export function getEndCap(name: string, fillColor: string, backgroundColor: string): Mark {
  const xOffset = 'centerX+(sin(startAngle)*((outerRadius+innerRadius)/2*-1))'
  const yOffset = 'centerY-(cos(startAngle)*((outerRadius+innerRadius)/2))'
  return {
    name: `${name}End Cap`,
    description: `End Cap`,
    type: `arc`,
    encode: {
      enter: {
        "x":  { signal: xOffset },
        "y":  { signal: yOffset },
        "innerRadius":  { signal: '0' },
        "outerRadius": { signal: "(outerRadius - innerRadius) / 2" },
        "startAngle": { signal: "endAngle" },
        "endAngle": { signal: "endAngle+PI"},
      },
      update: {
        "fill": {signal: `currVal >= arcMaxVal ? ${fillColor} : ${backgroundColor}`}
      }
    }
  }
}
