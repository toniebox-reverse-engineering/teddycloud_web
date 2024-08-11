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
            title: t("tonieboxes.navigationTitle"),
        },
        {
            key: "esp32boxflashing",
            label: <Link to="/tonieboxes/esp32boxflashing">{t("tonieboxes.esp32BoxFlashing.navigationTitle")}</Link>,
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.esp32BoxFlashing.navigationTitle"),
        },
        {
            key: "cc3200boxflashing",
            label: <Link to="/tonieboxes/cc3200boxflashing">{t("tonieboxes.cc3200BoxFlashing.navigationTitle")}</Link>,
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.cc3200BoxFlashing.navigationTitle"),
        },
        {
            key: "cc3235boxflashing",
            label: <Link to="/tonieboxes/cc3235boxflashing">{t("tonieboxes.cc3235BoxFlashing.navigationTitle")}</Link>,
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.cc3235BoxFlashing.navigationTitle"),
        },
    ];

    return <StyledSubMenu mode="inline" defaultOpenKeys={["sub"]} items={subnav} />;
};
