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

// import { getColorValue } from '@spectrum-charts/themes';

import { GaugeSpecOptions } from '../types';

export const addMarks = produce<Mark[], [GaugeSpecOptions]>((marks, GaugeOptions) => {

  export const addGaugeMarks = produce<Mark[], [GaugeSpecOptions]>((marks, opt) => {
  const {
    name,
    backgroundFill,
    backgroundStroke,
    fillerColorSignal,
    straightEdgeOffsetExpr,
    labelColor,
    labelSize,
  } = opt;

  // Background arcs (rounded, then straight overlay)
  marks.push(getBackgroundArcRounded(name, backgroundFill, backgroundStroke));
  marks.push(getBackgroundArcStraight(name, backgroundFill, backgroundStroke, straightEdgeOffsetExpr));

  // Text labels: max, target, min
  marks.push(getMaxValueText(name, labelColor, labelSize));
  marks.push(getTargetValueText(name, labelColor, labelSize));
  marks.push(getMinValueText(name, labelColor, labelSize));

  // Filler arc (value fill)
  marks.push(getFillerArc(name, fillerColorSignal));
}
});

function getBackgroundArcRounded(name: string, fill: string, stroke: string): Mark {
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
        cornerRadius:{ signal: 'cornerR' },
        fill:        { value: fill },
        stroke:      { value: stroke }
      }
    }
  };
}

function getBackgroundArcStraight(
  name: string,
  fill: string,
  stroke: string,
  offsetExpr: string
): Mark {
  return {
    name: `${name}BackgroundArcStraight`,
    description: 'Background Arc (Straight Edge)',
    type: 'arc',
    encode: {
      enter: {
        x:           { signal: 'centerX' },
        y:           { signal: 'centerY' },
        innerRadius: { signal: 'innerRadius' },
        outerRadius: { signal: 'outerRadius' },
        // startAngle offset to flatten the left edge
        startAngle:  { signal: `startAngle + (${offsetExpr})` },
        endAngle:    { signal: 'endAngle' },
        fill:        { value: fill },
        stroke:      { value: stroke }
      }
    }
  };
}

function getMaxValueText(name: string, color: string, fontSize: number): Mark {
  return {
    name: `${name}MaxValText`,
    description: 'Max Val Text',
    type: 'text',
    encode: {
      enter: {
        x:         { signal: 'MaxTextX' },
        y:         { signal: 'MaxTextY' },
        text:      { signal: "format(arcMaxVal, '.0f')" },
        align:     { value: 'center' },
        baseline:  { value: 'middle' },
        fontSize:  { value: fontSize },
        fill:      { value: color },
        fontWeight:{ value: 'bold' }
      },
      // Keeping parity with your example; this update prop is harmless for text
      update: {
        endAngle:  { signal: "scale('angleScale', arcMaxVal)" }
      }
    }
  };
}

function getTargetValueText(name: string, color: string, fontSize: number): Mark {
  return {
    name: `${name}TargetValText`,
    description: 'Target Val Text',
    type: 'text',
    encode: {
      enter: {
        x:         { signal: 'targetTextX' },
        y:         { signal: 'targetTextY' },
        text:      { signal: "format(target, '.0f')" },
        align:     { value: 'center' },
        baseline:  { value: 'middle' },
        fontSize:  { value: fontSize },
        fontWeight:{ value: 'bold' },
        fill:      { value: color }
      }
    }
  };
}

function getMinValueText(name: string, color: string, fontSize: number): Mark {
  return {
    name: `${name}MinValText`,
    description: 'Min Val Text',
    type: 'text',
    encode: {
      enter: {
        x:         { signal: 'MinTextX' },
        y:         { signal: 'MinTextY' },
        text:      { signal: "format(arcMinVal, '.0f')" },
        align:     { value: 'center' },
        baseline:  { value: 'middle' },
        fontSize:  { value: fontSize },
        fontWeight:{ value: 'bold' },
        fill:      { value: color }
      }
    }
  };
}

function getFillerArc(name: string, fillerColorSignal: string): Mark {
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
        fill:        { signal: fillerColorSignal }
      },
      update: {
        endAngle:     { signal: "scale('angleScale', clampedVal)" },
        // Square end normally; rounded when “full”
        cornerRadius: { signal: "!isFull ? cornerR : 0" }
      }
    }
  };
}
