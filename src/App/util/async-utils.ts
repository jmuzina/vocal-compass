export const wait = async (timeMs: number): Promise<void> => {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeMs);
    });
}
