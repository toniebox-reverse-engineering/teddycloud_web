import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import { StyledSubMenu } from "../StyledComponents";
import { TonieboxIcon } from "../../utils/tonieboxIcon";
import { DeliveredProcedureOutlined } from "@ant-design/icons";

export const TonieboxesSubNav = () => {
    const { t } = useTranslation();

    const subnav: MenuProps["items"] = [
        {
            key: "tonieboxes",
            label: (
                <Link to="/tonieboxes" style={{ marginLeft: 8 }}>
                    {t("tonieboxes.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(TonieboxIcon),
        },
        {
            key: "esp32boxflashing",
            label: <Link to="/tonieboxes/esp32boxflashing">{t("tonieboxes.esp32BoxFlashing.navigationTitle")}</Link>,
            icon: React.createElement(DeliveredProcedureOutlined),
        },
    ];

    return (
        <StyledSubMenu
            mode="inline"
            //defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub"]}
            items={subnav}
        />
    );
};
