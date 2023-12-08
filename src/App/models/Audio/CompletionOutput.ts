export interface IAudioRecorderAnalysisOutputCtorOpts {
    audio: Blob
    durationSecs: number
    raw: Float32Array
    analyzer: AnalyserNode
    ctx: AudioContext
    fromChild?: boolean
}

export class AudioRecorderAudioCompletionOutput implements IAudioRecorderAnalysisOutputCtorOpts {
    audio!: Blob;
    durationSecs!: number;
    raw!: Float32Array;
    analyzer!: AnalyserNode;
    ctx!: AudioContext;
    fromChild?: boolean | undefined;

    constructor(
        opts: IAudioRecorderAnalysisOutputCtorOpts
    ) {
        Object.assign(this, opts)
    }
}
