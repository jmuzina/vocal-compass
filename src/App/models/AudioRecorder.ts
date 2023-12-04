export interface IAudioRecorderAudioCompletionOutput {
    audio: Blob
    durationSecs: number
    raw: Uint8Array
    analyzer: AnalyserNode
    ctx: AudioContext
    fromChild?: boolean
}
export interface IAudioRecorderAnalysisOutput { pitchHz: number, firstFormantHz: number }
