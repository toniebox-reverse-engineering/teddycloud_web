import React from "react";
import { Button, Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const NotificationButton: React.FC<{ notificationCount: number }> = ({ notificationCount }) => {
    const navigate = useNavigate();

    return (
        <Badge dot={notificationCount > 0} offset={[-2, 2]}>
            <Button
                shape="circle"
                icon={<BellOutlined />}
                size="small"
                onClick={() => navigate("/settings/notifications")}
            />
        </Badge>
    );
};

export default NotificationButton;
