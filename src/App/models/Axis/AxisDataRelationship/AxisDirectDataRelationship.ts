import { type AxisScale } from '../AxisScale/AxisScale';
import { AxisDataRelationship } from './AxisDataRelationship';

export class DirectAxisDataRelationship extends AxisDataRelationship {
    label = 'Direct';

    applyDataRelationship(scale: AxisScale, val: number, min: number, max: number): number {
        return scale.getValAlongScale(min, max, val);
    }
}
