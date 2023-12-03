import React, { useEffect, useState } from 'react';
import './Compass.scss';
import Quadrant from './Quadrant/Quadrant';
import Axis from './Axis/Axis';
import { Button } from 'primereact/button';
import Mic from '@mui/icons-material/Mic';
import MicOff from '@mui/icons-material/MicOff';
import { toast } from 'react-toastify';
import { type Maybe } from '../../models/Maybe';
import moment from 'moment';
import AudioPlayer from '../AudioPlayer/AudioPlayer';
import { formatTime } from '../../util/time-utils';

/** Size in em of the axes. This is the width for the vertical axis, height for the horizontal axis. */
const AXIS_SIZE = 0.5;

export default function Compass(): JSX.Element {
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [audioCtx, setAudioCtx] = useState<Maybe<AudioContext>>(undefined);
    const [startRecordingTime, setStartRecordingTime] = useState<Maybe<moment.Moment>>(undefined);
    const [endRecordingTime, setEndRecordingTime] = useState<Maybe<moment.Moment>>(undefined);
    const [stream, setStream] = useState<Maybe<MediaStream>>(undefined);
    const [microphone, setMicrophone] = useState<Maybe<MediaStreamAudioSourceNode>>(undefined);
    const [analyzer, setAnalyzer] = useState<Maybe<AnalyserNode>>(undefined);
    const [audioBuffer, setAudioBuffer] = useState<Maybe<Blob>>();
    const [recorder, setRecorder] = useState<Maybe<MediaRecorder>>(undefined);
    const [playCurPos, setPlayCurPos] = useState<number>(0);
    const [recordingSummaryText, setRecordingSummaryText] = useState<string>('');
    const [summaryUpdateInterval, setSummaryUpdateInterval] = useState<Maybe<NodeJS.Timeout>>(undefined);

    // Stop playing audio when mic state changes
    useEffect(
        () => {
            setPlaying(false);
            if (recording) void startRecording();
            else void stopRecording();
        },
        [recording]
    );

    // Stop recording when you start playing audio
    useEffect(
        () => {
            if (playing) setRecording(false);
        },
        [playing]
    );

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

    const startRecording = async (): Promise<void> => {
        try {
            clearSummaryInterval();
            setLoading(true);
            const tmpCtx = new window.AudioContext();
            const tmpAnalyzer = tmpCtx.createAnalyser();
            tmpAnalyzer.fftSize = 2048;

            const bufferLength = tmpAnalyzer.frequencyBinCount;
            const slidingWindowAudioBuffer = new Uint8Array(bufferLength);

            // Request microphone access
            const tmpStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const tmpMicrophone = tmpCtx.createMediaStreamSource(tmpStream);
            tmpMicrophone.connect(tmpAnalyzer);

            setAudioBuffer(undefined);

            // Save audio to buffer on completion
            const tmpRecorder = new MediaRecorder(tmpStream);
            tmpRecorder.ondataavailable = ($evt: BlobEvent) => {
                setAudioBuffer($evt.data);
            }

            tmpRecorder.start();

            setStream(tmpStream);
            setAudioCtx(tmpCtx);
            setMicrophone(tmpMicrophone);
            setAnalyzer(tmpAnalyzer);
            setRecorder(tmpRecorder);
            setStartRecordingTime(moment());
            restartSummaryInterval();

            const processAudio = (): void => {
                setRecording((latestMicOn) => {
                    if (!latestMicOn) {
                        // Stop processing if the microphone is turned off
                        void stopRecording();
                    } else {
                        tmpAnalyzer.getByteFrequencyData(slidingWindowAudioBuffer);

                        // @todo analyze `slidingWindowAudioBuffer` and update the compass graphic
                        // Some type of FFT analysis needed to figure out resonance.
                        // Pitch anaysis is much more straightforward

                        requestAnimationFrame(() => processAudio());
                    }

                    return latestMicOn;
                });
            };

            processAudio();

            await tmpCtx.resume();
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

        setEndRecordingTime(moment());

        clearSummaryInterval();
    }

    const deleteAudio = (): void => {
        setRecording(false);
        setPlaying(false);
        setAudioBuffer(undefined);
        setStartRecordingTime(undefined);
        setEndRecordingTime(undefined);
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
                    disabled={playing}
                    icon={micIcon()}
                    onClick={() => setRecording(!recording)}
                />
                {recordingSummary()}
            </div>
        );
    };

    const compassControls = (): JSX.Element => {
        // Calculate initially in ms then divide to get more precise figure, making the time scrubber more precise
        const durationInSecs = (endRecordingTime?.diff(startRecordingTime, 'milliseconds') ?? 0) / 1000;

        /** @returns Audio player if there is a recorded audio buffer */
        const player = (): JSX.Element => {
            if (!audioBuffer || durationInSecs <= 0) return <></>;
            return (
                <AudioPlayer
                    disabled={loading}
                    audioBlob={audioBuffer}
                    duration={durationInSecs}
                    currentPos={playCurPos}
                    onPlayPause={(cmptIsPlaying) => {
                        setPlaying(cmptIsPlaying)
                    }}
                    onCurrentPosUpdate={(newCurPos) => {
                        setPlayCurPos(newCurPos)
                    }}
                    onCompleted={() => setPlaying(false)}
                    onDeleted={deleteAudio}

                />
            )
        }
        return (
            <div id="compass-controls">
                <div id="compass-control-buttons">
                    {micButton()}
                </div>
                {player()}
            </div>
        )
    };

    /** Style for the compass grid axes */
    const axesStyle = {
        gridTemplateRows: `1fr ${AXIS_SIZE}em `,
        gridTemplateColumns: `${AXIS_SIZE}em 1fr`
    };

    return (
        <div id="compass-main">
            <div id="compass-wrapper">
                <div id="gridline-wrapper">
                    <div id="gridlines"/>
                </div>

                <div id="compass" style={axesStyle}>
                    <Axis label="Resonance" dimension='horizontal' sizeEm={AXIS_SIZE}/>
                    <Axis label="Pitch" dimension='vertical' sizeEm={AXIS_SIZE}/>

                    <div id="quadrants">
                        <Quadrant label="Hollow" position='top-left' />
                        <Quadrant label="Feminine" position='top-right' />
                        <Quadrant label="Masculine" position='bottom-left' />
                        <Quadrant label="Overfull" position='bottom-right' />
                    </div>
                </div>
            </div>
            {compassControls()}
        </div>
    );
}
