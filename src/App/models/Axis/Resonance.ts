import { type AudioRecorderAnalysisOutput } from '../Audio/AnalysisOutput';
import { type AxisDimensionDirection, AxisProps } from './Axis'
import { InverseAxisDataRelationship } from './AxisDataRelationship/AxisInverseDataRelationship';
import { AxisLimit } from './AxisLimit';
import { AxisRange } from './AxisRange';
import { LinearAxisScale } from './AxisScale/LinearAxisScale';

export class ResonanceAxis extends AxisProps {
    label = 'Resonance';
    unit = '%';
    dimension: AxisDimensionDirection = 'horizontal';
    range: AxisRange = new AxisRange({
        min: new AxisLimit(11, 0),
        max: new AxisLimit(18, 100),
        scale: new LinearAxisScale(),
        dataRelationship: new InverseAxisDataRelationship()
    })

    getRawValueFromAnalysis(analysis: AudioRecorderAnalysisOutput): number {
        return analysis.vocalTractLengthCm ?? 0;
    }
}
