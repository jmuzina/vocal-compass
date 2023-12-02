export type ColorThemeCode = 'dark' | 'light';
export type DynamicStylesheetDOMNodeID = 'primereact-color-theme';

export abstract class ColorTheme {
    abstract code: ColorThemeCode;
    abstract label: string;
    abstract primePath: string;
    abstract icon: string;
}

export class DarkTheme extends ColorTheme {
    code: ColorThemeCode = 'dark';
    label: string = 'Dark';
    primePath: string = 'soho-dark.css';
    icon: string = 'pi pi-moon';
}

export class LightTheme extends ColorTheme {
    code: ColorThemeCode = 'light';
    label: string = 'Light';
    primePath: string = 'soho-light.css';
    icon: string = 'pi pi-sun';
}
