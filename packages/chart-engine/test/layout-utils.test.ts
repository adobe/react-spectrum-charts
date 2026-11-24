import { describe, expect, it } from 'vitest';
import { overlaps } from '../src/core/cartesian/ticks.js';
import { resolveVertical } from '../src/util/labels.js';
import { linearRegression } from '../src/util/stats.js';

describe('overlaps', () => {
  it('detects labels closer than the gap', () => {
    expect(overlaps([{ pos: 0, width: 40 }, { pos: 50, width: 40 }])).toBe(true);
    expect(overlaps([{ pos: 0, width: 40 }, { pos: 60, width: 40 }])).toBe(false);
  });
});

describe('resolveVertical', () => {
  it('leaves separated labels alone', () => {
    const r = resolveVertical(
      [
        { id: 'a', y: 10, height: 10 },
        { id: 'b', y: 50, height: 10 },
      ],
      0,
      100,
    );
    expect([r.get('a'), r.get('b')]).toEqual([10, 50]);
  });
  it('spreads colliding labels around their mean without overlap', () => {
    const r = resolveVertical(
      [
        { id: 'a', y: 50, height: 10 },
        { id: 'b', y: 52, height: 10 },
      ],
      0,
      100,
    );
    const a = r.get('a')!;
    const b = r.get('b')!;
    expect(b - a).toBeGreaterThanOrEqual(12);
    expect((a + b) / 2).toBeCloseTo(51);
  });
  it('keeps labels inside the bounds', () => {
    const r = resolveVertical(
      [
        { id: 'a', y: 98, height: 10 },
        { id: 'b', y: 99, height: 10 },
      ],
      0,
      100,
    );
    expect(r.get('b')! + 5).toBeLessThanOrEqual(100);
    expect(r.get('b')! - r.get('a')!).toBeGreaterThanOrEqual(12);
  });
});

describe('linearRegression', () => {
  it('fits a line', () => {
    const fit = linearRegression([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ])!;
    expect(fit.slope).toBeCloseTo(2);
    expect(fit.intercept).toBeCloseTo(1);
  });
  it('returns null without two distinct x values', () => {
    expect(linearRegression([{ x: 1, y: 1 }])).toBeNull();
    expect(linearRegression([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBeNull();
  });
});
