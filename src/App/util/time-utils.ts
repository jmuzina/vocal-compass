export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const roundedHours = Math.round(hours); const roundedMinutes = Math.round(minutes); const roundedSeconds = Math.round(remainingSeconds);

    const formattedHours = roundedHours.toString().padStart(2, '0');
    const formattedMinutes = roundedMinutes.toString().padStart(2, '0');
    const formattedSeconds = roundedSeconds.toString().padStart(2, '0');

    const firstNonzeroIndex = [roundedHours, roundedMinutes, roundedSeconds].findIndex((val) => val);
    const formattedTime = [formattedHours, formattedMinutes, formattedSeconds].slice(Math.max(1, firstNonzeroIndex - 1)).join(':');

    return formattedTime;
}
