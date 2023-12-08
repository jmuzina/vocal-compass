export class AxisLimit {
    static Equals(a: AxisLimit, b: AxisLimit): boolean {
        return a.calcLimit === b.calcLimit &&
            a.displayedVal === b.displayedVal &&
            a.overrideDisplayedLabel === b.overrideDisplayedLabel
    }

    get displayedVal(): number {
        if (this.overrideDisplayedLabel !== undefined && this.overrideDisplayedLabel !== null) return this.overrideDisplayedLabel;
        return this.calcLimit
    }

    constructor(public calcLimit: number, public overrideDisplayedLabel?: number) {}
}
