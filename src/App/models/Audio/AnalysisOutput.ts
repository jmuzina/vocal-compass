import { type Maybe } from '../Maybe';

export interface IAudioRecorderAnalysisOutputCtorOpts {
    pitchHz: Maybe<number>
    vocalTractLengthCm: Maybe<number>
}

export class AudioRecorderAnalysisOutput implements IAudioRecorderAnalysisOutputCtorOpts {
    pitchHz: Maybe<number>;
    vocalTractLengthCm: Maybe<number>;
    constructor(
        opts: IAudioRecorderAnalysisOutputCtorOpts
    ) {
        Object.assign(this, opts)
    }
}
