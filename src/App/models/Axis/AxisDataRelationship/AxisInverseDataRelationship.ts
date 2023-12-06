import { type AxisScale } from '../AxisScale/AxisScale';
import { AxisDataRelationship } from './AxisDataRelationship';

export class InverseAxisDataRelationship extends AxisDataRelationship {
    applyDataRelationship(scale: AxisScale, val: number, min: number, max: number): number {
        const ratio = val / (max - min);
        const inverseRatio = 1 - ratio;
        return scale.getValAlongScale(min, max, inverseRatio);
    }
}
