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
  addAxes,
  addMarks,
  getBulletMarkLabel,
  getBulletMarkRect,
  getBulletMarkTarget,
  getBulletMarkThreshold,
  getBulletMarkValueLabel,
  getBulletTrack,
} from './bulletMarkUtils';
import { sampleOptionsColumn, sampleOptionsRow } from './bulletTestUtils';

describe('getBulletMarks', () => {
  test('Should return the correct marks object for column mode', () => {
    const data = addMarks([], sampleOptionsColumn)[0] as GroupMark;
    expect(data).toBeDefined;
    expect(data?.marks).toHaveLength(4);
    expect(data?.marks?.[0]?.type).toBe('rect');
    expect(data?.marks?.[1]?.type).toBe('rule');
    expect(data?.marks?.[2]?.type).toBe('text');
    expect(data?.marks?.[3]?.type).toBe('text');

    //Make sure the object that defines the orientation contains the correct key
    expect(Object.keys(data?.encode?.update || {})).toContain('y');
  });

  test('Should return the correct marks object for row mode', () => {
    const data = addMarks([], sampleOptionsRow)[0] as GroupMark;
    expect(data).toBeDefined;
    expect(data?.marks).toHaveLength(4);
    expect(data?.marks?.[0]?.type).toBe('rect');
    expect(data?.marks?.[1]?.type).toBe('rule');
    expect(data?.marks?.[2]?.type).toBe('text');
    expect(data?.marks?.[3]?.type).toBe('text');
    expect(Object.keys(data?.encode?.update || {})).toContain('x');
  });

  test('Should not include target marks when showTarget is false', () => {
    const options = { ...sampleOptionsColumn, showTarget: false, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(3);
    marksGroup.marks?.forEach((mark) => {
      expect(mark.description).not.toContain('Target');
    });
  });

  test('Should include target value label when showTargetValue is true', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
    expect(targetValueMark).toBeDefined();
  });

  test('Should include label marks when axis labels are enabled', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const targetValueMark = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
    expect(targetValueMark).toBeDefined();
  });

  test('Should include bullet track when track is set to true and threshold is set to false.', () => {
    const options = { ...sampleOptionsColumn, threshold: false, track: true };
    const marksGroup = addMarks([], options)[0] as GroupMark;
    expect(marksGroup.marks).toHaveLength(5);
    const bulletTrackMark = marksGroup.marks?.find((mark) => mark.name?.includes('Track'));
    expect(bulletTrackMark).toBeDefined();

    // Threshold mark should not be present
    const bulletThresholdMark = marksGroup.marks?.find((mark) => mark.name?.includes('Threshold'));
    expect(bulletThresholdMark).toBeUndefined();
  });
});

