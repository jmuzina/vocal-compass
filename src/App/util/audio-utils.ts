import { SPEED_OF_SOUND } from '../constants/Audio';
import { AudioRecorderAnalysisOutput } from '../models/Audio/AnalysisOutput';
import { type Maybe } from '../models/Maybe';

export const calculatePitchFromFloat32 = (signal: Float32Array, sampleRate: number): Maybe<number> => {
    const pitchDetectionThreshold = 0.25;

    const peakIndex = findPeakIndex(signal, pitchDetectionThreshold);

    if (peakIndex === -1) return;

    const hertzPerBin = sampleRate / 2 / signal.length;
    return peakIndex * hertzPerBin;
};

export const findPeakIndex = (signal: Float32Array, threshold: number = 0.0): number => {
    let maxAmplitude = -Infinity;
    let peakIndex = -1;

    for (let i = 0; i < signal.length; ++i) {
        const amplitude = signal[i];

        if (amplitude > threshold && amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
            peakIndex = i;
        }
    }

    // Interpolate the peak index for higher accuracy
    if (peakIndex > 0 && peakIndex < signal.length - 1) {
        const prevAmplitude = signal[peakIndex - 1];
        const nextAmplitude = signal[peakIndex + 1];

        const interpolatedIndex = peakIndex + (0.5 * (prevAmplitude - nextAmplitude)) / (prevAmplitude - 2 * maxAmplitude + nextAmplitude);

        return interpolatedIndex;
    }

    return peakIndex;
};

export const float32ToUint8 = (signal: Float32Array): Uint8Array => {
    const uint8Array = new Uint8Array(signal.length);

    for (let i = 0; i < signal.length; ++i) {
        const value = (signal[i] + 1) * 128;
        uint8Array[i] = Math.min(255, Math.max(0, value));
    }

    return uint8Array;
};

export const uint8ToFloat32 = (signal: Uint8Array): Float32Array => {
    const floatArray = new Float32Array(signal.length);

    for (let i = 0; i < signal.length; i++) {
        floatArray[i] = (signal[i] - 128) / 128.0;
    }

    return floatArray;
};

export const getVocalTractLength = (firstFormantHz: number): Maybe<number> => {
    // Calculate vocal tract length in meters
    const vocalTractLength = SPEED_OF_SOUND / (2 * firstFormantHz);

    // Convert vocal tract length to centimeters
    const vocalTractLengthInCentimeters = vocalTractLength * 100;

    return vocalTractLengthInCentimeters;
}

export const calculateFormantFrequency = (
    signal: Float32Array,
    lpcOrder = 10
): Maybe<number> => {
    // @todo  Perform LPC analysis on `signal` idek how but this is the key to the whole thing

    const formantFrequencies = [110, 220, 330, 440];

    if (!formantFrequencies.length) return;

    const firstFormantHz = formantFrequencies[0];

    // Get the pitch of the first formant
    return firstFormantHz
};

export const analyzeAudio = (
    signal: Float32Array,
    sampleRate: number
): AudioRecorderAnalysisOutput => {
    const pitchHz = calculatePitchFromFloat32(signal, sampleRate);
    const firstFormantHz = calculateFormantFrequency(signal);
    const vocalTractLengthCm = (firstFormantHz !== undefined && firstFormantHz !== null) ? getVocalTractLength(firstFormantHz) : undefined;

    return new AudioRecorderAnalysisOutput({ pitchHz, vocalTractLengthCm });
};

export const nodesAreConnected = (node1: AudioNode, node2: AudioNode): boolean => {
    return node1.context === node2.context;
}
