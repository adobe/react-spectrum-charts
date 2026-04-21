/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ArcMark, ColorValueRef, Mark, PathMark, RuleMark, SymbolMark, TextMark } from 'vega';

import { getS2ColorValue } from '@spectrum-charts/themes';

import { ColorScheme } from '../types';

const wrapLabel = (text: string | undefined, maxChars: number): string => {
  if (!text) return '';
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

const getGaugeFillColorValue = (color: string, colorScheme: ColorScheme): ColorValueRef => {
  const match = color.match(/^categorical-(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10) - 1;
    return { signal: `colors[${idx}][0]` };
  }
  return { value: getS2ColorValue(color, colorScheme) };
};

import { GaugeSpecOptions, GaugeThreshold } from '../types';

export const getGaugeMarks = (options: GaugeSpecOptions): Mark[] => {
  const { showNeedle, target, showRangeLabels, thresholds } = options;
  const marks: Mark[] = [getTrackArcMark(options)];

  if (thresholds && thresholds.length > 0) {
    marks.push(...getThresholdArcMarks(options));
  } else if (!showNeedle) {
    marks.push(getValueFillMark(options), getValueFillStartCapMark(options));
  }

  if (showNeedle) {
    marks.push(getNeedleMark(options), getNeedleTipMark(options), getPivotMark(options));
  }

  if (target) {
    marks.push(getTargetTickMark(options));
  }

  marks.push(getValueLabelMark(options), getMetricLabelMark(options));

  if (showRangeLabels) {
    marks.push(...getRangeLabelMarks(options));
  }

  return marks;
};

const getTrackArcMark = ({ name, colorScheme }: GaugeSpecOptions): ArcMark => ({
  type: 'arc',
  encode: {
    enter: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy` },
      startAngle: { signal: `${name}_startAngle` },
      endAngle: { signal: `${name}_endAngle` },
      outerRadius: { signal: `${name}_radius` },
      innerRadius: { signal: `${name}_innerRadius` },
      fill: { value: getS2ColorValue('gray-200', colorScheme) },
      cornerRadius: { signal: `(${name}_radius - ${name}_innerRadius) / 2` },
    },
  },
});

const getValueFillMark = ({ name, color, colorScheme }: GaugeSpecOptions): ArcMark => {
  const sa = `${name}_startAngle`;
  const ea = `${name}_endAngle`;
  const capOffset = `${name}_capAngleOffset`;
  const totalAngle = `(${ea} - ${sa})`;
  const fillEndAngle = `(${sa} + ${capOffset} + (datum.${name}_valueAngle - ${sa}) * (${totalAngle} - 2 * ${capOffset}) / ${totalAngle})`;
  return {
    type: 'arc',
    from: { data: name },
    encode: {
      enter: {
        x: { signal: `${name}_cx` },
        y: { signal: `${name}_cy` },
        startAngle: { signal: `(${sa} + ${capOffset})` },
        endAngle: { signal: fillEndAngle },
        outerRadius: { signal: `${name}_radius` },
        innerRadius: { signal: `${name}_innerRadius` },
        fill: getGaugeFillColorValue(color, colorScheme),
        cornerRadius: { value: 0 },
      },
    },
  };
};

const getThresholdArcMarks = (options: GaugeSpecOptions): Mark[] => {
  const { name, thresholds, minScaleValue, maxScaleValue, colorScheme } = options;
  if (!thresholds) return [];
  const range = maxScaleValue - minScaleValue;
  const sa = `${name}_startAngle`;
  const ea = `${name}_endAngle`;
  const capOffset = `${name}_capAngleOffset`;
  const usableAngle = `(${ea} - ${sa} - 2 * ${capOffset})`;
  const angleForFraction = (f: number) => `(${sa} + ${capOffset} + ${f} * ${usableAngle})`;
  const result: Mark[] = [];

  thresholds.forEach((threshold: GaugeThreshold, i: number) => {
    const prevValue = i === 0 ? minScaleValue : thresholds[i - 1].value;
    const startFraction = (prevValue - minScaleValue) / range;
    const endFraction = (threshold.value - minScaleValue) / range;
    const arcStart = i === 0 ? `(${sa} + ${capOffset})` : angleForFraction(startFraction);
    const arcEnd = i === thresholds.length - 1 ? `(${ea} - ${capOffset})` : angleForFraction(endFraction);
    result.push({
      type: 'arc',
      encode: {
        enter: {
          x: { signal: `${name}_cx` },
          y: { signal: `${name}_cy` },
          startAngle: { signal: arcStart },
          endAngle: { signal: arcEnd },
          outerRadius: { signal: `${name}_radius` },
          innerRadius: { signal: `${name}_innerRadius` },
          fill: { value: getS2ColorValue(threshold.color, colorScheme) },
          cornerRadius: { value: 0 },
        },
      },
    });
  });

  result.push(
    getThresholdStartCapMark(options),
    getThresholdEndCapMark(options)
  );

  return result;
};

const buildCapPath = (name: string, capAngle: string, sweep: 0 | 1): string => {
  const cx = `${name}_cx`;
  const cy = `${name}_cy`;
  const outerR = `${name}_radius`;
  const innerR = `${name}_innerRadius`;
  const r = `((${outerR} - ${innerR}) / 2)`;
  const p1x = `(${cx} + ${outerR} * sin(${capAngle}))`;
  const p1y = `(${cy} - ${outerR} * cos(${capAngle}))`;
  const p2x = `(${cx} + ${innerR} * sin(${capAngle}))`;
  const p2y = `(${cy} - ${innerR} * cos(${capAngle}))`;
  return [
    `'M ' + ${p1x} + ',' + ${p1y}`,
    `+ ' A ' + ${r} + ',' + ${r} + ' 0 0 ${sweep} ' + ${p2x} + ',' + ${p2y}`,
    `+ ' Z'`,
  ].join(' ');
};

const getThresholdStartCapMark = ({ name, thresholds, colorScheme }: GaugeSpecOptions): PathMark => ({
  type: 'path',
  encode: {
    enter: {
      path: { signal: buildCapPath(name, `(${name}_startAngle + ${name}_capAngleOffset)`, 0) },
      fill: { value: getS2ColorValue(thresholds![0].color, colorScheme) },
    },
  },
});

const getThresholdEndCapMark = ({ name, thresholds, colorScheme }: GaugeSpecOptions): PathMark => ({
  type: 'path',
  encode: {
    enter: {
      path: { signal: buildCapPath(name, `(${name}_endAngle - ${name}_capAngleOffset)`, 1) },
      fill: { value: getS2ColorValue(thresholds![thresholds!.length - 1].color, colorScheme) },
    },
  },
});


const getValueFillStartCapMark = ({ name, color, colorScheme }: GaugeSpecOptions): PathMark => ({
  type: 'path',
  from: { data: name },
  encode: {
    enter: {
      path: { signal: buildCapPath(name, `(${name}_startAngle + ${name}_capAngleOffset)`, 0) },
      fill: getGaugeFillColorValue(color, colorScheme),
    },
  },
});

const getNeedleMark = ({ name, colorScheme }: GaugeSpecOptions): PathMark => {
  const cx = `${name}_cx`;
  const cy = `${name}_cy`;
  const innerR = `${name}_innerRadius`;
  const angle = `datum.${name}_valueAngle`;
  // Tip shoulders end 12px before the inner track edge
  const tipR = `(${innerR} - 12)`;

  // Base: ±10.5px perpendicular (21px total width at pivot end)
  const bLx = `(${cx} - 10.5*cos(${angle}))`;
  const bLy = `(${cy} - 10.5*sin(${angle}))`;
  const bRx = `(${cx} + 10.5*cos(${angle}))`;
  const bRy = `(${cy} + 10.5*sin(${angle}))`;

  // Tip shoulders: ±4px wide
  const tLx = `(${cx} + ${tipR}*sin(${angle}) - 4*cos(${angle}))`;
  const tLy = `(${cy} - ${tipR}*cos(${angle}) - 4*sin(${angle}))`;
  const tRx = `(${cx} + ${tipR}*sin(${angle}) + 4*cos(${angle}))`;
  const tRy = `(${cy} - ${tipR}*cos(${angle}) + 4*sin(${angle}))`;

  // Straight taper — rounding is handled by a separate tip circle mark
  const pathSignal = [
    `'M ' + ${bLx} + ',' + ${bLy}`,
    `+ ' L ' + ${tLx} + ',' + ${tLy}`,
    `+ ' L ' + ${tRx} + ',' + ${tRy}`,
    `+ ' L ' + ${bRx} + ',' + ${bRy}`,
    `+ ' Z'`,
  ].join(' ');

  return {
    type: 'path',
    from: { data: name },
    encode: {
      enter: {
        path: { signal: pathSignal },
        fill: { value: getS2ColorValue('gray-800', colorScheme) },
      },
    },
  };
};

// Separate circle mark at the tip — guarantees a geometrically perfect round cap
const getNeedleTipMark = ({ name, colorScheme }: GaugeSpecOptions): SymbolMark => {
  const cx = `${name}_cx`;
  const cy = `${name}_cy`;
  const innerR = `${name}_innerRadius`;
  const angle = `datum.${name}_valueAngle`;
  const tipR = `(${innerR} - 12)`;
  return {
    type: 'symbol',
    from: { data: name },
    encode: {
      enter: {
        x: { signal: `${cx} + ${tipR} * sin(${angle})` },
        y: { signal: `${cy} - ${tipR} * cos(${angle})` },
        size: { value: 64 },
        shape: { value: 'circle' },
        fill: { value: getS2ColorValue('gray-800', colorScheme) },
      },
    },
  };
};

const getPivotMark = ({ name, colorScheme }: GaugeSpecOptions): SymbolMark => ({
  type: 'symbol',
  from: { data: name },
  zindex: 1,
  encode: {
    enter: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy` },
      size: { value: 324 },
      fill: { value: '#ffffff' },
      stroke: { value: getS2ColorValue('gray-800', colorScheme) },
      strokeWidth: { value: 3 },
      shape: { value: 'circle' },
    },
  },
});