describe('getBulletMarkRect', () => {
  test('Should return the correct rect mark object', () => {
    const data = getBulletMarkRect(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();

    // Expect the correct amount of fields in the update object
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
  });

  describe('getBulletMarkRect threshold color logic', () => {
    test('Uses barColor field when thresholdBarColor is enabled and thresholds exist', () => {
      const optionsWithThresholdColor = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [
          { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
          { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
          { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
        ],
      };

      const rectMark = getBulletMarkRect(optionsWithThresholdColor);
      expect(rectMark.encode?.enter?.fill).toEqual([{ field: 'barColor' }]);
    });

    test('Uses default color field when thresholdBarColor is disabled or no thresholds exist', () => {
      const optionsNoThresholds = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [],
      };

      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });

    test('Uses default color field when thresholdBarColor is disabled', () => {
      const optionsNoThresholds = {
        ...sampleOptionsColumn,
        thresholdBarColor: false,
        thresholds: [
          { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
          { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
          { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
        ],
      };

      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });

    test('Uses default color field when thresholdBarColor is disabled and no thresholds exist', () => {
      const optionsNoThresholds = {
        ...sampleOptionsColumn,
        thresholdBarColor: false,
        thresholds: [],
      };

      const rectMark = getBulletMarkRect(optionsNoThresholds);
      expect(rectMark.encode?.enter?.fill).toEqual([{ value: optionsNoThresholds.color }]);
    });
  });
});

describe('getBulletMarkTarget', () => {
  test('Should return the correct target mark object', () => {
    const data = getBulletMarkTarget(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
  });
});

describe('getBulletMarkLabel', () => {
  test('Should return the correct label mark object', () => {
    const data = getBulletMarkLabel(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });
});

describe('getBulletMarkValueLabel', () => {
  test('Should return the correct value label mark object in column mode', () => {
    const data = getBulletMarkValueLabel(sampleOptionsColumn);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
  });

  test('Should apply numberFormat specifier to metric and target values', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true, numberFormat: '$,.2f' };
    const marksGroup = addMarks([], options)[0] as GroupMark;

    const metricValueLabel = marksGroup.marks?.find((mark) => mark.name === `${options.name}ValueLabel`);
    expect(metricValueLabel).toBeDefined();

    if (metricValueLabel?.encode?.enter?.text) {
      const textEncode = metricValueLabel.encode.enter.text;
      if (typeof textEncode === 'object' && 'signal' in textEncode) {
        expect(textEncode.signal).toContain(`format(datum.${options.metric}, '$,.2f')`);
      }
    }

    const TargetValueLabel = marksGroup.marks?.find((mark) => mark.name?.includes('TargetValueLabel'));
    expect(TargetValueLabel).toBeDefined();

    if (TargetValueLabel?.encode?.enter?.text) {
      const textEncode = TargetValueLabel.encode.enter.text;
      if (typeof textEncode === 'object' && 'signal' in textEncode) {
        expect(textEncode.signal).toContain(`format(datum.${options.target}, '$,.2f')`);
      }
    }
  });

  describe('getBulletMarkValueLabel threshold color logic', () => {
    test('Uses barColor field for label when thresholdBarColor is true', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [{ thresholdMax: 200, fill: 'rgb(249, 137, 23)' }],
      };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({
        signal: "datum.barColor === 'green' ? 'rgb(0, 0, 0)' : datum.barColor",
      });
    });

    test('Falls back to neutral when thresholdBarColor is false', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: false,
      };
      const labelMark = getBulletMarkValueLabel(options);

      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when no thresholds are provided', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [],
      };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when thresholdBarColor is false and no thresholds are provided', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: false,
        thresholds: [],
      };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });

    test('Uses default color when thresholdBarColor is true and no thresholds are provided', () => {
      const options = {
        ...sampleOptionsColumn,
        thresholdBarColor: true,
        thresholds: [],
      };
      const labelMark = getBulletMarkValueLabel(options);
      expect(labelMark.encode?.enter?.fill).toEqual({ signal: "'rgb(0, 0, 0)'" });
    });
  });
});

describe('getBulletMarkSideLabel', () => {
  test('Should not return label marks when side label mode is enabled', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top' };
    const marks = addMarks([], options)[0] as GroupMark;
    expect(marks.marks).toBeDefined();
    expect(marks.marks).toHaveLength(2);
  });
});

describe('getBulletAxes', () => {
  test('Should return the correct axes object when side label mode is enabled', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top' };
    const axes = addAxes([], options);
    expect(axes).toHaveLength(2);
    expect(axes[0].labelOffset).toBe(2);
  });

  test('Should return the correct axes object when side label mode is enabled and target label is shown', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top', showTargetValue: true };
    const axes = addAxes([], options);
    expect(axes).toHaveLength(2);
    expect(axes[0].labelOffset).toBe(-8);
  });

  test('Should return an empty list when top label mode is enabled', () => {
    const options = { ...sampleOptionsColumn };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([]);
  });

  test('Should return the scale axis when axis is true, row mode is enabled, and showtarget is false', () => {
    const options = { ...sampleOptionsColumn, metricAxis: true };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([
      {
        labelOffset: 2,
        scale: 'xscale',
        orient: 'bottom',
        ticks: false,
        labelColor: 'gray',
        domain: false,
        tickCount: 5,
        offset: { signal: 'axisOffset' },
      },
    ]);
  });

  test('Should not return scale axis when showtarget and showtargetValue are true', () => {
    const options = { ...sampleOptionsColumn, showTarget: true, showTargetValue: true, axis: true };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([]);
  });

  test('Should return scale axis and label axes when both are enabled', () => {
    const options = { ...sampleOptionsColumn, labelPosition: 'side' as 'side' | 'top', metricAxis: true };
    const axes = addAxes([], options);
    expect(axes).toStrictEqual([
      {
        labelOffset: 2,
        scale: 'xscale',
        orient: 'bottom',
        ticks: false,
        labelColor: 'gray',
        domain: false,
        tickCount: 5,
        offset: { signal: 'axisOffset' },
      },
      {
        scale: 'groupScale',
        orient: 'left',
        tickSize: 0,
        labelOffset: 2,
        labelPadding: 10,
        labelColor: '#797979',
        domain: false,
      },
      {
        scale: 'groupScale',
        orient: 'right',
        tickSize: 0,
        labelOffset: 2,
        labelPadding: 10,
        domain: false,
        encode: {
          labels: {
            update: {
              text: {
                signal:
                  "info(data('table')[datum.index * (length(data('table')) - 1)].currentAmount) != null ? format(info(data('table')[datum.index * (length(data('table')) - 1)].currentAmount), '') : ''",
              },
            },
          },
        },
      },
    ]);
  });
});

