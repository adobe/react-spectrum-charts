import { getBulletScales, getBulletData, getBulletMarks, getBulletSignals, getBulletMarkRect, getBulletMarkLabel, getBulletMarkTarget, getBulletMarkValueLabel } from "./markUtils";
import { sampleProps } from "./bulletSpecBuilder.test";

describe('getBulletMarks', () => {
    test('Should return the correct marks object', () => {
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
    test('Should return the data object', () => {
        const data = getBulletData(sampleProps);
        expect(data).toHaveLength(1);
    });
});

describe('getBulletScales', () => {

    test('Should return the correct scales object', () => {
        const data = getBulletScales(sampleProps);
        expect(data).toBeDefined()
        expect(data).toHaveLength(2)
    });
});

describe('getBulletSignals', () => {

    test('Should return the correct signals object', () => {
        const data = getBulletSignals();
        expect(data).toBeDefined()
        expect(data).toHaveLength(7)
    });
});

describe('getBulletMarkRect', () => {

    test('Should return the correct rect mark object', () => {
        const data = getBulletMarkRect(sampleProps);
        expect(data).toBeDefined()
        expect(data.encode?.update).toBeDefined();

        // Expect the correct amount of fields in the update object
        expect(Object.keys(data.encode?.update ?? {}).length).toBe(4);
    });
});

describe('getBulletMarkTarget', () => {

    test('Should return the correct target mark object', () => {
        const data = getBulletMarkTarget(sampleProps);
        expect(data).toBeDefined()
        expect(data.encode?.update).toBeDefined();
        expect(Object.keys(data.encode?.update ?? {}).length).toBe(3);
    });
});

describe('getBulletMarkLabel', () => {

    test('Should return the correct label mark object', () => {
        const data = getBulletMarkLabel(sampleProps);
        expect(data).toBeDefined()
        expect(data.encode?.update).toBeDefined();
        expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
    });
});

describe('getBulletMarkValueLabel', () => {

    test('Should return the correct value label mark object', () => {
        const data = getBulletMarkValueLabel(sampleProps);
        expect(data).toBeDefined()
        expect(data.encode?.update).toBeDefined();
        expect(Object.keys(data.encode?.update ?? {}).length).toBe(2);
    });
});