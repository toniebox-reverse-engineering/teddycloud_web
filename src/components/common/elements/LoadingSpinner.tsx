import React from "react";
import { Spin, theme } from "antd";

const { useToken } = theme;

interface LoadingSpinnerAsOverlayProps {
    parentRef: React.RefObject<HTMLDivElement | null>;
}

export const LoadingSpinnerAsOverlay: React.FC<LoadingSpinnerAsOverlayProps> = ({ parentRef }) => {
    const { token } = useToken();

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: token.colorBgContainer,
                opacity: 0.6,
                zIndex: 2000,
            }}
        >
            <Spin style={{ position: "absolute", top: "min(50%, 250px)" }} size="default" />
        </div>
    );
};

export const LoadingSpinner: React.FC = () => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
                minHeight: 100,
            }}
        >
            <Spin size="default" />
        </div>
    );
};

export default LoadingSpinner;
