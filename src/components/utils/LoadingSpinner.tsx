import { Spin, theme } from "antd";
const { useToken } = theme;

interface LoadingSpinnerAsOverlayProps {
    parentRef: React.RefObject<HTMLDivElement>; // Reference to the parent element
}

export const LoadingSpinnerAsOverlay: React.FC<LoadingSpinnerAsOverlayProps> = ({ parentRef }) => {
    const { token } = useToken();

    const overlayStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: token.colorBgContainer,
        opacity: 0.6,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
    };

    return (
        <div style={overlayStyle}>
            <Spin style={{ position: "absolute", top: 250 }} size="default" />
        </div>
    );
};

const LoadingSpinner: React.FC = () => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
                minHeight: "100px",
            }}
        >
            <Spin size="default" />
        </div>
    );
};

export default LoadingSpinner;
