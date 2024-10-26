import { Spin } from "antd";

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
