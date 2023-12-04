import { type IAudioRecorderAnalysisOutput } from '../models/AudioRecorder';
import { clamp } from './math-utils';

import FFT from 'fft.js';

export const calculatePitchFromFloat32 = (float32Array: Float32Array, sampleRate: number): number => {
    const pitchDetectionThreshold = 0.2;

    const peakIndex = findPeakIndex(float32Array, pitchDetectionThreshold);

    if (peakIndex !== -1) {
        const hertzPerBin = sampleRate / 2 / float32Array.length;
        return peakIndex * hertzPerBin;
    }

    return -1; // No peak found
};

export const calculatePitchFromUint8 = (uint8Array: Uint8Array, sampleRate: number): number => {
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

// export const calculateLPCCoefficients = (frequencyData: Float32Array, order: number): Float32Array => {
//     const numCoefficients = order + 1;

//     // Autocorrelation calculation
//     const autocorrelation = new Float32Array(numCoefficients);

//     for (let i = 0; i < numCoefficients; i++) {
//         let sum = 0;

//         for (let j = 0; j < frequencyData.length - i; j++) {
//             sum += frequencyData[j] * frequencyData[j + i];
//         }

//         autocorrelation[i] = sum;
//     }

//     // Levinson-Durbin recursion
//     const lpcCoefficients = new Float32Array(numCoefficients).fill(0);

//     let error = autocorrelation[0];

//     for (let i = 1; i < numCoefficients; i++) {
//         let lambda = autocorrelation[i];

//         for (let j = 1; j < i; j++) {
//             lambda -= lpcCoefficients[j] * autocorrelation[i - j];
//         }

//         const alpha = lambda / error;

//         lpcCoefficients[i] = alpha;

//         for (let j = 1; j <= i / 2; j++) {
//             const tmp = lpcCoefficients[j];
//             lpcCoefficients[j] -= alpha * lpcCoefficients[i - j];
//             lpcCoefficients[i - j] -= alpha * tmp;
//         }

//         error *= 1 - alpha * alpha;
//     }

//     return lpcCoefficients.map((coefficient) => clamp(coefficient, -1, 1))
// };

// export const calculateLPCCoefficients = (frequencyData: Float32Array, order: number): Float32Array => {
//     const numCoefficients = order + 1;

//     // Autocorrelation calculation
//     const autocorrelation = new Float32Array(numCoefficients);

//     for (let i = 0; i < numCoefficients; i++) {
//         for (let j = 0; j < frequencyData.length - i; j++) {
//             autocorrelation[i] += frequencyData[j] * frequencyData[j + i];
//         }
//     }

//     // Levinson-Durbin recursion
//     const lpcCoefficients = new Float32Array(numCoefficients).fill(0);
//     const reflectionCoefficients = new Float32Array(numCoefficients);

//     let error = autocorrelation[0];

//     for (let i = 1; i < numCoefficients; i++) {
//         let lambda = autocorrelation[i];

//         for (let j = 1; j < i; j++) {
//             lambda -= lpcCoefficients[j] * autocorrelation[i - j];
//         }

//         const alpha = lambda / error;

//         reflectionCoefficients[i] = alpha;

//         for (let j = 1; j <= i; j++) {
//             lpcCoefficients[j] += alpha * lpcCoefficients[i - j];
//         }

//         error *= 1 - alpha * alpha;
//     }

//     return reflectionCoefficients.map((coefficient) => clamp(coefficient, -1, 1))
// };

export const calculateLPCCoefficients = (audioSignal: Float32Array, order: number): number[] => {
    const numCoefficients = order + 1;

    // Autocorrelation calculation
    const autocorrelation = new Float32Array(numCoefficients);

    for (let i = 0; i < numCoefficients; i++) {
        let sum = 0;

        for (let j = 0; j < audioSignal.length - i; j++) {
            sum += audioSignal[j] * audioSignal[j + i];
        }

        autocorrelation[i] = sum;
    }

    // Levinson-Durbin recursion
    const lpcCoefficients = new Float32Array(numCoefficients).fill(0);

    let error = autocorrelation[0];

    for (let i = 1; i < numCoefficients; i++) {
        let lambda = autocorrelation[i];

        for (let j = 1; j < i; j++) {
            lambda -= lpcCoefficients[j] * autocorrelation[i - j];
        }

        const alpha = lambda / error;

        lpcCoefficients[i] = alpha;

        for (let j = 1; j <= i / 2; j++) {
            const tmp = lpcCoefficients[j];
            lpcCoefficients[j] -= alpha * lpcCoefficients[i - j];
            lpcCoefficients[i - j] -= alpha * tmp;
        }

        error *= 1 - alpha * alpha;
    }

    // Ensure coefficients are within the valid range [-1, 1]
    const clampedCoefficients = lpcCoefficients.map((coefficient) => clamp(coefficient, -1, 1));

    // Convert to a regular number[] array
    const coefficientsArray: number[] = Array.from(clampedCoefficients);

    return coefficientsArray;
};

export const calculateFormantFrequency = (
    signal: Float32Array,
    sampleRate: number,
    fftSize: number
): number => {
    // Perform Fast Fourier Transform (FFT) to get the frequency spectrum
    const fft = new FFT(fftSize);
    const spectrum = new Float32Array(signal.length);

    // Copy audioSignal into spectrum and apply Hann window
    for (let i = 0; i < signal.length; i++) {
        const cosArg = (2 * Math.PI * i) / (signal.length - 1);
        const hannWindow = 0.5 * (1 - Math.cos(cosArg));
        spectrum[i] = signal[i] * hannWindow;
    }

    const out = fft.createComplexArray();

    // Zero-fill the imaginary part
    for (let i = 0; i < fftSize; i++) {
        out[i * 2 + 1] = 0;
    }

    fft.realTransform(spectrum, out);

    // Find the index of the maximum value in the spectrum
    let maxIndex = 0;
    let maxValue = spectrum[0];

    for (let i = 1; i < spectrum.length; i++) {
        if (spectrum[i] > maxValue) {
            maxValue = spectrum[i];
            maxIndex = i;
        }
    }

    // Convert the index to frequency using the Nyquist frequency
    const nyquist = sampleRate / 2;
    const frequency = (maxIndex / signal.length) * nyquist;

    // console.log({ signal, sampleRate, fftSize, fft, spectrum, out, maxIndex, maxValue, nyquist, frequency });

    return frequency;
};

export const analyzeAudio = (
    analyzer: AnalyserNode,
    sampleRate: number,
    buff: Uint8Array = new Uint8Array(analyzer.frequencyBinCount)
): IAudioRecorderAnalysisOutput => {
    analyzer.getByteFrequencyData(buff);

    const pitchHz = calculatePitchFromUint8(buff, sampleRate);

    return { pitchHz, firstFormantHz: 0 };
};

export const nodesAreConnected = (node1: AudioNode, node2: AudioNode): boolean => {
    return node1.context === node2.context;
}
