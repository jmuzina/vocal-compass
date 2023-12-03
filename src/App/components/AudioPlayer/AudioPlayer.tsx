import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import VolumeUp from '@mui/icons-material/VolumeUp';
import Trash from '@mui/icons-material/Delete';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import './AudioPlayer.scss';
import { Slider, type SliderChangeEvent } from 'primereact/slider';
import React, { useState, useRef, useEffect } from 'react';
import { formatTime } from '../../util/time-utils';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import Loop from '@mui/icons-material/Loop';

interface AudioPlayerProps {
    /** Raw audio to be played */
    audioBlob: Blob
    /** Duration of the `audioBlob` in seconds */
    duration: number
    /** Current play position, in seconds */
    currentPos: number
    /** Whether the player controls should be disabled */
    disabled: boolean
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

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBlob, duration, currentPos, onPlayPause, onCurrentPosUpdate, onVolumeUpdate, onCompleted, disabled, onDeleted }) => {
    if (duration <= 0) return (<></>);
    const audioRef = useRef<HTMLAudioElement>(null);
    const deleteButtonRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [deletionConfirmationVisible, setDeletionConfirmationVisible] = useState(false);
    const [volume, setVolume] = useState(1);
    const [loop, setLoop] = useState(false);

    useEffect(() => {
        if (!audioBlob) return;
        // Convert the Blob into a URL for playing in an <audio> element
        const url = URL.createObjectURL(audioBlob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url); // Revoke the Blob URL when the component is unmounted
    }, [audioBlob]);

    if (onCurrentPosUpdate) {
        useEffect(() => {
            onCurrentPosUpdate(currentPos);
        }, [currentPos, onCurrentPosUpdate]);
    }

    const handlePlayPause = (): void => {
        const audioElement = audioRef.current;
        if (audioElement) {
            if (isPlaying) audioElement.pause();
            else void audioElement.play();

            setIsPlaying(!isPlaying);

            // Notify the parent component about the play/pause event
            if (onPlayPause) onPlayPause(!isPlaying);
        }
    };

    const handleClipEnded = (): void => {
        setIsPlaying(false);
        const audioElement = audioRef.current;
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.pause();
        }
        if (onCompleted) onCompleted();
    }

    const handleTimeUpdate = (): void => {
        const audioElement = audioRef.current;
        if (!audioElement) return;
        if (currentPos >= duration) handleClipEnded();
        if (onCurrentPosUpdate) onCurrentPosUpdate(audioElement.currentTime);
    };

    const handleScrubberChange = (newPos: number): void => {
        const audioElement = audioRef.current;
        if (audioElement) {
            audioElement.currentTime = newPos;
            if (onCurrentPosUpdate) onCurrentPosUpdate(audioElement.currentTime);
        }
    };

    const handleVolumeChange = (newVolume: number): void => {
        const audioElement = audioRef.current;
        if (audioElement) {
            audioElement.volume = newVolume;
            if (onVolumeUpdate) onVolumeUpdate(audioElement.volume);
        }
        setVolume(newVolume);
    };

    const playButton = (): JSX.Element => {
        const basePlayButtonClass = 'play-button';
        const playButtonClass = (): string => `${basePlayButtonClass} p-button-rounded p-button-${isPlaying ? 'warning active' : 'outlined'}`;
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
                    onClick={handlePlayPause}
                    data-pr-tooltip={playButtonTooltipLabel()}
                />
            </>
        )
    };

    const loopButton = (): JSX.Element => {
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
                    onClick={() => setLoop(!loop)}
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
                    ref={deleteButtonRef}
                    disabled={disabled || isPlaying || deletionConfirmationVisible}
                    className={`${baseDeleteButtonClass} p-button-rounded p-button-danger p-button-outline}`}
                    icon={<Trash/>}
                    onClick={
                        deleteButtonRef?.current
                            ? () => confirmPopup({
                                target: deleteButtonRef.current as unknown as HTMLElement,
                                message: 'Are you sure you want to delete this audio?',
                                icon: 'pi pi-exclamation-triangle',
                                accept: onDeleted,
                                reject: () => setDeletionConfirmationVisible(false)
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
                        loop={loop}
                    />
                    {playButton()}
                    {loopButton()}
                    {positionScrubber()}
                    {volumeSlider()}
                    {deleteButton()}
                </>
            )}
        </div>
    );
};

export default AudioPlayer;
