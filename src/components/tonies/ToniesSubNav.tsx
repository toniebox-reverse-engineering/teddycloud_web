import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import {
    UserOutlined,
    SettingOutlined,
    BookOutlined,
    SoundOutlined,
    CloudUploadOutlined,
    UnorderedListOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import i18n from "../../i18n";

import { useTeddyCloud } from "../../TeddyCloudContext";
import { StyledSubMenu } from "../StyledComponents";
import ToniesCustomJsonEditor from "./ToniesCustomJsonEditor";

export const ToniesSubNav = () => {
    const { t } = useTranslation();
    const { setNavOpen, setSubNavOpen, setCurrentTCSection } = useTeddyCloud();
    const [showAddCustomTonieModal, setShowAddCustomTonieModal] = useState<boolean>(false);
    const [selectedKey, setSelectedKey] = useState("");
    const currentLanguage = i18n.language;

    useEffect(() => {
        setCurrentTCSection(t("tonies.tonies.navigationTitle"));
    }, [currentLanguage]);

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
        setSelectedKey("");
    };

    const subnav: MenuProps["items"] = [
        {
            key: "tonies",
            label: (
                <Link
                    to="/tonies"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.tonies.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(UserOutlined),
            title: t("tonies.tonies.navigationTitle"),
        },
        {
            key: "custom-json",
            label: (
                <label
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "currentColor",
                        cursor: "pointer",
                    }}
                >
                    {t("tonies.addToniesCustomJsonEntry")}
                </label>
            ),
            onClick: () => {
                handleAddNewCustomButtonClick();
                setNavOpen(false);
                setSubNavOpen(false);
            },
            icon: React.createElement(UserAddOutlined),
            title: t("tonies.addToniesCustomJsonEntry"),
        },
        {
            key: "encoder",
            label: (
                <Link
                    to="/tonies/encoder"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.encoder.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(CloudUploadOutlined),
            title: t("tonies.encoder.navigationTitle"),
        },
        {
            key: "tap",
            label: (
                <Link
                    to="/tonies/tap"
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "currentColor",
                    }}
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.tap.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(UnorderedListOutlined),
            title: t("tonies.tap.navigationTitle"),
        },
        {
            key: "library",
            label: (
                <Link
                    to="/tonies/library"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.library.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(BookOutlined),
            title: t("tonies.library.navigationTitle"),
        },
        {
            key: "content",
            label: (
                <Link
                    to="/tonies/content"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.content.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(SoundOutlined),
            title: t("tonies.content.navigationTitle"),
        },
        {
            key: "system-sounds",
            label: (
                <Link
                    to="/tonies/system-sounds"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("tonies.system-sounds.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(SettingOutlined),
            title: t("tonies.system-sounds.navigationTitle"),
        },
    ];

    return (
        <>
            <StyledSubMenu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={["sub"]} items={subnav} />
            {showAddCustomTonieModal && (
                <ToniesCustomJsonEditor
                    open={showAddCustomTonieModal}
                    onClose={() => setShowAddCustomTonieModal(false)}
                />
            )}
        </>
    );
};
