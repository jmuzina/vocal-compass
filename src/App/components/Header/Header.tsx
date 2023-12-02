import React from 'react';
import './Header.scss';
import ColorThemeToggler from './ColorThemeToggler/ColorThemeToggler';
import { APP_INFO } from '../../../app-info';
import { Menubar } from 'primereact/menubar';
import { type MenuItem } from 'primereact/menuitem';
import { Link } from 'react-router-dom';

const { PUBLIC_URL } = process.env;

export default function Header (): JSX.Element {
    const start = <div>
        {/* <img alt={`${APP_INFO.name} logo`} src={`${PUBLIC_URL}/static/images/logo.png`} height="40" className="p-mr-2"></img> */}
        <Link to={PUBLIC_URL} className="app-name nav-link">{APP_INFO.name}</Link>
    </div>

    const items: MenuItem[] = [];

    const end = <ColorThemeToggler/>;

    return (
        <header id="header">
            <Menubar model={items} start={start} end={end} />
        </header>
    )
}
