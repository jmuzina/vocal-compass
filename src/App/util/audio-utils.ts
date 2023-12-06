import { SPEED_OF_SOUND } from '../constants/Audio';
import { AudioRecorderAnalysisOutput } from '../models/Audio/AnalysisOutput';
import { type Maybe } from '../models/Maybe';

export const calculatePitchFromFloat32 = (float32Array: Float32Array, sampleRate: number): Maybe<number> => {
    const pitchDetectionThreshold = 0.2;

    const peakIndex = findPeakIndex(float32Array, pitchDetectionThreshold);

    if (peakIndex !== -1) {
        const hertzPerBin = sampleRate / 2 / float32Array.length;
        return peakIndex * hertzPerBin;
    }

    return;
};

export const calculatePitchFromUint8 = (uint8Array: Uint8Array, sampleRate: number): Maybe<number> => {
    const float32Array = new Float32Array(uint8Array);
    return calculatePitchFromFloat32(float32Array, sampleRate);
};

export const findPeakIndex = (frequencyData: Float32Array, threshold?: number): number => {
    let maxAmplitude = -Infinity;
    let peakIndex = -1;

    for (let i = 0; i < frequencyData.length; i++) {
        const amplitude = frequencyData[i];

        if ((threshold === undefined || threshold === null || amplitude > threshold) && amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
            peakIndex = i;
        }
    }

    return peakIndex;
};

export const float32ToUint8 = (floatArray: Float32Array): Uint8Array => {
    const uint8Array = new Uint8Array(floatArray.length);

    for (let i = 0; i < floatArray.length; i++) {
        const value = (floatArray[i] + 1) * 128;
        uint8Array[i] = Math.min(255, Math.max(0, value));
    }

    return uint8Array;
};

export const uint8ToFloat32 = (uint8Array: Uint8Array): Float32Array => {
    const floatArray = new Float32Array(uint8Array.length);

    for (let i = 0; i < uint8Array.length; i++) {
        floatArray[i] = (uint8Array[i] - 128) / 128.0;
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
    signal: Uint8Array,
    lpcOrder = 10
): Maybe<number> => {
    // Convert Uint8Array to Float32Array
    const floatSignal = uint8ToFloat32(signal);

    // @todo  Perform LPC analysis on `floatSignal` idek how but this is the key to the whole thing

    const formantFrequencies = [110, 220, 330, 440];

    if (!formantFrequencies.length) return;

    const firstFormantHz = formantFrequencies[0];

    // Get the pitch of the first formant
    return firstFormantHz
};

export const analyzeAudio = (
    analyzer: AnalyserNode,
    sampleRate: number,
    buff: Uint8Array = new Uint8Array(analyzer.frequencyBinCount)
): AudioRecorderAnalysisOutput => {
    analyzer.getByteFrequencyData(buff);

    const pitchHz = calculatePitchFromUint8(buff, sampleRate);
    const firstFormantHz = calculateFormantFrequency(buff);
    const vocalTractLengthCm = (firstFormantHz !== undefined && firstFormantHz !== null) ? getVocalTractLength(firstFormantHz) : undefined;

    const analysis = new AudioRecorderAnalysisOutput({ pitchHz, vocalTractLengthCm });

    return analysis;
};

export const nodesAreConnected = (node1: AudioNode, node2: AudioNode): boolean => {
    return node1.context === node2.context;
}
