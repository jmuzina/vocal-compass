export type AnyTypedArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;
export type TypedArrayConstructor<T extends AnyTypedArray> = new (
    buffer: ArrayBuffer,
    byteOffset?: number,
    length?: number
) => T;
