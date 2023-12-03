import { clamp } from './math-utils';

export const interpolateHexColors = (color1: string, color2: string, ratio = 0.5): string => {
    ratio = clamp(ratio, 0, 1);
    const hexToRgb = (hex: string): number[] => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    };

    const rgbToHex = (rgb: number[]): string => {
        return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)}`;
    };

    const color1Rgb = hexToRgb(color1);
    const color2Rgb = hexToRgb(color2);

    const interpolatedRgb = color1Rgb.map((channel, index) => {
        const channelDiff = color2Rgb[index] - channel;
        const interpolatedChannel = Math.round(channel + channelDiff * ratio);
        return interpolatedChannel;
    });

    return rgbToHex(interpolatedRgb);
}
