import React, { useEffect, useRef, useState } from 'react';
import './Compass.scss';
import Quadrant from './Quadrant/Quadrant';
import Axis from './Axis/Axis';
import { type Maybe } from '../../models/Maybe';
import AudioPlayer from '../Audio/AudioPlayer/AudioPlayer';
import AudioRecorder from '../Audio/AudioRecorder/AudioRecorder';
import { type IAudioRecorderAnalysisOutput, type IAudioRecorderAudioCompletionOutput } from '../../models/AudioRecorder';
import { type IAxisProps } from '../../models/Axis';
import { AXES, PITCH_AXIS, RESONANCE_AXIS } from '../../constants/Axes';
import { clamp } from '../../util/math-utils';
import { getLatestState } from '../../util/async-utils';
import { COLOR_EXTREMITIES } from '../../constants/Colors';
import { interpolateHexColors } from '../../util/style-utils';

/** Size in em of the axes. This is the width for the vertical axis, height for the horizontal axis. */
const AXIS_SIZE = 0.5;

interface IDotPosition { x: number, y: number }

export default function Compass(): JSX.Element {
    const compassRef = useRef<HTMLDivElement>(null);
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [playCurPos, setPlayCurPos] = useState<number>(0);
    const [fullAudioBuffData, setFullAudioBuffData] = useState<Maybe<IAudioRecorderAudioCompletionOutput>>(undefined);
    const [audioAnalysis, setAudioAnalysis] = useState<Maybe<IAudioRecorderAnalysisOutput>>(undefined);
    const [dotPosition, setDotPosition] = useState<Maybe<IDotPosition>>(undefined);

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
            if (recording && fullAudioBuffData) setRecording(false);
            if (playing) setPlaying(false);
            if (audioAnalysis) setAudioAnalysis(undefined);
            if (dotPosition) setDotPosition(undefined);
        }, [fullAudioBuffData]
    )

    useEffect(
        () => {
            updateDotPosition();
        },
        [audioAnalysis]
    )

    const updateDotPosition = async (): Promise<void> => {
        setDotPosition(await calculateDotPosition());
    }

    const calculateDotPosition = async (): Promise<Maybe<IDotPosition>> => {
        const isRecording = await getLatestState(setRecording)
        if (!isRecording || !compassRef?.current || (!audioAnalysis?.pitchHz && audioAnalysis?.pitchHz !== 0)) return;
        const pitch = clamp(audioAnalysis.pitchHz, PITCH_AXIS.limits.lower.val, PITCH_AXIS.limits.upper.val);
        const resonance = clamp((RESONANCE_AXIS.limits.upper.val - RESONANCE_AXIS.limits.lower.val) / 2, RESONANCE_AXIS.limits.lower.val, RESONANCE_AXIS.limits.upper.val);

        const pitchPercent = (pitch) / (PITCH_AXIS.limits.upper.val - PITCH_AXIS.limits.lower.val);
        const resonancePercent = (resonance) / (RESONANCE_AXIS.limits.upper.val - RESONANCE_AXIS.limits.lower.val);

        // const pitchPercent = 0.5;
        // const resonancePercent = 0.5;

        const pitchCoord = (pitchPercent * compassRef.current.clientHeight) - 13;
        const resonanceCoord = (resonancePercent * compassRef.current.clientWidth) - 2;

        return { x: resonanceCoord, y: pitchCoord };
    }

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
                        onNewAnalysisAvailable={setAudioAnalysis}
                        disabled={playing}
                    />
                </div>
                {player()}
            </div>
        )
    };

    const compassStyle = {
        gridTemplateRows: `1fr ${AXIS_SIZE}em `,
        gridTemplateColumns: `${AXIS_SIZE}em 1fr`,
        background: `linear-gradient(to top right, ${COLOR_EXTREMITIES.MASCULINE}, ${COLOR_EXTREMITIES.FEMININE})`
    };

    const axisElementFactory = (axis: IAxisProps): JSX.Element => {
        return (
            <Axis axis={axis} sizeEm={AXIS_SIZE}/>
        );
    };

    const axisValueColor = (axis: IAxisProps): string => {
        if (!audioAnalysis) return 'white';
        const axisPercent = clamp(axis.rawValueGetter(audioAnalysis), axis.limits.lower.val, axis.limits.upper.val) / (axis.limits.upper.val - axis.limits.lower.val);
        const color = interpolateHexColors(COLOR_EXTREMITIES.MASCULINE, COLOR_EXTREMITIES.FEMININE, axisPercent);
        return color;
    }

    const coordinateDot = (): JSX.Element => {
        if (!dotPosition) return (<></>);

        const dotStyle = {
            left: `${dotPosition.x}px`,
            bottom: `${dotPosition.y}px`
        };

        const dotDetail = (): JSX.Element => {
            if ((!audioAnalysis?.pitchHz && audioAnalysis?.pitchHz !== 0) || (!audioAnalysis?.firstFormantHz && audioAnalysis?.firstFormantHz !== 0)) return <></>;
            const detailAxisFactory = (axis: IAxisProps): JSX.Element => {
                return (
                    <div className={`dot-detail-item dot-detail-${axis.label.toLowerCase()}`}>
                        <span className="dot-detail-item-text dot-detail-item-label">{axis.label}: </span>
                        <span className="dot-detail-item-text dot-detail-item-value" style={{ color: axisValueColor(axis) }}>
                            {axis.formattedValueGeter(audioAnalysis)}
                            <span className="dot-detail-item-text dot-detail-item-unit"> {axis.unit}</span>
                        </span>

                    </div>
                )
            }
            return (
                <div id="dot-detail">
                    {AXES.map(detailAxisFactory)}
                </div>
            )
        }

        return (
            <div id="coordinate-dot" style={dotStyle}>
                {dotDetail()}
            </div>
        )
    }

    return (
        <div id="compass-main">
            <div id="compass-wrapper">
                <div id="gridline-wrapper">
                    <div id="gridlines"/>
                </div>

                <div id="compass" style={compassStyle}>
                    {AXES.map(axisElementFactory)}

                    <div id="quadrants" ref={compassRef}>
                        <Quadrant label="Hollow" position='top-left' />
                        <Quadrant label="Feminine" position='top-right' />
                        <Quadrant label="Masculine" position='bottom-left' />
                        <Quadrant label="Overfull" position='bottom-right' />
                        {coordinateDot()}
                    </div>
                </div>
            </div>
            {compassControls()}
        </div>
    );
}
