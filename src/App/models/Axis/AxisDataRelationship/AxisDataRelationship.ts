import { type AxisScale } from '../AxisScale/AxisScale';

export abstract class AxisDataRelationship {
    abstract label: string;
    abstract applyDataRelationship(scale: AxisScale, val: number, min: number, max: number): number;

    static Equals(a: AxisDataRelationship, b: AxisDataRelationship): boolean {
        return a.label === b.label;
    }
}
