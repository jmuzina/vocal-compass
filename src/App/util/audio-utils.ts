import { SPEED_OF_SOUND } from '../constants/Audio';
import { AudioRecorderAnalysisOutput } from '../models/Audio/AnalysisOutput';
import { type Maybe } from '../models/Maybe';
import { movingAverage, typedArrayToNumberArray } from './array-utils';

export const calculatePitchFromFloat32 = (floatSignal: Float32Array, sampleRate: number): Maybe<number> => {
    const pitchDetectionThreshold = 0.25;

    const peakIndex = findPeakIndex(floatSignal, pitchDetectionThreshold);

    if (peakIndex === -1) return;

    const hertzPerBin = sampleRate / 2 / floatSignal.length;
    return peakIndex * hertzPerBin;
};

export const findPeakIndex = (floatSignal: Float32Array, threshold: number = 0.0): number => {
    let maxAmplitude = -Infinity;
    let peakIndex = -1;

    for (let i = 0; i < floatSignal.length; ++i) {
        const amplitude = floatSignal[i];

        if (amplitude > threshold && amplitude > maxAmplitude) {
            maxAmplitude = amplitude;
            peakIndex = i;
        }
    }

    // Interpolate the peak index for higher accuracy
    if (peakIndex > 0 && peakIndex < floatSignal.length - 1) {
        const prevAmplitude = floatSignal[peakIndex - 1];
        const nextAmplitude = floatSignal[peakIndex + 1];

        const interpolatedIndex = peakIndex + (0.5 * (prevAmplitude - nextAmplitude)) / (prevAmplitude - 2 * maxAmplitude + nextAmplitude);

        return interpolatedIndex;
    }

    return peakIndex;
};

export const float32ToUint8 = (floatSignal: Float32Array): Uint8Array => {
    const uint8Array = new Uint8Array(floatSignal.length);

    for (let i = 0; i < floatSignal.length; ++i) {
        const value = (floatSignal[i] + 1) * 128;
        uint8Array[i] = Math.min(255, Math.max(0, value));
    }

    return uint8Array;
};

export const uint8ToFloat32 = (byteSignal: Uint8Array): Float32Array => {
    const floatArray = new Float32Array(byteSignal.length);

    for (let i = 0; i < byteSignal.length; i++) {
        floatArray[i] = (byteSignal[i] - 128) / 128.0;
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

/**
 * Find peaks in an array with segments of increasing size.
 * credit https://github.com/SumianVoice/spectrus-js-the-second
 * This function keeps increasing the size of the segment exponentially and maintains the largest
 * value for the current segment.
 * @param {Uint8Array} data Input array of length n.
 * @param {number} baseSegmentSize Initial segment size, or the smallest possible unit of size.
 * @param {number} logPeaksScale Initial
 * @returns {Array} Array of peaks and indices.
 */
export const getPeaks = (data: number[], baseSegmentSize: number, logPeaksScale: number): number[][] => {
    let segmentSize = baseSegmentSize;
    let curSegment = 1;
    let segmentStart = 0;

    const peaks = new Array(0); // make a blank array for adding to later

    let tmpPeakIndex = 0;
    let tmpPeakValue = 0;
    peaks.push([1, 10]);
    for (let k = 0; k < data.length; k++) {
        // tmpPeakIndex = k;
        if (data[k] >= tmpPeakValue) {
            tmpPeakIndex = k;
            tmpPeakValue = data[k];
        }

        if (k >= segmentStart + segmentSize) { // when you get to the end of the segment
            peaks.push([tmpPeakIndex, tmpPeakValue]);

            segmentSize = (curSegment ** logPeaksScale) * baseSegmentSize;
            segmentStart = k;
            curSegment++;
            tmpPeakValue = 0;
        }
    }

    return peaks;
}

// credit https://github.com/SumianVoice/spectrus-js-the-second
export const getFormants = (signal: number[][], formantCount = 3): number[][] => {
    const newFormants = Array(formantCount + 1).fill([0, 0, 0]);

    let avgPos = 0;
    let totalDiv = 0;
    const tmpExp = 40;
    for (let i = 1; i < signal.length - 1; ++i) {
        if (signal[i][1] > newFormants[0][1]) {
            if (signal[i - 1][1] < signal[i][1] && signal[i][1] > signal[i + 1][1]) {
                avgPos = 0;
                totalDiv = 0;
                for (let l = -1; l < 2; l++) {
                    avgPos += signal[(i + l)][0] * signal[i + l][1] ** tmpExp;
                    totalDiv += signal[i + l][1] ** tmpExp;
                }
                avgPos /= totalDiv;
                newFormants.shift();
                newFormants.push([avgPos, signal[i][1], 1]);
            }
        }
    }

    return newFormants;
}

// credit https://github.com/SumianVoice/spectrus-js-the-second/blob/main/js/spectrogram/Spectrogram.js
export const calculateFormants = (
    signal: Float32Array,
    formantCount = 10
): number[][] => {
    const movAvg = movingAverage(
        movingAverage(typedArrayToNumberArray(signal), 20),
        10
    );
    const movAvgPeaks = getPeaks(movAvg, 6, 1);
    return getFormants(movAvgPeaks, formantCount)
}

// credit https://github.com/SumianVoice/spectrus-js-the-second/blob/main/js/spectrogram/Spectrogram.js
export const calculateFirstFormantFrequency = (
    signal: Float32Array
): Maybe<number> => {
    const formants = calculateFormants(signal, 1);

    if (!formants.length) return;

    const [[firstFormantHz]] = formants;

    return firstFormantHz
};

export const calculateVocalTractLength = (
    firstFormantHz: number
): number => {
    return SPEED_OF_SOUND / (2 * firstFormantHz);
}

export const analyzeAudio = (
    signal: Float32Array,
    sampleRate: number
): AudioRecorderAnalysisOutput => {
    const pitchHz = calculatePitchFromFloat32(signal, sampleRate);
    const firstFormantHz = calculateFirstFormantFrequency(signal);
    const vocalTractLengthCm = (firstFormantHz !== null && firstFormantHz !== undefined) ? calculateVocalTractLength(firstFormantHz) : undefined;

    return new AudioRecorderAnalysisOutput({ pitchHz, vocalTractLengthCm });
};

export const nodesAreConnected = (node1: AudioNode, node2: AudioNode): boolean => {
    return node1.context === node2.context;
}
