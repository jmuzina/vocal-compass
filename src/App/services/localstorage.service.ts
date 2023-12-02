import { APP_INFO } from '../../app-info';
import { type Maybe } from '../models/Maybe';
import { strToHyphenatedLowerCase } from '../util/string-utils';

class LocalStorageService {
    private ensureValidKey(key: string): void {
        if (!this.isValidKey(key)) throw new Error(`Invalid localStorage key ${key}.`);
    }

    private isValidKey(key: string): boolean {
        return !!key?.length && key?.length <= 64;
    }

    private isValidValue<T>(val?: T): boolean {
        const valType = typeof (val);
        return !['function', 'symbol'].some((invalidTypeReturn) => invalidTypeReturn === valType);
    }

    private ensureValidValue<T>(val?: T): void {
        if (!this.isValidValue<T>(val)) throw new Error(`Invalid localStorage value ${JSON.stringify(val)}`);
    }

    private getValRaw<T>(val?: T): Maybe<string> {
        if (!val) return;

        switch (typeof (val)) {
            case 'object':
                return JSON.stringify(val);
            default:
                return val?.toString();
        }
    }

    private transformKeyToAppStandard(key: string): string {
        return strToHyphenatedLowerCase([APP_INFO.developerNamespace, APP_INFO.name, key.trim()].join('.'));
    }

    get<T>(key: string): Maybe<T> {
        this.ensureValidKey(key);
        const rawVal = localStorage.getItem(this.transformKeyToAppStandard(key));
        if (!rawVal?.length) return;
        switch (typeof (rawVal)) {
            case 'object':
                return JSON.parse(rawVal) as T;
            default:
                return rawVal as unknown as T;
        }
    }

    /**
     * Set a value in localStorage.
     * @param key key of the item being set
     * @param val value to set. If it's null or undefined, the item will be deleted from localStorage.
     */
    set<T>(key: string, val: T): Maybe<T> {
        this.ensureValidKey(key);
        this.ensureValidValue<T>(val);

        const setTo = this.getValRaw<T>(val);
        if (!setTo) {
            this.remove(key);
            return;
        }

        localStorage.setItem(this.transformKeyToAppStandard(key), setTo);
    }

    /**
     * Remove an item from localStorage
     * @param key Key of the item to remove
     * @returns Whether an item was removed
     */
    remove(key: string): boolean {
        if (!this.get(key)) return false;
        localStorage.removeItem(this.transformKeyToAppStandard(key));
        return true;
    }
}

export default new LocalStorageService();
