import React from "react";
import { Button, Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const NotificationButton: React.FC<{ notificationCount: number }> = ({ notificationCount }) => {
    const navigate = useNavigate();

    return (
        <Badge
            dot={notificationCount > 0}
            offset={[-2, 2]}
            style={{
                color: "#595959",
                borderColor: "#000",
            }}
        >
            <Button
                shape="circle"
                icon={<BellOutlined />}
                size="small"
                onClick={() => navigate("/settings/notifications")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    color: "#595959",
                    borderColor: "#d9d9d9",
                }}
            />
        </Badge>
    );
};

export default NotificationButton;
