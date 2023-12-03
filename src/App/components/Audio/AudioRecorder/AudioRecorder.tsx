import './AudioRecorder.scss';
import React, { useState, useEffect, type FC } from 'react';
import { type Maybe } from '../../../models/Maybe';
import { formatTime } from '../../../util/time-utils';
import moment from 'moment';
import MicOff from '@mui/icons-material/MicOff';
import Mic from '@mui/icons-material/Mic';
import { Button } from 'primereact/button';
import { toast } from 'react-toastify';
import { type IAudioRecorderAudioCompletionOutput } from '../../../models/AudioRecorder';

interface AudioRecorderProps {
    recording: boolean
    onRecordingChange: (isRecording: boolean) => void
    onRecordingCompleted: (output: IAudioRecorderAudioCompletionOutput) => void
    disabled?: boolean
}

const AudioRecorder: FC<AudioRecorderProps> = ({ onRecordingChange, onRecordingCompleted, disabled, recording: parentRecording }) => {
    const [recording, setRecording] = useState(parentRecording);
    const [loading, setLoading] = useState(false);
    const [audioCtx, setAudioCtx] = useState<Maybe<AudioContext>>(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [startRecordingTime, setStartRecordingTime] = useState<Maybe<moment.Moment>>(undefined);
    const [stream, setStream] = useState<Maybe<MediaStream>>(undefined);
    const [microphone, setMicrophone] = useState<Maybe<MediaStreamAudioSourceNode>>(undefined);
    const [analyzer, setAnalyzer] = useState<Maybe<AnalyserNode>>(undefined);
    const [recorder, setRecorder] = useState<Maybe<MediaRecorder>>(undefined);
    const [recordingSummaryText, setRecordingSummaryText] = useState<string>('');
    const [summaryUpdateInterval, setSummaryUpdateInterval] = useState<Maybe<NodeJS.Timeout>>(undefined);
    const [enqueuedFullAudioBuffData, setEnqueuedFullAudioBuffData] = useState<Maybe<IAudioRecorderAudioCompletionOutput>>(undefined);

    // Stop playing audio when mic state changes
    useEffect(
        () => {
            const recordingUpdatePromise = recording ? startRecording() : stopRecording();
            recordingUpdatePromise
                .then(() => onRecordingChange(recording))
                .catch((err) => {
                    toast.error((err as Error)?.message);
                    onRecordingChange(false);
                });
        },
        [recording]
    );

    useEffect(() => {
        if (enqueuedFullAudioBuffData) {
            onRecordingCompleted(enqueuedFullAudioBuffData);
            setEnqueuedFullAudioBuffData(undefined);
        }
    }, [enqueuedFullAudioBuffData])

    /** @returns Summarization of the in-progress recording length. Intended to update every second to show how long you've been speaking. */
    const getRecordingSummaryText = (): string => {
        let retVal = '';
        setStartRecordingTime((lastStartRecordingTime) => {
            setRecording((lastRecording) => {
                if (lastRecording && lastStartRecordingTime?.isValid()) retVal = formatTime(moment().diff(lastStartRecordingTime, 'milliseconds') / 1000);
                return lastRecording;
            })
            return lastStartRecordingTime;
        });
        return retVal;
    }

    /** Clear the in-progress recording length summary text */
    const clearSummaryInterval = (): void => {
        setRecordingSummaryText('');
        if (summaryUpdateInterval) {
            clearInterval(summaryUpdateInterval);
            setSummaryUpdateInterval(undefined);
        }
    }

    /** Clear the in-progress recording length summary text and create a new timer for it */
    const restartSummaryInterval = (): void => {
        clearSummaryInterval();
        // Update the recording summary text every second
        setSummaryUpdateInterval(setInterval(() => {
            setRecordingSummaryText(getRecordingSummaryText());
        }, 1000))
        // Also give the summary text a good initial value for visual consistency
        setRecordingSummaryText('00:00');
    }

    const processAudioBlobEvent = ($evt: BlobEvent): void => {
        setStartRecordingTime((lastStartRecordingTime) => {
            setEnqueuedFullAudioBuffData({ audio: $evt.data, durationSecs: moment().diff(lastStartRecordingTime, 'milliseconds') / 1000 });
            return lastStartRecordingTime;
        })
    }

    const startRecording = async (): Promise<void> => {
        try {
            clearSummaryInterval();
            setLoading(true);
            const newCtx = new window.AudioContext();
            const newAnalyzer = newCtx.createAnalyser();
            newAnalyzer.fftSize = 2048;

            const bufferLength = newAnalyzer.frequencyBinCount;
            const slidingWindowAudioBuffer = new Uint8Array(bufferLength);

            // Request microphone access
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const newMicrophone = newCtx.createMediaStreamSource(newStream);
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

            const processAudio = (): void => {
                setRecording((latestMicOn) => {
                    if (!latestMicOn) {
                        // Stop processing if the microphone is turned off
                        void stopRecording();
                    } else {
                        newAnalyzer.getByteFrequencyData(slidingWindowAudioBuffer);

                        // @todo analyze `slidingWindowAudioBuffer` and update the compass graphic
                        // Some type of FFT analysis needed to figure out resonance.
                        // Pitch anaysis is much more straightforward

                        requestAnimationFrame(() => processAudio());
                    }

                    return latestMicOn;
                });
            };

            processAudio();

            await newCtx.resume();
        // Microphone permission rejected or no devices found
        } catch (err) {
            toast.error((err as Error)?.message);
            await stopRecording();
        } finally {
            setLoading(false);
        }
    }

    const stopRecording = async (): Promise<void> => {
        // Clear resources and disconnect microphone and analyzer
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(undefined);
        }

        if (audioCtx && audioCtx.state !== 'closed') await audioCtx.close();

        if (microphone) setMicrophone(undefined);

        if (analyzer) setAnalyzer(undefined);

        if (recorder) {
            recorder.stop();
            setRecorder(undefined);
        }

        clearSummaryInterval();
    }

    const micButton = (): JSX.Element => {
        const baseMicButtonClass = 'mic-button';
        const micButtonClass = (): string => `${baseMicButtonClass} p-button-rounded p-button-${recording ? 'danger active' : 'outlined'}`;
        const micIcon = (): JSX.Element | string => {
            if (loading) return 'pi pi-spin pi-spinner';
            if (recording) return <Mic/>;
            return <MicOff/>;
        }
        const recordingSummary = (): JSX.Element => {
            if (!recording) return <></>;
            return (
                <span className="recording-in-progress-summary">{recordingSummaryText}</span>
            )
        }
        return (
            <div className='microphone-button-wrapper flex flex-row justify-content-start align-items-center'>
                <Button
                    className={micButtonClass()}
                    disabled={disabled}
                    icon={micIcon()}
                    onClick={() => setRecording(!recording)}
                />
                {recordingSummary()}
            </div>
        );
    };

    // Calculate initially in ms then divide to get more precise figure, making the time scrubber more precise
    // const durationInSecs = (endRecordingTime?.diff(startRecordingTime, 'milliseconds') ?? 0) / 1000;

    return micButton();
}

export default AudioRecorder;
