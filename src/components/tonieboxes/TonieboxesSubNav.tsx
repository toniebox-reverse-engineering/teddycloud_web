import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import { StyledSubMenu } from "../StyledComponents";
import { TonieboxIcon } from "../../util/tonieboxIcon";

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
