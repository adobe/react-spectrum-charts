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
import { GroupMark } from 'vega';

import {
  addGaugeMarks,
  getBackgroundArc,
  getFillerArc,
  getNeedle,
  getPerformanceRangeMarks,
  getBandGap1,
  getBandGap2,
  getNeedleHole,
  getTargetLine,
  getStartCap,
  getEndCap,
  getLabel,
  getValueLabel,
  } from './gaugeMarkUtils';

import { defaultGaugeOptions } from './gaugeTestUtils';
import { spectrumColors } from '../../../themes';
import { DEFAULT_PERFORMANCE_RANGES } from './gaugeSpecBuilder';


// getGaugeMarks
describe('getGaugeMarks', () => {
  test('Should return the correct marks object', () => {
    const data = addGaugeMarks([], defaultGaugeOptions);
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(4);
    expect(data[0].type).toBe('arc');
    expect(data[1].type).toBe('arc');
  });
});

// getGaugeBackgroundArc
describe('getGaugeBackgroundArc', () => {
  test('Should return the correct background arc mark object', () => {
    const data = getBackgroundArc("backgroundTestName", spectrumColors['light']['blue-200'], spectrumColors['light']['blue-300']);
    expect(data).toBeDefined();
    expect(data.encode?.enter).toBeDefined();

    // Expect the correct amount of fields in the update object
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(7);
  });
});

// getFillerArc
describe('getFillerArc', () => {
  test('Should return the correct filler arc mark object', () => {
    const data = getFillerArc("fillerTestName", spectrumColors['light']['magenta-900']);
    expect(data).toBeDefined();

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(7)
  });
});

// getGaugeNeedle
describe('getGaugeNeedle', () => {
  test('Should return the needle mark object', () => {
    const data = getNeedle("needleTestName");
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(2)
  });
});

// getDefaultPerformanceRanges
describe('DEFAULT_PERFORMANCE_RANGES', () => {
  test('Should use the correct bandEndPct and fill colors for red, yellow, green', () => {
    expect(DEFAULT_PERFORMANCE_RANGES).toBeDefined();
    expect(DEFAULT_PERFORMANCE_RANGES).toHaveLength(3);

    const [band1, band2, band3] = DEFAULT_PERFORMANCE_RANGES;

    // Band 1: red
    expect(band1.bandEndPct).toBe(0.55);
    expect(band1.fill).toBe(spectrumColors.light['red-900']);

    // Band 2: yellow
    expect(band2.bandEndPct).toBe(0.8);
    expect(band2.fill).toBe(spectrumColors.light['yellow-400']);

    // Band 3: green
    expect(band3.bandEndPct).toBe(1);
    expect(band3.fill).toBe(spectrumColors.light['green-700']);
  });
});

// getPerformanceRangeTests
describe('getPerformanceRangesTests', () => {
  const performanceRanges = [
    { bandEndPct: 0.55, fill: 'red-900' },
    { bandEndPct: 0.8, fill: 'yellow-900' },
    { bandEndPct: 1, fill: 'green-700' },
  ];
 
  test('Performance ranges enabled adds band arcs, gaps, and caps', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      showPerformanceRanges: true,
      performanceRanges,
    });
    expect(data).toHaveLength(9);
    expect(data.map(mark => mark.type)).toEqual([
      'arc',  
      'arc',  
      'arc',  
      'rule',
      'rule',
      'arc',  
      'arc',
      'symbol',
      'symbol',
    ]);
  });
 
  test('Performance ranges disabled keeps background, filler, and caps', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      showPerformanceRanges: false });
    expect(data).toHaveLength(4);
    expect(data.every(mark => mark.type === 'arc')).toBe(true);
  });
});describe('getPerformanceRangesTests', () => {
  const performanceRanges = [
    { bandEndPct: 0.55, fill: 'red-900' },
    { bandEndPct: 0.8, fill: 'yellow-900' },
    { bandEndPct: 1, fill: 'green-700' },
  ];
 
  test('Performance ranges enabled adds band arcs, gaps, and caps', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      showPerformanceRanges: true,
      performanceRanges,
    });
    expect(data).toHaveLength(9);
    expect(data.map(mark => mark.type)).toEqual([
      'arc',  
      'arc',  
      'arc',  
      'rule',
      'rule',
      'arc',  
      'arc',
      'symbol',
      'symbol',
    ]);
  });
 
  test('Performance ranges disabled keeps background, filler, and caps', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      showPerformanceRanges: false });
    expect(data).toHaveLength(4);
    expect(data.every(mark => mark.type === 'arc')).toBe(true);
  });
});
 


