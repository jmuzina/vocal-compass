export abstract class AxisScale {
    static Equals(a: AxisScale, b: AxisScale): boolean {
        return a.label === b.label;
    }

    abstract label: string;
    abstract getValAlongScale(min: number, max: number, val: number): number;
    abstract getRatioAlongScale(min: number, max: number, val: number): number;
}
