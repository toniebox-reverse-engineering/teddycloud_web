import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { MenuProps } from "antd";
import { AppstoreOutlined, ExportOutlined, ReadOutlined } from "@ant-design/icons";

import { TEDDYBOXES_GUIDE_ROUTE, TEDDYBOXES_ROUTE } from "../../constants/teddybox";
import { useTeddyCloud } from "../../provider/TeddyCloudProvider";
import { TeddyCloudSection } from "../../types/pluginsMetaTypes";
import { StyledSubMenu } from "../common/StyledComponents";

export const TeddyBoxesSubNav = () => {
    const { t, i18n } = useTranslation();
    const { setNavOpen, setSubNavOpen, setCurrentTCSection, plugins } = useTeddyCloud();
    const location = useLocation();
    const currentLanguage = i18n.language;

    useEffect(() => {
        setCurrentTCSection(t("teddybox.title"));
    }, [currentLanguage]);

    const close = () => {
        setNavOpen(false);
        setSubNavOpen(false);
    };

    const pluginItems = plugins
        .filter((p) => p.teddyCloudSection === TeddyCloudSection.Teddyboxes && !p.hideInNav)
        .map((plugin) => ({
            key: `plugin-${plugin.pluginId}`,
            label: (
                <Link
                    to={
                        plugin.standalone
                            ? `/plugin/${plugin.pluginId}`
                            : `${TEDDYBOXES_ROUTE}/plugin/${plugin.pluginId}`
                    }
                    onClick={close}
                    target={plugin.standalone ? "_blank" : "_self"}
                >
                    {plugin.pluginName}
                    {plugin.standalone ? (
                        <ExportOutlined
                            style={{ marginLeft: 2, fontSize: 6, bottom: 6, position: "relative" }}
                        />
                    ) : (
                        ""
                    )}
                </Link>
            ),
            icon: React.createElement(plugin.icon),
            title: plugin.pluginName,
        }));

    const subnav: MenuProps["items"] = [
        {
            key: TEDDYBOXES_ROUTE,
            label: (
                <Link to={TEDDYBOXES_ROUTE} onClick={close}>
                    {t("teddybox.title")}
                </Link>
            ),
            icon: React.createElement(AppstoreOutlined),
            title: t("teddybox.title"),
        },
        {
            key: TEDDYBOXES_GUIDE_ROUTE,
            label: (
                <Link to={TEDDYBOXES_GUIDE_ROUTE} onClick={close}>
                    {t("teddybox.guide.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(ReadOutlined),
            title: t("teddybox.guide.navigationTitle"),
        },
        ...pluginItems,
    ];

    return <StyledSubMenu mode="inline" selectedKeys={[location.pathname]} items={subnav} />;
};
