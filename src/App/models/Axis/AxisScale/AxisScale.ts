export abstract class AxisScale {
    abstract getValAlongScale(min: number, max: number, val: number): number;
    abstract getRatioAlongScale(min: number, max: number, val: number): number;
}
