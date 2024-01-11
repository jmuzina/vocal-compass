import React, { useEffect, useRef, useState } from 'react';
import './Compass.scss';
import Quadrant from './Quadrant/Quadrant';
import Axis from './Axis/Axis';
import { type Maybe } from '../../models/Maybe';
import AudioPlayer from '../Audio/AudioPlayer/AudioPlayer';
import AudioRecorder from '../Audio/AudioRecorder/AudioRecorder';
import { AXES } from '../../constants/Axes';
import AsyncUtils from '../../util/async-utils';
import { COLOR_EXTREMITIES } from '../../constants/Colors';
import { interpolateHexColors } from '../../util/style-utils';
import { type AudioRecorderAnalysisOutput } from '../../models/Audio/AnalysisOutput';
import { type AxisProps } from '../../models/Axis/Axis';
import { type AudioRecorderAudioCompletionOutput } from '../../models/Audio/CompletionOutput';
import audioUtils from '../../util/audio-utils';

if (AXES.length !== 2) { throw new Error('Compass component requires exactly two axes'); }

/** Size in em of the axes. This is the width for the vertical axis, height for the horizontal axis. */
const AXIS_SIZE = 0.5;

interface IDotScaleData {
    raw: number
    ratio: number
    coordinatePx: number
    fullDimensionPx: number
}

interface IDotPositionalData {
    horizontal: IDotScaleData
    vertical: IDotScaleData
}

