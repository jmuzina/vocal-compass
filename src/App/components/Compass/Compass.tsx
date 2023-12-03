import React from 'react';
import './Compass.scss';
import Quadrant from './Quadrant/Quadrant';
import Axis from './Axis/Axis';

const AXIS_SIZE = 0.5;

export default function Compass(): JSX.Element {
    const axesStyle = {
        gridTemplateRows: `1fr ${AXIS_SIZE}em `,
        gridTemplateColumns: `${AXIS_SIZE}em 1fr`
    }

    return (
        <div id="compass-main">
            <div id="compass-wrapper">
                <div id="gridline-wrapper">
                    <div id="gridlines"/>
                </div>

                <div id="compass" style={axesStyle}>

                    <Axis label="Resonance" dimension='horizontal' sizeEm={AXIS_SIZE}/>
                    <Axis label="Pitch" dimension='vertical' sizeEm={AXIS_SIZE}/>

                    <div id="quadrants">
                        <Quadrant label="Hollow" position='top-left' />
                        <Quadrant label="Feminine" position='top-right' />
                        <Quadrant label="Masculine" position='bottom-left' />
                        <Quadrant label="Overfull" position='bottom-right' />
                    </div>
                </div>
            </div>
        </div>
    )
}
