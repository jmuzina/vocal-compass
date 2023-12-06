export interface IAudioRecorderAnalysisOutputCtorOpts {
    audio: Blob
    durationSecs: number
    raw: Uint8Array
    analyzer: AnalyserNode
    ctx: AudioContext
    fromChild?: boolean
}

export class AudioRecorderAudioCompletionOutput implements IAudioRecorderAnalysisOutputCtorOpts {
    audio!: Blob;
    durationSecs!: number;
    raw!: Uint8Array;
    analyzer!: AnalyserNode;
    ctx!: AudioContext;
    fromChild?: boolean | undefined;

    constructor(
        opts: IAudioRecorderAnalysisOutputCtorOpts
    ) {
        Object.assign(this, opts)
    }
}
