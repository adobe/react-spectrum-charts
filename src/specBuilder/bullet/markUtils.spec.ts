import { getBulletScales, getBulletData, getBulletMarks, getBulletSignals } from "./markUtils";
import { sampleProps } from "./bulletSpecBuilder.test";

describe('getBulletMarks', () => {
    test('should return the correct marks object', () => {
        const data = getBulletMarks(sampleProps);
        expect(data).toHaveLength(1);
        expect(data[0]?.marks).toHaveLength(4);
        expect(data[0]?.marks?.[0]?.type).toBe('rect');
        expect(data[0]?.marks?.[1]?.type).toBe('rule');
        expect(data[0]?.marks?.[2]?.type).toBe('text');
        expect(data[0]?.marks?.[3]?.type).toBe('text');
    });
});

describe('getBulletData', () => {
    test('should return the data object with max value being set', () => {
        const data = getBulletData(sampleProps);
        expect(data).toHaveLength(1);
    });
});

describe('getBulletScales', () => {

    //Not much here right now because the function only returns a single const
    test('should return the correct scales object', () => {
        const data = getBulletScales(sampleProps);
        expect(data).toBeDefined()
        expect(data).toHaveLength(2)
    });
});

describe('getBulletSignals', () => {

    //Not much here right now because the function only returns a single const
    test('should return the correct signals object', () => {
        const data = getBulletSignals();
        expect(data).toBeDefined()
        expect(data).toHaveLength(7)
    });
});