import { MenuProps } from "antd";
import { LikeOutlined, CommentOutlined, DeploymentUnitOutlined, FireOutlined, BranchesOutlined } from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";

export const CommunitySubNav = () => {
  const { t } = useTranslation();

  const subnav: MenuProps["items"] = [
    {
      key: "community",
      label: <Link to="/community">{t("community.navigationTitle")}</Link>,
      icon: React.createElement(LikeOutlined),
    },
    {
      key: "contribution",
      label: <Link to="/community/contribution">{t("community.contribution.navigationTitle")}</Link>,
      icon: React.createElement(DeploymentUnitOutlined),
    },
    {
      key: "contributors",
      label: <Link to="/community/contributors">{t("community.contributors.navigationTitle")}</Link>,
      icon: React.createElement(FireOutlined),
    },
    {
      key: "changelog",
      label: <Link to="/community/changelog">{t("community.changelog.navigationTitle")}</Link>,
      icon: React.createElement(BranchesOutlined),
    },
    {
      key: "Forum",
      label: <Link to="https://forum.revvox.de/">{t("community.forum.navigationTitle")}</Link>,
      icon: React.createElement(CommentOutlined),
    },
  ];

  return (
    <StyledSubMenu
      mode="inline"
      defaultOpenKeys={["sub"]}
      items={subnav}
    />
  );
};
