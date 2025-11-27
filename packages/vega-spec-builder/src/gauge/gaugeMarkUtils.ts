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

import { GaugeSpecOptions, PerformanceRanges } from '../types';
import { spectrumColors, getColorValue } from '@spectrum-charts/themes';
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

  // Performance ranges
  if (opt.showPerformanceRanges) {
    marks.push(...getPerformanceRangeMarks(name, opt.performanceRanges));
    const endCapColor = opt.performanceRanges[0];
    const startCapColor = opt.performanceRanges[2];
    marks.push(getBandGap1(name));
    marks.push(getBandGap2(name));
  } else {
    // Background arc
    marks.push(getBackgroundArc(name, backgroundFill, backgroundStroke));
    // Filler arc (fills to clampedValue)
    marks.push(getFillerArc(name, fillerColorSignal));
    const endCapColor = fillerColorSignal;
    const startCapColor = fillerColorSignal;
  }

  // Needle to clampedValue
  if (needle || opt.showPerformanceRanges) {
      marks.push(getNeedle(name));
      marks.push(getNeedleHole(name, BACKGROUND_COLOR));
  }
  if (targetLine){
    marks.push(getTargetLine(name));
  }
});

export function getBackgroundArc(name: string, fill: string, stroke: string): Mark {
  return {
    name: `${name}BackgroundArc`,
    description: 'Background Arc',
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
        fill:        { signal: 'fillerColorToCurrVal' }
      },
      update: {
        endAngle:     { signal: "scale('angleScale', clampedVal)" }
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
        fill: { signal: "needleColor" },
        stroke: { signal: "needleColor" },
      }
    }
  };
}

export function getPerformanceRangeMarks(
  name: string,
  performanceRanges: PerformanceRanges[]
): Mark[] {
  const [band1, band2, band3] = performanceRanges;
  return [
    {
      name: `${name}Band1Arc`,
      type: 'arc',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          innerRadius: { signal: 'innerRadius' },
          outerRadius: { signal: 'outerRadius' },
          startAngle: { signal: 'band1StartAngle' },
          endAngle: { signal: 'band1EndAngle' },
          fill: { value: band1.fill },        
        },
      },
    },
    {
      name: `${name}Band2Arc`,
      type: 'arc',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          innerRadius: { signal: 'innerRadius' },
          outerRadius: { signal: 'outerRadius' },
          startAngle: { signal: 'band2StartAngle' },
          endAngle: { signal: 'band2EndAngle' },
          fill: { value: band2.fill },
        },
      },
    },
    {
      name: `${name}Band3Arc`,
      type: 'arc',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          innerRadius: { signal: 'innerRadius' },
          outerRadius: { signal: 'outerRadius' },
          startAngle: { signal: 'band3StartAngle' },
          endAngle: { signal: 'band3EndAngle' },
          fill: { value: band3.fill },
        },
      },
    },
  ];
}

export function getBandGap1(name: string): Mark {

  return {
    name: `${name}Band1Gap`,
    description: 'Band 1 Gap',
    type: 'rule',
    encode: {
      enter: {
        stroke: { signal: BACKGROUND_COLOR },
        strokeWidth: { value: 6 },
        strokeCap: { value: "round" }
      },
      update: {
        stroke: { signal: BACKGROUND_COLOR },
        x:  { signal: "band1GapX" },
        y:  { signal: "band1GapY" },
        x2: { signal: "band1GapX2" },
        y2: { signal: "band1GapY2" }
      }
    }
  }
};

export function getBandGap2(name: string): Mark {

  return {
    name: `${name}Band2Gap`,
    description: 'Band 2 Gap',
    type: 'rule',
    encode: {
      enter: {
        stroke: { signal: BACKGROUND_COLOR },
        strokeWidth: { value: 6 },
        strokeCap: { value: "round" }
      },
      update: {
        stroke: { signal: BACKGROUND_COLOR },
        x:  { signal: "band2GapX" },
        y:  { signal: "band2GapY" },
        x2: { signal: "band2GapX2" },
        y2: { signal: "band2GapY2" }
      }
    }
  }
};

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
        shape: { value: "circle" },
        size: { value: 750 },
        fill: { signal: backgroundColor },
        stroke: { signal: backgroundColor },
      }
  }
  };
}

export function getTargetLine(name: string): Mark {
  const targetColor = getColorValue('gray-900', defaultGaugeOptions.colorScheme);
  return {
    name: `${name}Target Line`,
    description: 'Target Line',
    type: 'rule',
    encode: {
      enter: {
        stroke: { signal: 'targetLineStroke'  },
        strokeWidth: { value: 6 },
        strokeCap: { value: "round" }
      },
      update: {
        stroke: { signal: 'targetLineStroke'  },
        x:  { signal: "targetLineX" },
        y:  { signal: "targetLineY" },
        x2: { signal: "targetLineX2" },
        y2: { signal: "targetLineY2" }
      }
    }
  }
};
