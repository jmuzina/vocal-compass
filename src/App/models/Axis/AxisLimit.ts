export class AxisLimit {
    get displayedVal(): number {
        if (this.overrideDisplayedLabel !== undefined && this.overrideDisplayedLabel !== null) return this.overrideDisplayedLabel;
        return this.calcLimit
    }

    constructor(public calcLimit: number, public overrideDisplayedLabel?: number) {}
}
