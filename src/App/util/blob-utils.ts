export const readBlobAsUint8Array = async (blob: Blob): Promise<Uint8Array> => {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                const uint8Array = new Uint8Array(reader.result);
                resolve(uint8Array);
            } else {
                reject(new Error('Failed to read Blob as Uint8Array.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading Blob.'));
        };

        reader.readAsArrayBuffer(blob);
    });
}
