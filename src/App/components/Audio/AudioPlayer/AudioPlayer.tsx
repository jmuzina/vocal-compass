import './AudioPlayer.scss';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import VolumeUp from '@mui/icons-material/VolumeUp';
import Trash from '@mui/icons-material/Delete';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Slider, type SliderChangeEvent } from 'primereact/slider';
import React, { useState, useRef, useEffect, type FC } from 'react';
import { formatTime } from '../../../util/time-utils';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import Loop from '@mui/icons-material/Loop';
import { type Maybe } from '../../../models/Maybe';

interface AudioPlayerProps {
    /** Raw audio to be played */
    audioBlob: Blob
    /** Duration of the `audioBlob` in seconds */
    duration: number
    /** Current play position, in seconds */
    currentPos: number
    /** Whether the player controls should be disabled */
    disabled?: boolean
    /** Callback fired on change to the player's play/pause state */
    onPlayPause?: (isPlaying: boolean) => void
    /** Callback fired on change to the player's current play position */
    onCurrentPosUpdate?: (currentTime: number) => void
    /** Callback fired after the `audioBlob` has been fully played */
    onCompleted?: () => void
    /** Callback fired after the volume has been updated */
    onVolumeUpdate?: (volume: number) => void
    /** Callback fired after the audio clip has been deleted */
    onDeleted?: () => void
}

const AudioPlayer: FC<AudioPlayerProps> = ({ audioBlob, duration, currentPos, onPlayPause, onCurrentPosUpdate, onVolumeUpdate, onCompleted, disabled, onDeleted }) => {
    if (duration <= 0) return (<></>);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [deleteButtonRef, setDeleteButtonRef] = useState<Maybe<Button> | null>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [volume, setVolume] = useState(1);
    const [loop, setLoop] = useState(false);

    useEffect(() => {
        if (!audioBlob) return;
        // Convert the Blob into a URL for playing in an <audio> element
        const url = URL.createObjectURL(audioBlob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url); // Revoke the Blob URL when the component is unmounted
    }, [audioBlob]);

    // binds the audio element playing/pausing state to the `isPlaying` attribute
    useEffect(() => {
        if (audioRef?.current) {
            if (isPlaying) void audioRef.current.play();
            else audioRef.current.pause();
        }
    }, [isPlaying])

    // update the parent component whenever the currentPos updates
    if (onCurrentPosUpdate) {
        useEffect(() => {
            onCurrentPosUpdate(currentPos);
        }, [currentPos, onCurrentPosUpdate]);
    }

    const togglePlaying = (): void => {
        if (audioRef?.current) {
            setIsPlaying(!isPlaying);

            // Notify the parent component about the play/pause event
            if (onPlayPause) onPlayPause(!isPlaying);
        }
    };

    const handleClipEnded = (): void => {
        if (audioRef?.current) {
            audioRef.current.currentTime = 0;
            if (!loop) setIsPlaying(false);
        }
        if (onCompleted) onCompleted();
    }

    const handleTimeUpdate = (): void => {
        if (!audioRef?.current) return;
        if (currentPos >= duration) handleClipEnded();
        if (onCurrentPosUpdate) onCurrentPosUpdate(audioRef.current.currentTime);
    };

    const handleScrubberChange = (newPos: number): void => {
        if (audioRef?.current) {
            audioRef.current.currentTime = newPos;
            if (onCurrentPosUpdate) onCurrentPosUpdate(audioRef.current.currentTime);
        }
    };

    const handleVolumeChange = (newVolume: number): void => {
        if (audioRef?.current) {
            audioRef.current.volume = newVolume;
            if (onVolumeUpdate) onVolumeUpdate(audioRef.current.volume);
        }
        setVolume(newVolume);
    };

    const playButton = (): JSX.Element => {
        const basePlayButtonClass = 'play-button';
        const playButtonClass = (): string => `${basePlayButtonClass} p-button-rounded p-button-${isPlaying ? 'success active' : 'outlined'}`;
        const playButtonTooltipLabel = (): string => isPlaying ? 'Stop playing audio' : 'Play audio';
        const playIcon = (): JSX.Element => {
            if (isPlaying) return <Pause/>;
            return <PlayArrow/>;
        }
        return (
            <>
                <Tooltip target={`.${basePlayButtonClass}`} />
                <Button
                    disabled={disabled}
                    className={playButtonClass()}
                    icon={playIcon()}
                    onClick={togglePlaying}
                    data-pr-tooltip={playButtonTooltipLabel()}
                />
            </>
        )
    };

    const loopButton = (): JSX.Element => {
        const toggleLoop = (): void => {
            setLoop(!loop);
        };
        const baseLoopButtonClass = 'loop-button';
        const loopButtonClass = (): string => `${baseLoopButtonClass} p-button-rounded p-button-${loop ? 'info' : 'outlined'}`;
        const loopButtonTooltipLabel = (): string => loop ? 'Disable loop' : 'Enable loop';
        return (
            <>
                <Tooltip target={`.${baseLoopButtonClass}`} />
                <Button
                    disabled={disabled}
                    className={loopButtonClass()}
                    icon={<Loop/>}
                    onClick={toggleLoop}
                    data-pr-tooltip={loopButtonTooltipLabel()}
                />
            </>
        )
    }

    const deleteButton = (): JSX.Element => {
        if (!onDeleted) return (<></>);

        const baseDeleteButtonClass = 'delete-button';
        return (
            <>
                <ConfirmPopup/>
                <Tooltip target={`.${baseDeleteButtonClass}`} />
                <Button
                    ref={setDeleteButtonRef}
                    disabled={!!disabled || isPlaying || !deleteButtonRef}
                    className={`${baseDeleteButtonClass} p-button-rounded p-button-danger p-button-outline}`}
                    icon={<Trash/>}
                    onClick={
                        deleteButtonRef
                            ? () => confirmPopup({
                                target: deleteButtonRef as any as HTMLElement,
                                message: 'Are you sure you want to delete this audio?',
                                icon: 'pi pi-exclamation-triangle',
                                accept: onDeleted
                            })
                            : () => {}
                    }
                    data-pr-tooltip="Delete audio"
                />
            </>
        )
    }

    const positionScrubber = (): JSX.Element => {
        return (
            <div id="scrubber-slider-wrapper" className="slider-wrapper flex flex-nowrap flex-row align-items-center">
                <span className="position-report">{ formatTime(currentPos)}/{formatTime(duration)}</span>
                <Slider
                    className="slider scrubber"
                    min={0}
                    max={duration}
                    step={duration / 100}
                    value={currentPos}
                    onChange={($evt: SliderChangeEvent) => handleScrubberChange($evt.value as number)} />
            </div>
        )
    }

    const volumeSlider = (): JSX.Element => {
        return (
            <div id="volume-slider-wrapper" className="slider-wrapper flex flex-nowrap flex-row align-items-center">
                <VolumeUp/>
                <Slider
                    className="slider volume"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={($evt: SliderChangeEvent) => handleVolumeChange($evt.value as number)} />
            </div>
        )
    }

    return (
        <div className="audio-player">
            {blobUrl && (
                <>
                    <audio
                        ref={audioRef}
                        src={blobUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleClipEnded}
                        { ...{ loop } }
                    />
                    {deleteButton()}
                    {playButton()}
                    {loopButton()}
                    {positionScrubber()}
                    {volumeSlider()}
                </>
            )}
        </div>
    );
};

export default AudioPlayer;
