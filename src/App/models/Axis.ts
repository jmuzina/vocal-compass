import { type IAudioRecorderAnalysisOutput } from './AudioRecorder'

export interface IAxisLimit {
    val: number
}

export interface IAxisProps {
    label: string
    dimension: 'horizontal' | 'vertical'
    unit: string
    limits: {
        lower: IAxisLimit
        upper: IAxisLimit
    }
    formattedValueGeter: (analysis: IAudioRecorderAnalysisOutput) => string
    rawValueGetter: (analysis: IAudioRecorderAnalysisOutput) => number
}