// getBandGap1
describe('getGaugeBandGap1', () => {
  test('Should return the band 1 gap mark object', () => {
    const data = getBandGap1('bandGapTestName');
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(3);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(5);
  });
});


// getBandGap2
describe('getGaugeBandGap2', () => {
  test('Should return the band 2 gap mark object', () => {
    const data = getBandGap2('bandGapTestName');
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(3);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(5);
  });
});

// getNeedleHole
describe('getGaugeNeedleHole', () => {
  test('Should return the needle hole mark object', () => {
    const backgroundColorSignal = 'chartBackgroundColor';
    const data = getNeedleHole('needleTestName', backgroundColorSignal);
    expect(data).toBeDefined();
    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(2);

    expect(data.encode?.enter?.x).toBeDefined();
    expect(data.encode?.enter?.y).toBeDefined();

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
  });
});

// getTargetLine
describe('getGaugeTargetLine', () => {
  test('Should return the target line mark object', () => {
    const data = getTargetLine('targetTestName');
    expect(data).toBeDefined();


    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(3);


    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(5);
  });
});

// getStartCap
describe('getGaugeStartCap', () => {
  test('Should return the start cap mark object', () => {
    const data = getStartCap('startCapTestName', 'fillerColorToCurrVal', 'chartBackgroundColor');
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(8);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });
});


// getEndCap
describe('getGaugeEndCap', () => {
  test('Should return the end cap mark object', () => {
    const data = getEndCap('endCapTestName', 'fillerColorToCurrVal', 'chartBackgroundColor');
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(7);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });
});

// getLabel
describe('getGaugeLabel', () => {
  test('Should return the label mark object', () => {
    const data = getLabel('labelTestName', 14, 20);
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(4);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
  });
});

// getValueLabel
describe('getGaugeValueLabel', () => {
  test('Should return the value label mark object', () => {
    const data = getValueLabel('valueLabelTestName', 16, 30);
    expect(data).toBeDefined();

    expect(data.encode?.enter).toBeDefined();
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(4);

    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
  });
});

// getGaugeNeeldeAndLabelTests
describe('getGaugeNeedleAndLabelTests', () => {
  test('Needle and Label Both True', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      needle: true,
      showLabel: true
    });
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(8);
 
    // Should have 4 arcs to start
    expect(data.filter(m => m.type === 'arc')).toHaveLength(4);
    // Needle should be present
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('Needle'))).toBe(true);
    // Needle holde should be present
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('NeedleHole'))).toBe(true);
    // Graph Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelText'))).toBe(true);
    // Value Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelCurrentValueText'))).toBe(true);
  });
 
  test('Needle True and Label False', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      needle: true,
      showLabel: false
    });
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(6);
 
    // Still have 4 arcs to start
    expect(data.filter(m => m.type === 'arc')).toHaveLength(4);
    // Needle present
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('Needle'))).toBe(true);
    // Needle holde should be present
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('NeedleHole'))).toBe(true);
    // Graph Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelText'))).toBe(false);
    // Value Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelCurrentValueText'))).toBe(false);
  });
 
  test('Needle False and Label True', () => {
    const data = addGaugeMarks([], {
      ...defaultGaugeOptions,
      needle: false,
      showLabel: true
    });
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(6);
 
    // Still have 4 arcs to start
    expect(data.filter(m => m.type === 'arc')).toHaveLength(4);
    // No needle mark
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('Needle'))).toBe(false);
    // Needle holde should be present
    expect(data.some(m => m.type === 'symbol' && (m.name ?? '').includes('NeedleHole'))).toBe(false);
    // Graph Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelText'))).toBe(true);
    // Value Label present
    expect(data.some(m => m.type === 'text' && (m.name ?? '').includes('graphLabelCurrentValueText'))).toBe(true);
  });
});

