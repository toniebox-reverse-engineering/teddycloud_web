import { MenuProps } from "antd";
import { BorderOuterOutlined } from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";

export const TonieboxesSubNav = () => {
  const { t } = useTranslation();

  const subnav: MenuProps["items"] = [
    {
      key: "tonieboxes",
      label: (
        <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link>
      ),
      icon: React.createElement(BorderOuterOutlined),
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