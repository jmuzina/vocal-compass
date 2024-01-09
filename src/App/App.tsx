import React, { useEffect, useState, type FC } from 'react';
import './App.scss';
import { ThemeManagerProvider, useThemeManager } from './ctx/theme.ctx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Compass from './components/Compass/Compass';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AsyncUtils from './util/async-utils';

const App: FC = () => {
    const { activeTheme, switchTheme } = useThemeManager();
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const doFakeLoading = AsyncUtils.wait(250);

    useEffect(() => {
        switchTheme(activeTheme);
        void doFakeLoading.then(() => {
            setIsLoading(false);
        })
    }, []);

    return (
        <><ToastContainer theme={activeTheme.code} /><div id="app">
            {isLoading
                ? <LoadingSpinner />
                : <BrowserRouter>
                    <Header />
                    <main id="main">
                        <Routes>
                            <Route path="/" Component={Compass} />
                        </Routes>
                    </main>
                    <Footer />
                </BrowserRouter>}
        </div></>
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
