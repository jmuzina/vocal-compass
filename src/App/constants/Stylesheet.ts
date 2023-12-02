import { DarkTheme, type DynamicStylesheetDOMNodeID, LightTheme, type ColorThemeCode, type ColorTheme } from '../models/ColorTheme';

const DarkMode = new DarkTheme();
const LightMode = new LightTheme();

export const COLOR_THEMES: {
    default: ColorTheme
    options: Record<ColorThemeCode, ColorTheme>
} = {
    default: DarkMode,
    options: {
        dark: DarkMode,
        light: LightMode
    }
}

export const STYLESHEET_LINK_DOM_NODE_IDS: Record<string, DynamicStylesheetDOMNodeID> = {
    PRIMEREACT: 'primereact-color-theme'
}
