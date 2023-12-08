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
