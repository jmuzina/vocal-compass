// ThemeManager.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { type ColorTheme, type ColorThemeCode } from '../models/ColorTheme';
import { type Maybe } from '../models/Maybe';
import localstorageService from '../services/localstorage.service';
import { COOKIE_NAMES } from '../constants/Cookies';
import { COLOR_THEMES, STYLESHEET_LINK_DOM_NODE_IDS } from '../constants/Stylesheet';

interface ThemeManagerContextProps {
    activeTheme: ColorTheme
    options: ColorTheme[]
    switchTheme: (newTheme: ColorTheme) => void
    toggleTheme: () => void
    toggleTarget: () => ColorTheme
};

interface ThemeManagerProviderProps {
    children: React.ReactNode
}

const currentLocalStorageTheme = (): Maybe<ColorTheme> => {
    const lsVal: Maybe<ColorThemeCode> = localstorageService.get<ColorThemeCode>(COOKIE_NAMES.COLOR_THEME)?.toLowerCase()?.trim() as ColorThemeCode;
    if (!lsVal) return;

    const matchedVal = COLOR_THEMES.options[lsVal];
    return matchedVal;
}

const ThemeContext = createContext<ThemeManagerContextProps>({
    activeTheme: COLOR_THEMES.default,
    options: Object.values(COLOR_THEMES.options),
    switchTheme: (newTheme: ColorTheme) => { },
    toggleTheme: () => { },
    toggleTarget: () => COLOR_THEMES.default
});

const ThemeManagerProvider: React.FC<ThemeManagerProviderProps> = ({ children }: { children: React.ReactNode }) => {
    const [activeTheme, setActiveTheme] = useState<ColorTheme>(currentLocalStorageTheme() ?? COLOR_THEMES.default);

    const updateRootStyleImport = (newTheme: ColorTheme): void => {
        const newLink: HTMLLinkElement = (document.getElementById(STYLESHEET_LINK_DOM_NODE_IDS.PRIMEREACT) ?? document.head.appendChild(document.createElement('link'))) as HTMLLinkElement;
        newLink.rel = 'stylesheet';
        newLink.id = STYLESHEET_LINK_DOM_NODE_IDS.PRIMEREACT;
        newLink.href = `${process.env.PUBLIC_URL}/static/css/${newTheme.primePath}`;
        document.body.classList.forEach((className) => {
            document.body.classList.remove(className);
        })
        document.body.classList.add(`${newTheme.code}-theme`);
    }

    const saveThemeChangeToStorage = (newTheme: ColorTheme): void => {
        localstorageService.set(COOKIE_NAMES.COLOR_THEME, newTheme.code);
    }

    const switchTheme = (newTheme: ColorTheme): void => {
        updateRootStyleImport(newTheme);
        setActiveTheme(newTheme);
        saveThemeChangeToStorage(newTheme);
    }

    const toggleTarget = (): ColorTheme => {
        return activeTheme.code === 'dark' ? COLOR_THEMES.options.light : COLOR_THEMES.options.dark;
    }

    const toggleTheme = (): void => {
        switchTheme(toggleTarget());
    }

    // Use useMemo to calculate the context value only when activeTheme changes
    const contextValue = useMemo(
        () => ({
            activeTheme,
            switchTheme,
            toggleTheme,
            toggleTarget,
            options: Object.values(COLOR_THEMES.options)
        }),
        [activeTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

const useThemeManager = (): ThemeManagerContextProps => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useThemeManager must be used within a ThemeManagerProvider');
    }

    return context;
};

export { ThemeManagerProvider, useThemeManager };
