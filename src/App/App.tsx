import React, { useEffect, useState } from 'react';
import './App.scss';
import { ThemeManagerProvider, useThemeManager } from './ctx/theme.ctx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import { Button } from 'primereact/button';

const App: React.FC = () => {
    const { activeTheme, toggleTheme, switchTheme, toggleTarget } = useThemeManager();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        switchTheme(activeTheme);
        setIsLoading(false);
    }, []);

    const onToggleTheme = (): void => {
        setIsLoading(true);
        toggleTheme();
        setIsLoading(false);
    }

    return (
        <div className="App">
            {isLoading
                ? <LoadingSpinner />
                : <>
                    <Button onClick={onToggleTheme} label={'Switch to ' + toggleTarget().label + ' mode'} disabled={isLoading} icon={activeTheme.icon}></Button></>}

        </div>
    );
}

const ThemedApp: React.FC = () => {
    return (
        <ThemeManagerProvider>
            <App />
        </ThemeManagerProvider>
    )
}

export default ThemedApp
