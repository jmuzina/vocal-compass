/* eslint-disable @typescript-eslint/no-unused-vars */
import './AudioRecorder.scss';
import React, { type FC, useEffect, useState } from 'react';
import { type Maybe } from '../../../models/Maybe';
import { formatTime } from '../../../util/time-utils';
import moment from 'moment';
import MicOff from '@mui/icons-material/MicOff';
import Mic from '@mui/icons-material/Mic';
import { Button } from 'primereact/button';
import { toast } from 'react-toastify';
import { AudioRecorderAudioCompletionOutput } from '../../../models/Audio/CompletionOutput';
import { type AudioRecorderAnalysisOutput } from '../../../models/Audio/AnalysisOutput';
import { readBlobAsTypedArray } from '../../../util/blob-utils';
import AsyncUtils from '../../../util/async-utils';
import audioUtils from '../../../util/audio-utils';

interface AudioRecorderProps {
    recording: boolean
    onRecordingChange: (isRecording: boolean) => void
    onRecordingCompleted?: (output: AudioRecorderAudioCompletionOutput) => void
    onNewAnalysisAvailable?: (output: AudioRecorderAnalysisOutput) => void
    disabled?: boolean
}

const AudioRecorder: FC<AudioRecorderProps> = ({
    onRecordingChange,
    onRecordingCompleted,
    onNewAnalysisAvailable,
    disabled,
    recording: parentRecording
}) => {
    const [recording, setRecording] = useState(parentRecording);
    const [loading, setLoading] = useState(false);
    const [audioCtx, setAudioCtx] = useState<Maybe<AudioContext>>(undefined);
    const [startRecordingTime, setStartRecordingTime] =
    useState<Maybe<moment.Moment>>(undefined);
    const [stream, setStream] = useState<Maybe<MediaStream>>(undefined);
    const [microphone, setMicrophone] =
    useState<Maybe<MediaStreamAudioSourceNode>>(undefined);
    const [analyzer, setAnalyzer] = useState<Maybe<AnalyserNode>>(undefined);
    const [recorder, setRecorder] = useState<Maybe<MediaRecorder>>(undefined);
    const [recordingSummaryText, setRecordingSummaryText] = useState<string>('');
    const [summaryUpdateInterval, setSummaryUpdateInterval] =
    useState<Maybe<NodeJS.Timeout>>(undefined);
    const [enqueuedFullAudioBuffData, setEnqueuedFullAudioBuffData] =
    useState<Maybe<AudioRecorderAudioCompletionOutput>>(undefined);
    const [analyzingAudio, setAnalyzingAudio] = useState(false);

    // Stop playing audio when mic state changes
    useEffect(() => {
        const prm = recording ? startRecording() : stopRecording();

        void prm
            .then(async () => await AsyncUtils.getLatestState(setRecording))
            .then((latestRecording) => onRecordingChange(latestRecording));
    }, [recording]);

    useEffect(() => {
        if (enqueuedFullAudioBuffData) {
            if (onRecordingCompleted) onRecordingCompleted(enqueuedFullAudioBuffData);
            else setEnqueuedFullAudioBuffData(undefined);
        }
    }, [enqueuedFullAudioBuffData]);

    const toggleRecording = async (): Promise<void> => {
        const currentRecording = await AsyncUtils.getLatestState(setRecording);
        setRecording(!currentRecording);
    };

    /** @returns Summarization of the in-progress recording length. Intended to update every second to show how long you've been speaking. */
    const getRecordingSummaryText = async (): Promise<string> => {
        let lastRecordingTime: Maybe<moment.Moment> = moment();
        let lastRecording = false;
        await Promise.all([
            AsyncUtils.getLatestState(setStartRecordingTime).then((t) => {
                lastRecordingTime = t;
            }),
            AsyncUtils.getLatestState(setRecording).then((r) => {
                lastRecording = r;
            })
        ]);
        if (lastRecording && lastRecordingTime?.isValid()) {
            return formatTime(
                moment().diff(lastRecordingTime, 'milliseconds') / 1000
            );
        }

        return '';
    };

    /** Clear the in-progress recording length summary text */
    const clearSummaryInterval = (): void => {
        setRecordingSummaryText('');
        if (summaryUpdateInterval) {
            clearInterval(summaryUpdateInterval);
            setSummaryUpdateInterval(undefined);
        }
    };

    /** Clear the in-progress recording length summary text and create a new timer for it */
    const restartSummaryInterval = (): void => {
        clearSummaryInterval();
        // Update the recording summary text every second
        setSummaryUpdateInterval(
            setInterval(() => {
                void getRecordingSummaryText().then((summaryText) =>
                    setRecordingSummaryText(summaryText)
                );
            }, 1000)
        );
        // Also give the summary text a good initial value for visual consistency
        setRecordingSummaryText('00:00');
    };

    const processAudioBlobEvent = async (
        $evt: BlobEvent
    ): Promise<Maybe<AudioRecorderAudioCompletionOutput>> => {
        let latestAnalyzer: Maybe<AnalyserNode>;
        let latestAudioCtx: Maybe<AudioContext>;
        await Promise.all([
            AsyncUtils.getLatestState(setAnalyzer).then((a) => {
                latestAnalyzer = a;
            }),
            AsyncUtils.getLatestState(setAudioCtx).then((c) => {
                latestAudioCtx = c;
            })
        ]);
        if (!latestAnalyzer || !latestAudioCtx) return;

        let lastStartRecordingTime: Maybe<moment.Moment> = moment();
        let rawBuf = new Float32Array(latestAnalyzer.frequencyBinCount);
        await Promise.all([
            AsyncUtils.getLatestState(setStartRecordingTime).then((t) => {
                lastStartRecordingTime = t;
            }),
            readBlobAsTypedArray<Float32Array>($evt.data, Float32Array).then((b) => {
                rawBuf = b;
            })
        ]);

        const output: AudioRecorderAudioCompletionOutput =
      new AudioRecorderAudioCompletionOutput({
          audio: $evt.data,
          durationSecs:
          moment().diff(lastStartRecordingTime, 'milliseconds') / 1000,
          raw: rawBuf,
          analyzer: latestAnalyzer,
          ctx: latestAudioCtx,
          fromChild: true
      });
        setEnqueuedFullAudioBuffData(output);
        return output;
    };

    const startRecording = async (): Promise<void> => {
        try {
            clearSummaryInterval();
            setLoading(true);
            const newCtx = audioCtx ?? new window.AudioContext();
            if (audioCtx?.state !== 'running') await newCtx.resume();
            const newAnalyzer = newCtx.createAnalyser();
            newAnalyzer.fftSize = 2048;

            const bufferLength = newAnalyzer.frequencyBinCount;
            const slidingWindowAudioBuffer = new Float32Array(bufferLength);

            // Request microphone access
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const newMicrophone = newCtx.createMediaStreamSource(newStream);
            const sampleRate = newStream.getAudioTracks()[0].getSettings()
                .sampleRate as number;
            newMicrophone.connect(newAnalyzer);

            // Save audio to buffer on completion
            const newRecorder = new MediaRecorder(newStream);
            newRecorder.ondataavailable = processAudioBlobEvent;

            newRecorder.start();

            setStream(newStream);
            setAudioCtx(newCtx);
            setMicrophone(newMicrophone);
            setAnalyzer(newAnalyzer);
            setRecorder(newRecorder);
            setStartRecordingTime(moment());
            restartSummaryInterval();

            const processAudio = async (): Promise<void> => {
                const latestAnalyzingAudio =
          await AsyncUtils.getLatestState(setAnalyzingAudio);
                if (latestAnalyzingAudio) return;
                const latestIsRecording = await AsyncUtils.getLatestState(setRecording);
                const latestAnalyzer = await AsyncUtils.getLatestState(setAnalyzer);
                if (!latestIsRecording || !latestAnalyzer) {
                    // Stop processing if the microphone is turned off
                    return await stopRecording();
                }
                setAnalyzingAudio(true);

                latestAnalyzer.getFloatFrequencyData(slidingWindowAudioBuffer);

                const analysis = audioUtils.analyzeAudio(
                    slidingWindowAudioBuffer,
                    sampleRate
                );
                console.log(analysis);
                if (onNewAnalysisAvailable) onNewAnalysisAvailable(analysis);

                // Wait for the next animation frame to process the next audio buffer
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });

                setAnalyzingAudio(false);
                return await processAudio();
            };

            void processAudio();

            await newCtx.resume();
            // Microphone permission rejected or no devices found
        } catch (err) {
            toast.error((err as Error)?.message);
            void stopRecording();
        } finally {
            setLoading(false);
        }
    };

    const stopRecording = async (): Promise<void> => {
    // Clear resources and disconnect microphone and analyzer

        const streamUpdate = AsyncUtils.getLatestState(setStream).then(
            (latestStream) => {
                if (latestStream) {
                    latestStream.getTracks().forEach((track) => track.stop());
                    setStream(undefined);
                }
            }
        );

        const ctxUpdate = AsyncUtils.getLatestState(setAudioCtx).then(
            async (latestAudioCtx) => {
                if (latestAudioCtx && latestAudioCtx.state !== 'suspended') {
                    return await latestAudioCtx.suspend();
                }
            }
        );

        const micUpdate = AsyncUtils.getLatestState(setMicrophone).then(
            async (latestMicrophone) => {
                if (latestMicrophone) {
                    const latestMicrophoneAnalyzer =
            await AsyncUtils.getLatestState(setAnalyzer);

                    if (
                        latestMicrophoneAnalyzer &&
            audioUtils.nodesAreConnected(
                latestMicrophone,
                latestMicrophoneAnalyzer
            )
                    ) {
                        try {
                            latestMicrophone?.disconnect(latestMicrophoneAnalyzer);
                        } catch (err) {
                            // do nothing. They were already disconnected, but nodesAreConnected is currently imperfect
                        }
                    }
                    setMicrophone(undefined);
                }
            }
        );

        const recorderUpdate = AsyncUtils.getLatestState(setRecorder).then(
            async (latestRecorder) => {
                if (latestRecorder) {
                    latestRecorder.stop();
                    setRecorder(undefined);
                }
            }
        );

        await Promise.all([streamUpdate, ctxUpdate, micUpdate, recorderUpdate]);

        clearSummaryInterval();
    };

    const micButton = (): JSX.Element => {
        const baseMicButtonClass = 'mic-button';
        const micButtonClass = (): string =>
            `${baseMicButtonClass} p-button-rounded p-button-${
                recording ? 'danger active' : 'outlined'
            }`;
        const micIcon = (): JSX.Element | string => {
            if (loading) return 'pi pi-spin pi-spinner';
            if (recording) return <Mic />;
            return <MicOff />;
        };
        const recordingSummary = (): JSX.Element => {
            if (!recording) return <></>;
            return (
                <span className="recording-in-progress-summary">
                    {recordingSummaryText}
                </span>
            );
        };
        return (
            <div className="microphone-button-wrapper flex flex-row justify-content-start align-items-center">
                <Button
                    className={micButtonClass()}
                    disabled={disabled}
                    icon={micIcon()}
                    onClick={() => {
                        void toggleRecording();
                    }}
                />
                {recordingSummary()}
            </div>
        );
    };

    // Calculate initially in ms then divide to get more precise figure, making the time scrubber more precise
    // const durationInSecs = (endRecordingTime?.diff(startRecordingTime, 'milliseconds') ?? 0) / 1000;

    return micButton();
};

export default AudioRecorder;
