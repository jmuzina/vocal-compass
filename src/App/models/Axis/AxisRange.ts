import { clamp } from '../../util/math-utils';
import { type AxisDataRelationship } from './AxisDataRelationship/AxisDataRelationship';
import { DirectAxisDataRelationship } from './AxisDataRelationship/AxisDirectDataRelationship';
import { type AxisLimit } from './AxisLimit';
import { type AxisScale } from './AxisScale/AxisScale';

export interface IAxisRangeCtorOpts {
    min: AxisLimit
    max: AxisLimit
    scale: AxisScale
    dataRelationship?: AxisDataRelationship
}

export class AxisRange implements IAxisRangeCtorOpts {
    min!: AxisLimit;
    max!: AxisLimit;
    scale!: AxisScale;
    dataRelationship: AxisDataRelationship;

    get range(): number {
        return Math.max(0, this.max.calcLimit - this.min.calcLimit);
    }

    getValAlongRange(val: number, clamped = false): number {
        let retVal = this.dataRelationship.applyDataRelationship(
            this.scale,
            this.scale.getValAlongScale(this.min.calcLimit, this.max.calcLimit, val),
            this.min.calcLimit,
            this.max.calcLimit
        )
        if (clamped) {
            retVal = clamp(retVal, this.min.calcLimit, this.max.calcLimit);
        }
        return retVal;
    }

    getRatioAlongRange(val: number, clamped = false): number {
        let retVal = this.getValAlongRange(val, clamped) / this.range;
        if (clamped) {
            retVal = clamp(retVal, 0, 1);
        }
        return retVal;
    }

    constructor(opts: IAxisRangeCtorOpts) {
        Object.assign(this, opts)
        this.dataRelationship ||= new DirectAxisDataRelationship();
    }
}
