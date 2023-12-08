import { type AnyTypedArray } from '../types/array';

export const ensureArrayBufferMultipleOf4 = (originalBuffer: ArrayBuffer): ArrayBuffer => {
    const originalLength = originalBuffer.byteLength;
    const remainder = originalLength % 4;

    if (remainder === 0) {
        // No need to adjust, already a multiple of 4
        return originalBuffer;
    }

    // Calculate the adjusted length to make it a multiple of 4
    const adjustedLength = originalLength + (4 - remainder);

    // Create a new ArrayBuffer with the adjusted length
    const adjustedBuffer = new ArrayBuffer(adjustedLength);

    // Copy the content of the original ArrayBuffer to the adjusted one
    new Uint8Array(adjustedBuffer).set(new Uint8Array(originalBuffer));

    return adjustedBuffer;
};

/**
 * Calculate the moving average of each element in an array.
 *
 * This function calculates a moving average without zero padding. No values outside bounds are
 * assumed.
 * @param {Uint8Array} data Input array of length n to be processed.
 * @param {number} span Length on either side indicating the size of the sliding window.
 * @param {number} maxIndex Maximum size for the output array.
 */
export const movingAverage = (data: number[], span: number, maxIndex = 1000): number[] => {
    const output = new Array(Math.min(data.length, maxIndex));
    let tmpCurAvg;
    let totalDiv;
    for (let i = 0; i < Math.min(data.length, maxIndex); i++) {
        tmpCurAvg = 0;
        totalDiv = 0;
        for (let l = i - span; l <= i + span; l++) {
            if (l >= 0 && l < Math.min(data.length, maxIndex)) {
                tmpCurAvg += data[l];
                totalDiv += 1;
            }
        }
        output[i] = tmpCurAvg / totalDiv;
    }
    return output;
}

export const typedArrayToNumberArray = (typedArray: AnyTypedArray): number[] => {
    return Array.from(typedArray);
};
