import React, { useEffect, useState } from 'react';
import './Compass.scss';
import Quadrant from './Quadrant/Quadrant';
import Axis from './Axis/Axis';
import { type Maybe } from '../../models/Maybe';
import AudioPlayer from '../Audio/AudioPlayer/AudioPlayer';
import AudioRecorder from '../Audio/AudioRecorder/AudioRecorder';
import { type IAudioRecorderAudioCompletionOutput } from '../../models/AudioRecorder';

/** Size in em of the axes. This is the width for the vertical axis, height for the horizontal axis. */
const AXIS_SIZE = 0.5;

export default function Compass(): JSX.Element {
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [playCurPos, setPlayCurPos] = useState<number>(0);
    const [fullAudioBuffData, setFullAudioBuffData] = useState<Maybe<IAudioRecorderAudioCompletionOutput>>(undefined);

    // Stop playing audio when recording starts
    useEffect(
        () => {
            if (recording && playing) setPlaying(false);
            // Clear existing audio buffer
            if (recording && fullAudioBuffData) setFullAudioBuffData(undefined);
        },
        [recording]
    );

    // Stop recording when you start playing audio
    useEffect(
        () => {
            if (playing && recording) setRecording(false);
        },
        [playing]
    );

    // Stop playing and recording when full audio buffer data is set
    useEffect(
        () => {
            if (recording) setRecording(false);
            if (playing) setPlaying(false);
        }, [fullAudioBuffData]
    )

    const deleteAudio = (): void => {
        setRecording(false);
        setPlaying(false);
        setFullAudioBuffData(undefined);
    }

    const compassControls = (): JSX.Element => {
        /** @returns Audio player if there is a recorded audio buffer */
        const player = (): JSX.Element => {
            if (!fullAudioBuffData?.audio || fullAudioBuffData?.durationSecs <= 0) return <></>;
            return (
                <AudioPlayer
                    audioBlob={fullAudioBuffData.audio}
                    duration={fullAudioBuffData.durationSecs}
                    currentPos={playCurPos}
                    onPlayPause={setPlaying}
                    onCurrentPosUpdate={setPlayCurPos}
                    onDeleted={deleteAudio}

                />
            )
        }
        return (
            <div id="compass-controls">
                <div id="compass-control-buttons">
                    <AudioRecorder
                        recording={recording}
                        onRecordingChange={setRecording}
                        onRecordingCompleted={setFullAudioBuffData}
                        disabled={playing}
                    />
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