export default function Compass(): JSX.Element {
    const compassRef = useRef<HTMLDivElement>(null);
    const [recording, setRecording] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [playCurPos, setPlayCurPos] = useState<number>(0);
    const [lastCurPos, setLastCurPos] = useState<number>(0);
    const [fullAudioBuffData, setFullAudioBuffData] =
    useState<Maybe<AudioRecorderAudioCompletionOutput>>(undefined);
    const [audioAnalysis, setAudioAnalysis] =
    useState<Maybe<AudioRecorderAnalysisOutput>>(undefined);
    const [dotPosition, setDotPosition] =
    useState<Maybe<IDotPositionalData>>(undefined);

    // Stop playing audio when recording starts
    useEffect(() => {
        if (recording && playing) setPlaying(false);
        // Clear existing audio buffer
        if (recording && fullAudioBuffData) setFullAudioBuffData(undefined);
    }, [recording]);

    // Stop recording when you start playing audio
    useEffect(() => {
        if (playing && recording) setRecording(false);
        if (!playing && !recording) {
            setAudioAnalysis(undefined);
            setDotPosition(undefined);
        }
    }, [playing]);

    // Stop playing and recording when full audio buffer data is set
    useEffect(() => {
        if (recording && fullAudioBuffData) setRecording(false);
        if (playing) setPlaying(false);
        if (audioAnalysis) setAudioAnalysis(undefined);
        if (dotPosition) setDotPosition(undefined);
        setPlayCurPos(0);
        setLastCurPos(0);
    }, [fullAudioBuffData]);

    useEffect(() => {
        updateDotPosition();
    }, [audioAnalysis, fullAudioBuffData]);

    useEffect(() => {
        if (playing && !recording) {
            setAudioAnalysis(analyzeStoredAudio());
            setLastCurPos(playCurPos);
        }
    }, [playCurPos]);

    const analyzeStoredAudio = (): Maybe<AudioRecorderAnalysisOutput> => {
        if (
            !fullAudioBuffData?.audio ||
      !fullAudioBuffData?.raw ||
      !playing ||
      recording
        ) { return; }

        const elementsPerSec =
      fullAudioBuffData.raw.length / fullAudioBuffData.durationSecs;
        const startIdx = Math.floor((lastCurPos ?? 0) * elementsPerSec);
        const endIdx = Math.floor((playCurPos ?? 0) * elementsPerSec);
        if (startIdx >= endIdx) return; // No change in position or we have skipped backwards

        const audioSlice = fullAudioBuffData?.raw?.slice(startIdx, endIdx);
        return audioUtils.analyzeAudio(
            audioSlice,
            fullAudioBuffData.ctx.sampleRate
        );
    };

    const updateDotPosition = async (): Promise<void> => {
        setDotPosition(await calculateDotPosition());
    };

    const calculateDotPosition = async (): Promise<Maybe<IDotPositionalData>> => {
        if (
            !compassRef?.current ||
      (!audioAnalysis?.pitchHz && audioAnalysis?.pitchHz !== 0)
        ) { return; }

        let isRecording = false;
        let isPlaying = false;
        await Promise.all([
            AsyncUtils.getLatestState(setRecording).then((recording) => {
                isRecording = recording;
            }),
            AsyncUtils.getLatestState(setPlaying).then((playing) => {
                isPlaying = playing;
            })
        ]);
        if (!isPlaying && !isRecording) return;

        const retVal: IDotPositionalData = {
            horizontal: {
                raw: 0,
                ratio: 0,
                coordinatePx: 0,
                fullDimensionPx: compassRef.current.clientWidth
            },
            vertical: {
                raw: 0,
                ratio: 0,
                coordinatePx: 0,
                fullDimensionPx: compassRef.current.clientHeight
            }
        };

        AXES.forEach((axis) => {
            const scale: IDotScaleData = retVal[axis.dimension];
            // if (AxisProps.Equals(axis, RESONANCE_AXIS)) {
            //     console.log('time to debug the resonance yknow', scale);
            // }
            scale.ratio = axis.getRatioAlongRangeFromAnalysis(audioAnalysis, true);
            scale.coordinatePx = scale.ratio * scale.fullDimensionPx;
        });

        // Slight adjustments for reasons to be determined
        retVal.horizontal.coordinatePx -= 2;
        retVal.vertical.coordinatePx -= 13;

        return retVal;
    };

    const deleteAudio = (): void => {
        setRecording(false);
        setPlaying(false);
        setFullAudioBuffData(undefined);
    };

    const compassControls = (): JSX.Element => {
    /** @returns Audio player if there is a recorded audio buffer */
        const player = (): JSX.Element => {
            if (!fullAudioBuffData?.audio || fullAudioBuffData?.durationSecs <= 0) { return <></>; }
            return (
                <AudioPlayer
                    audioBlob={fullAudioBuffData.audio}
                    duration={fullAudioBuffData.durationSecs}
                    currentPos={playCurPos}
                    onPlayPause={setPlaying}
                    onCurrentPosUpdate={setPlayCurPos}
                    onDeleted={deleteAudio}
                />
            );
        };
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
        );
    };

    const compassStyle = {
        gridTemplateRows: `1fr ${AXIS_SIZE}em `,
        gridTemplateColumns: `${AXIS_SIZE}em 1fr`,
        background: `linear-gradient(to top right, ${COLOR_EXTREMITIES.MASCULINE}, ${COLOR_EXTREMITIES.FEMININE})`
    };

    const axisElementFactory = (axis: AxisProps): JSX.Element => {
        return <Axis axis={axis} sizeEm={AXIS_SIZE} />;
    };

    const axisValueColor = (axis: AxisProps): string => {
        if (!audioAnalysis) return 'white';
        const axisPercent = axis.getRatioAlongRangeFromAnalysis(
            audioAnalysis,
            true
        );
        const color = interpolateHexColors(
            COLOR_EXTREMITIES.MASCULINE,
            COLOR_EXTREMITIES.FEMININE,
            axisPercent
        );
        return color;
    };

    const coordinateDot = (): JSX.Element => {
        if (!dotPosition) return <></>;

        const dotStyle = {
            left: `${dotPosition.horizontal.coordinatePx}px`,
            bottom: `${dotPosition.vertical.coordinatePx}px`
        };

        const dotDetail = (): JSX.Element => {
            if (
                (!audioAnalysis?.pitchHz && audioAnalysis?.pitchHz !== 0) ||
        (!audioAnalysis?.vocalTractLengthCm &&
          audioAnalysis?.vocalTractLengthCm !== 0)
            ) { return <></>; }
            const detailAxisFactory = (axis: AxisProps): JSX.Element => {
                return (
                    <div
                        className={`dot-detail-item dot-detail-${axis.label.toLowerCase()}`}
                    >
                        <span className="dot-detail-item-text dot-detail-item-label">
                            {axis.label}:{' '}
                        </span>
                        <span
                            className="dot-detail-item-text dot-detail-item-value"
                            style={{ color: axisValueColor(axis) }}
                        >
                            {axis.getFormattedValueFromAnalysis(audioAnalysis, {
                                clamped: true,
                                precision: 0
                            })}
                            <span className="dot-detail-item-text dot-detail-item-unit">
                                {' '}
                                {axis.unit}
                            </span>
                        </span>
                    </div>
                );
            };
            return <div id="dot-detail">{AXES.map(detailAxisFactory)}</div>;
        };

        return (
            <div id="coordinate-dot" style={dotStyle}>
                {dotDetail()}
            </div>
        );
    };

    return (
        <div id="compass-main">
            <div id="compass-wrapper">
                <div id="gridline-wrapper">
                    <div id="gridlines" />
                </div>

                <div id="compass" style={compassStyle}>
                    {AXES.map(axisElementFactory)}

                    <div id="quadrants" ref={compassRef}>
                        <Quadrant label="Hollow" position="top-left" />
                        <Quadrant label="Feminine" position="top-right" />
                        <Quadrant label="Masculine" position="bottom-left" />
                        <Quadrant label="Overfull" position="bottom-right" />
                        {coordinateDot()}
                    </div>
                </div>
            </div>
            {compassControls()}
        </div>
    );
}
