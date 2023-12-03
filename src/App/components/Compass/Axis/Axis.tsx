import React from 'react';
import './Axis.scss';

interface AxisProps {
    label: string
    dimension: 'horizontal' | 'vertical'
    sizeEm: number
}

const Axis: React.FC<AxisProps> = ({ label, dimension, sizeEm }) => {
    const axisStyle: {
        width?: string
        height?: string
    } = {
        width: '100%',
        height: '100%'
    }

    axisStyle[dimension === 'horizontal' ? 'height' : 'width'] = `${sizeEm}em`;
    const beginningArrowClass = dimension === 'horizontal' ? 'caret-left' : 'caret-down';
    const endingArrowClass = beginningArrowClass === 'caret-down' ? 'caret-up' : 'caret-right';

    return (
        <div className={`axis-wrapper ${dimension}`} style={axisStyle}>
            <div className="line">
                <i className={`arrow start-arrow pi pi-${beginningArrowClass}`}></i>
                <span className="axis-label">{label}</span>
                <i className={`arrow end-arrow pi pi-${endingArrowClass}`}></i>
            </div>
        </div>
    );
};

export default Axis;
