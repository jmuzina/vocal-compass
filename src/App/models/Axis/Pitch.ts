import { type AudioRecorderAnalysisOutput } from '../Audio/AnalysisOutput';
import { type AxisDimensionDirection, AxisProps } from './Axis';
import { DirectAxisDataRelationship } from './AxisDataRelationship/AxisDirectDataRelationship';
import { AxisLimit } from './AxisLimit';
import { AxisRange } from './AxisRange';
import { LinearAxisScale } from './AxisScale/LinearAxisScale';

export class PitchAxis extends AxisProps {
    label = 'Pitch';
    unit = 'Hz';
    dimension: AxisDimensionDirection = 'vertical';
    range: AxisRange = new AxisRange({
        min: new AxisLimit(50),
        max: new AxisLimit(400),
        scale: new LinearAxisScale(),
        dataRelationship: new DirectAxisDataRelationship()
    })

    getRawValueFromAnalysis(analysis: AudioRecorderAnalysisOutput): number {
        return analysis.pitchHz ?? 0;
    }
}
