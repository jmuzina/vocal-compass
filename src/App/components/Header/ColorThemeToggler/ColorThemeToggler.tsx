import React from 'react';
import { Button } from 'primereact/button';
import { useThemeManager } from '../../../ctx/theme.ctx';
import { Tooltip } from 'primereact/tooltip';

export default function ColorThemeToggler(): JSX.Element {
    const { activeTheme, toggleTheme, toggleTarget } = useThemeManager();
    const COLOR_THEME_TOGGLER_BTN_CLASS = 'color-theme-toggler';

    return (
        <>
            <Tooltip target={`.${COLOR_THEME_TOGGLER_BTN_CLASS}`} />
            <Button
                link
                className={COLOR_THEME_TOGGLER_BTN_CLASS}
                onClick={toggleTheme}
                icon={activeTheme.icon}
                data-pr-tooltip={'Switch to ' + toggleTarget().label + ' mode'}
                data-pr-position="left"
            />
        </>
    );
}
