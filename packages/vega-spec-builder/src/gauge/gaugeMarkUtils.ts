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

import { GaugeSpecOptions } from '../types';

export const addGaugeMarks = produce<Mark[], [GaugeSpecOptions]>((marks, opt) => {
  const {
    name,
    backgroundFill = '#eee',
    backgroundStroke = '#999',
    fillerColorSignal = 'fillerColorToCurrVal',
  } = opt;

  // Background arc
  marks.push(getBackgroundArc(name, backgroundFill, backgroundStroke));

  // Filler arc (fills to clampedValue)
  marks.push(getFillerArc(name, fillerColorSignal));

  // Needle to clampedValue
  marks.push(getNeedle(name));
});

function getBackgroundArc(name: string, fill: string, stroke: string): Mark {
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
        stroke:      { value: stroke }
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
        endAngle:     { signal: "scale('angleScale', clampedVal)" }
      }
    }
  };
}

  function getNeedle(name: string): Mark {
  return {
    name: `${name}Needle`,
    description: 'Needle (rule)',
    type: 'rule',
    encode: {
      enter: {
        stroke:      { value: '#333' },
        strokeWidth: { value: 3 },
        strokeCap:   { value: 'round' }
      },
      update: {
        x:  { signal: 'centerX' },
        y:  { signal: 'centerY' },
        x2: { signal: 'needleTipX' },
        y2: { signal: 'needleTipY' }
      }
    }
  };
}
