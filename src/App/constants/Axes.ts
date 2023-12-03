import { type IAudioRecorderAnalysisOutput } from '../models/AudioRecorder';
import { type IAxisProps } from '../models/Axis';

export const PITCH_AXIS: IAxisProps = {
    label: 'Pitch',
    dimension: 'vertical',
    unit: 'Hz',
    limits: {
        lower: { val: 50 },
        upper: { val: 400 }
    },
    formattedValueGeter: (analysis: IAudioRecorderAnalysisOutput) => Math.max(0, analysis.pitchHz).toFixed(0),
    rawValueGetter: (analysis: IAudioRecorderAnalysisOutput) => analysis.pitchHz
}

export const RESONANCE_AXIS: IAxisProps = {
    label: 'Resonance',
    dimension: 'horizontal',
    unit: '%',
    limits: {
        lower: { val: 0 },
        upper: { val: 100 }
    },
    formattedValueGeter: (analysis) => Math.max(0, analysis.firstFormantHz).toFixed(0),
    rawValueGetter: (analysis) => analysis.firstFormantHz
}

export const AXES = [PITCH_AXIS, RESONANCE_AXIS];
