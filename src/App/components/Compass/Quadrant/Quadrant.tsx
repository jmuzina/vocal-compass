import React from 'react';
import './Quadrant.scss';

interface QuadrantProps {
    label: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const Quadrant: React.FC<QuadrantProps> = ({ label, position }) => {
    return (
        <div className={`quadrant ${position}`}>
            <span className='quadrant-label'>{label}</span>
        </div>
    );
};

export default Quadrant;