const getTargetTickMark = ({ name, target, colorScheme }: GaugeSpecOptions): RuleMark => ({
  type: 'rule',
  from: { data: name },
  encode: {
    enter: {
      x: { signal: `${name}_cx + (${name}_innerRadius - 4) * sin(datum.${name}_targetAngle)` },
      y: { signal: `${name}_cy - (${name}_innerRadius - 4) * cos(datum.${name}_targetAngle)` },
      x2: { signal: `${name}_cx + (${name}_radius + 4) * sin(datum.${name}_targetAngle)` },
      y2: { signal: `${name}_cy - (${name}_radius + 4) * cos(datum.${name}_targetAngle)` },
      stroke: { value: '#000000' },
      strokeWidth: { value: 4 },
      strokeCap: { value: 'round' },
    },
  },
});

const getValueLabelMark = ({ name, metric, showNeedle }: GaugeSpecOptions): TextMark => ({
  type: 'text',
  from: { data: name },
  encode: {
    enter: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy + ${name}_radius * 0.18${showNeedle ? ' + 36' : ' - 40'}` },
      text: { field: metric },
      align: { value: 'center' },
      baseline: { value: 'middle' },
      fontSize: { value: showNeedle ? 40 : 56 },
      fontWeight: { value: 800 },
      fontFamily: { value: 'adobe-clean' },
      fill: { value: '#292929' },
    },
  },
});

const getMetricLabelMark = ({ name, label, showNeedle }: GaugeSpecOptions): TextMark => ({
  type: 'text',
  encode: {
    enter: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy + ${name}_radius * 0.4 + 8${showNeedle ? ' + 36' : ' - 40'}` },
      text: { value: wrapLabel(label, showNeedle ? 26 : 14) },
      align: { value: 'center' },
      baseline: { value: 'middle' },
      fontSize: { value: showNeedle ? 26 : 32 },
      fontWeight: { value: 700 },
      fontFamily: { value: 'adobe-clean' },
      fill: { value: '#505050' },
      lineBreak: { value: '\n' },
      lineHeight: { value: showNeedle ? 24 : 32 },
    },
  },
});

const getRangeLabelMarks = ({ name, minScaleValue, maxScaleValue, colorScheme }: GaugeSpecOptions): TextMark[] => [
  {
    type: 'text',
    encode: {
      enter: {
        x: {
          signal: `${name}_cx + (${name}_radius + 12) * sin(${name}_startAngle)`,
        },
        y: {
          signal: `${name}_cy - (${name}_radius + 12) * cos(${name}_startAngle)`,
        },
        text: { value: String(minScaleValue) },
        align: { value: 'center' },
        baseline: { value: 'middle' },
        fontSize: { value: 11 },
        fill: { value: getS2ColorValue('gray-600', colorScheme) },
      },
    },
  },
  {
    type: 'text',
    encode: {
      enter: {
        x: {
          signal: `${name}_cx + (${name}_radius + 12) * sin(${name}_endAngle)`,
        },
        y: {
          signal: `${name}_cy - (${name}_radius + 12) * cos(${name}_endAngle)`,
        },
        text: { value: String(maxScaleValue) },
        align: { value: 'center' },
        baseline: { value: 'middle' },
        fontSize: { value: 11 },
        fill: { value: getS2ColorValue('gray-600', colorScheme) },
      },
    },
  },
];
