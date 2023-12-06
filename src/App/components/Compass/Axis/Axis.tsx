import React from 'react';
import './Axis.scss';
import { type AxisProps } from '../../../models/Axis/Axis';

const Axis: React.FC<{ axis: AxisProps, sizeEm: number }> = ({ axis, sizeEm }) => {
    const axisStyle: {
        width?: string
        height?: string
    } = {
        width: '100%',
        height: '100%'
    };

    axisStyle[axis.dimension === 'horizontal' ? 'height' : 'width'] = `${sizeEm}em`;
    const beginningArrowClass = axis.dimension === 'horizontal' ? 'caret-left' : 'caret-down';
    const endingArrowClass = beginningArrowClass === 'caret-down' ? 'caret-up' : 'caret-right';

    return (
        <div className={`axis-wrapper ${axis.dimension}`} style={axisStyle}>
            <div className="line">
                <div className="axis-endpoint axis-start">
                    <i className={`arrow start-arrow pi pi-${beginningArrowClass}`}></i>
                    <span className="start-label endpoint-label">{axis.range.min.displayedVal}</span>
                </div>
                <span className="axis-label">{axis.label} ({axis.unit})</span>
                <div className="axis-endpoint axis-end">
                    <i className={`arrow end-arrow pi pi-${endingArrowClass}`}></i>
                    <span className="end-label endpoint-label">{axis.range.max.displayedVal}</span>
                </div>
            </div>
        </div>
    );
};

export default Axis;
