import React, { useState } from "react";
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

import { StyledSubMenu } from "../StyledComponents";
import ToniesCustomJsonEditor from "./ToniesCustomJsonEditor";

export const ToniesSubNav = () => {
    const { t } = useTranslation();
    const [showAddCustomTonieModal, setShowAddCustomTonieModal] = useState<boolean>(false);
    const [selectedKey, setSelectedKey] = useState("");

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
        setSelectedKey("");
    };

    const subnav: MenuProps["items"] = [
        {
            key: "tonies",
            label: <Link to="/tonies">{t("tonies.tonies.navigationTitle")}</Link>,
            icon: React.createElement(UserOutlined),
            title: t("tonies.tonies.navigationTitle"),
        },
        {
            key: "custom-json",
            label: <label style={{ cursor: "pointer" }}>{t("tonies.addToniesCustomJsonEntry")}</label>,
            onClick: handleAddNewCustomButtonClick,
            icon: React.createElement(UserAddOutlined),
            title: t("tonies.addToniesCustomJsonEntry"),
        },
        {
            key: "encoder",
            label: <Link to="/tonies/encoder">{t("tonies.encoder.navigationTitle")}</Link>,
            icon: React.createElement(CloudUploadOutlined),
            title: t("tonies.encoder.navigationTitle"),
        },
        {
            key: "tap",
            label: <Link to="/tonies/tap">{t("tonies.tap.navigationTitle")}</Link>,
            icon: React.createElement(UnorderedListOutlined),
            title: t("tonies.tap.navigationTitle"),
        },
        {
            key: "library",
            label: <Link to="/tonies/library">{t("tonies.library.navigationTitle")}</Link>,
            icon: React.createElement(BookOutlined),
            title: t("tonies.library.navigationTitle"),
        },
        {
            key: "content",
            label: <Link to="/tonies/content">{t("tonies.content.navigationTitle")}</Link>,
            icon: React.createElement(SoundOutlined),
            title: t("tonies.content.navigationTitle"),
        },
        {
            key: "system-sounds",
            label: <Link to="/tonies/system-sounds">{t("tonies.system-sounds.navigationTitle")}</Link>,
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
