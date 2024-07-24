import React, { useState, useEffect } from 'react';

const DotAnimation = () => {
    const [dots, setDots] = useState(0);
    const dotFrames = ['.', '..', '...', '....', '.....'];

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prevDots => (prevDots + 1) % dotFrames.length);
        }, 500); // Adjust the speed of the animation here (500ms)

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    return (
        <div>
            {dotFrames[dots]}
        </div>
    );
};

export default DotAnimation;