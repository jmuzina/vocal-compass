import { type AxisScale } from '../AxisScale/AxisScale';

export abstract class AxisDataRelationship {
    abstract applyDataRelationship(scale: AxisScale, val: number, min: number, max: number): number;
}
