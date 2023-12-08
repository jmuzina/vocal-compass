import { AxisScale } from './AxisScale';

export class LinearAxisScale extends AxisScale {
    label = 'Linear';

    getValAlongScale(min: number, max: number, val: number): number {
        return val;
    }

    getRatioAlongScale(min: number, max: number, val: number): number {
        return val / (max - min)
    }
}
