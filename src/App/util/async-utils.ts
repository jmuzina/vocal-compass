import { type SetStateAction, type Dispatch } from 'react';
export default class AsyncUtils {
    /**
     * Wraps the stateSetterFn in a promise and resolves with the latest state value
     * Useful way to convert React's functional setState returns into an awaitable promise
     * @param stateSetterFn function used to set state. This is the second element of returns from React's useState hook
     * @returns Latest value of the state associated with the stateSetterFn.
     */
    static async getLatestState<T>(stateSetterFn: Dispatch<SetStateAction<T>>): Promise<T> {
        return await new Promise<T>((resolve) => {
            stateSetterFn((val: T) => {
                resolve(val);
                return val;
            })
        })
    }

    static async wait(timeMs: number): Promise<void> {
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeMs);
        });
    }
}
