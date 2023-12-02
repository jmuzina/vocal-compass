import React, { useEffect, useState } from 'react';
import './App.scss';
import { ThemeManagerProvider, useThemeManager } from './ctx/theme.ctx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { BrowserRouter } from 'react-router-dom'
import { wait } from '@testing-library/user-event/dist/utils';

const App: React.FC = () => {
    const { activeTheme, switchTheme } = useThemeManager();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const doFakeLoading = wait(250);

    useEffect(() => {
        switchTheme(activeTheme);
        void doFakeLoading.then(() => {
            setIsLoading(false);
        })
    }, []);

    return (
        <div id="app">
            {
                isLoading
                    ? <LoadingSpinner />
                    : <>
                        <Header/>
                        <main id="main">
                        </main>
                        <Footer/>
                    </>
            }
        </div>
    );
}

const ThemedApp: React.FC = () => {
    return (
        <ThemeManagerProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeManagerProvider>
    )
}

export default ThemedApp