describe('Threshold functionality', () => {
  describe('Data generation', () => {
    test('Should add threshold data and mark when thresholds are provided', () => {
      const detailedThresholds = [
        { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
        { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
        { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
      ];
      const options = {
        ...sampleOptionsRow,
        name: 'testBullet',
        thresholds: detailedThresholds,
      };

      const marksGroup = addMarks([], options)[0] as GroupMark;
      expect(marksGroup.data).toBeDefined();
      expect(marksGroup.data?.[0].name).toBe('thresholds');

      // Ensure that the generated values match the detailed thresholds.
      const dataItem = marksGroup.data?.[0];
      expect(dataItem).toHaveProperty('values');
      const values = (dataItem as { values: unknown[] }).values;
      expect(values).toEqual(detailedThresholds);

      const thresholdMark = marksGroup.marks?.find((mark) => mark.name === `${options.name}Threshold`);
      expect(thresholdMark).toBeDefined();
    });
  });

  describe('Y encoding', () => {
    test('Should adjust y encoding when showTarget and showTargetValue is enabled', () => {
      const options = {
        ...sampleOptionsRow,
        name: 'testBullet',
        showTarget: true,
        showTargetValue: true,
      };
      expect(options.showTarget).toBe(true);
      expect(options.showTargetValue).toBe(true);

      const thresholdMark = getBulletMarkThreshold(options);
      expect(thresholdMark).toBeDefined();
      expect(thresholdMark.encode).toBeDefined();
      expect(thresholdMark.encode?.update).toBeDefined();

      const yEncoding = thresholdMark.encode?.update?.y;
      if (yEncoding && 'signal' in yEncoding) {
        expect(yEncoding.signal).toContain('targetValueLabelHeight');
        const expectedSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight - targetValueLabelHeight';
        expect(yEncoding.signal).toBe(expectedSignal);
      }
    });

    test('Should compute y encoding without subtracting targetValueLabelHeight when showTargetValue is false', () => {
      const options = {
        ...sampleOptionsRow,
        name: 'testBullet',
        showTarget: true,
        showTargetValue: false,
      };
      const thresholdMark = getBulletMarkThreshold(options);
      expect(thresholdMark).toBeDefined();
      expect(thresholdMark.encode).toBeDefined();
      expect(thresholdMark.encode?.update).toBeDefined();

      const yEncoding = thresholdMark.encode?.update?.y;
      if (yEncoding && 'signal' in yEncoding) {
        expect(yEncoding.signal).not.toContain('targetValueLabelHeight');
        const expectedSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight';
        expect(yEncoding.signal).toBe(expectedSignal);
      }
    });
  });
});

describe('getBulletMarkTrack', () => {
  test('Should return the correct track mark object in column mode', () => {
    const options = {
      ...sampleOptionsColumn,
      name: 'testBullet',
      threshold: false,
      track: true,
    };
    const data = getBulletTrack(options);
    expect(data).toBeDefined();
    expect(data.encode?.update).toBeDefined();
    expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
    expect(Object.keys(data.encode?.enter ?? {}).length).toBe(5);
    expect(data.encode?.update?.width).toBeDefined();
    expect(data.encode?.update?.width).toStrictEqual({ signal: 'width' });
  });

  test('Should return the correct track mark object in row mode', () => {
    const options = {
      ...sampleOptionsRow,
      name: 'testBullet',
      threshold: false,
      track: true,
    };
    const data = getBulletTrack(options);
    expect(data.encode?.update?.width).toBeDefined();
    expect(data.encode?.update?.width).toStrictEqual({ signal: 'bulletGroupWidth' });
  });

  test('Should return the correct track mark object when the target label is enabled', () => {
    const options = {
      ...sampleOptionsRow,
      name: 'testBullet',
      threshold: false,
      track: true,
      showTarget: true,
      showTargetValue: true,
    };
    const data = getBulletTrack(options);
    expect(data.encode?.update?.y).toBeDefined();
    expect(data.encode?.update?.y).toStrictEqual({ signal: 'bulletGroupHeight - 3 - 2 * bulletHeight - 20' });
  });
});
