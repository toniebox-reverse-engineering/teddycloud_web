import React, { useEffect, useState } from "react";
import "./matrixRain.css";

const MatrixRain = () => {
    const [columns, setColumns] = useState<number[]>([]);

    useEffect(() => {
        const colCount = Math.floor(window.innerWidth / 15);
        setColumns(Array.from({ length: colCount }, (_, i) => i));
    }, []);

    const getRandomChar = () => {
        const chars = "アァイィウゥエェオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return chars[Math.floor(Math.random() * chars.length)];
    };

    return (
        <div className="matrix-bg">
            {columns.map((col, i) => (
                <div
                    key={i}
                    className="matrix-column"
                    style={{
                        left: `${col * 15}px`,
                        animationDelay: `${Math.random() * 20}s`,
                        animationDuration: `${Math.random() * 12 + 5}s`,
                        fontSize: `${Math.floor(Math.random() * (22 - 14 + 1)) + 10}px`,
                    }}
                >
                    {Array.from({ length: 30 }).map((_, j) => (
                        <span className="matrix-char" key={j}>
                            {getRandomChar()}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MatrixRain;
