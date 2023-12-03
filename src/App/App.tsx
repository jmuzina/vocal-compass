import React, { useEffect, useState } from 'react';
import './App.scss';
import { ThemeManagerProvider, useThemeManager } from './ctx/theme.ctx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { wait } from '@testing-library/user-event/dist/utils';
import Compass from './components/Compass/Compass';

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
                    : <BrowserRouter>
                        <Header/>
                        <main id="main">
                            <Routes>
                                <Route path="/" Component={Compass}/>
                            </Routes>
                        </main>
                        <Footer/>
                    </BrowserRouter>
            }
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
