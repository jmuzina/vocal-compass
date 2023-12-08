import { type AudioRecorderAnalysisOutput } from '../Audio/AnalysisOutput';
import { AxisRange } from './AxisRange';

export type AxisDimensionDirection = 'horizontal' | 'vertical';

export interface IAxisPropsCtorOpts {
    label: string
    dimension: AxisDimensionDirection
    unit: string
    range: AxisRange
}

export abstract class AxisProps implements IAxisPropsCtorOpts {
    abstract label: string;
    abstract unit: string;
    abstract dimension: AxisDimensionDirection;
    abstract range: AxisRange;

    abstract getRawValueFromAnalysis(analysis: AudioRecorderAnalysisOutput): number;

    static Equals(a: AxisProps, b: AxisProps): boolean {
        return a.label === b.label &&
            a.unit === b.unit &&
            a.dimension === b.dimension &&
            AxisRange.Equals(a.range, b.range)
    }

    getFormattedValueFromAnalysis(analysis: AudioRecorderAnalysisOutput, opts?: { clamped?: boolean, precision?: number }): string {
        const rawVal = this.getValAlongRangeFromAnalysis(analysis, !!opts?.clamped);
        let retVal = rawVal.toString();
        if (opts && 'precision' in opts) retVal = rawVal.toFixed(opts.precision);
        return retVal;
    }

    getRawValAlongAxisFromAnalysis(analysis: AudioRecorderAnalysisOutput): number {
        return this.getRawValAlongAxisFromRawVal(this.getRawValueFromAnalysis(analysis));
    }

    getRawValAlongAxisFromRawVal(val: number): number {
        return this.range.scale.getValAlongScale(
            this.range.min.calcLimit,
            this.range.max.calcLimit,
            val
        )
    }

    getValAlongRangeFromAnalysis(analysis: AudioRecorderAnalysisOutput, clamped = false): number {
        return this.getValALongRangeFromRawVal(this.getRawValueFromAnalysis(analysis), clamped);
    }

    getValALongRangeFromRawVal(val: number, clamped = false): number {
        return this.range.getValAlongRange(val, clamped);
    }

    getRatioAlongRangeFromAnalysis(analysis: AudioRecorderAnalysisOutput, clamped = false): number {
        return this.getRatioAlongRangeFromRawVal(this.getRawValueFromAnalysis(analysis), clamped);
    }

    getRatioAlongRangeFromRawVal(val: number, clamped = false): number {
        return this.range.getRatioAlongRange(val, clamped);
    }
}
