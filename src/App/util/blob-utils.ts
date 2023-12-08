import { type TypedArrayConstructor, type AnyTypedArray } from '../types/array';
import { ensureArrayBufferMultipleOf4 } from './array-utils';

export const readBlobAsTypedArray = async <T extends AnyTypedArray>(blob: Blob, constructor: TypedArrayConstructor<T>): Promise<T> => {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new constructor(ensureArrayBufferMultipleOf4(reader.result)))
            } else {
                reject(new Error('Failed to read Blob as ArrayBuffer.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading Blob.'));
        };

        reader.readAsArrayBuffer(blob);
    });
}
