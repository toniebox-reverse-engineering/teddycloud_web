import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { MenuProps } from "antd";
import { StyledSubMenu } from "../StyledComponents";
import { TonieboxIcon } from "../../utils/tonieboxIcon";
import { DeliveredProcedureOutlined, PlusSquareOutlined, SearchOutlined } from "@ant-design/icons";

export const TonieboxesSubNav = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const updateOpenKeys = (pathname: string) => {
        const newKeys: string[] = [];

        if (pathname.includes("/tonieboxes/boxsetup")) {
            newKeys.push("boxsetup");
            if (pathname.includes("/tonieboxes/boxsetup/esp32")) {
                newKeys.push("esp32");
            } else if (pathname.includes("/tonieboxes/boxsetup/cc3200")) {
                newKeys.push("cc3200");
            } else if (pathname.includes("/tonieboxes/boxsetup/cc3235")) {
                newKeys.push("cc3235");
            }
        }

        setOpenKeys((prevKeys) => Array.from(new Set([...prevKeys, ...newKeys])));
    };

    useEffect(() => {
        updateOpenKeys(location.pathname);
    }, [location.pathname]);

    const onOpenChange = (keys: string[]) => {
        const latestOpenKey = keys.find((key) => !openKeys.includes(key)); // New key being opened
        const latestCloseKey = openKeys.find((key) => !keys.includes(key)); // Key being closed

        if (latestOpenKey) {
            setOpenKeys((prevKeys) => [...prevKeys, latestOpenKey]);
        } else if (latestCloseKey) {
            setOpenKeys((prevKeys) => prevKeys.filter((key) => key !== latestCloseKey));
        }
    };

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
            key: "identifyboxversion",
            label: (
                <Link to="/tonieboxes/boxsetup/identifyboxversion">
                    {t("tonieboxes.boxSetup.identifyVersion.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(SearchOutlined),
            title: t("tonieboxes.boxSetup.identifyVersion.navigationTitle"),
        },
        {
            key: "openbox",
            label: (
                <Link to="/tonieboxes/boxsetup/openboxguide">
                    {t("tonieboxes.boxSetup.openBoxGuide.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(PlusSquareOutlined),
            title: t("tonieboxes.boxSetup.openBoxGuide.navigationTitle"),
        },
        /*
        {
            key: "boxsetup",
            label: (
                <Link to="/tonieboxes/boxsetup" style={{ marginLeft: 8 }}>
                    {t("tonieboxes.boxsetup.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.boxsetup.navigationTitle"),
            children: [
                {
                    key: "identifyboxversion",
                    label: (
                        <Link to="/tonieboxes/boxsetup/identifyboxversion">
                            {t("tonieboxes.boxsetup.identifyBoxVersion.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(SearchOutlined),
                    title: t("tonieboxes.boxsetup.identifyBoxVersion.navigationTitle"),
                },
                {
                    key: "esp32",
                    label: (
                        <Link to="/tonieboxes/boxsetup/esp32/flashing">
                            {t("tonieboxes.boxsetup.esp32.boxflashing.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(DeliveredProcedureOutlined),
                    title: t("tonieboxes.boxsetup.esp32.boxflashing.navigationTitle"),
                    children: [
                        {
                            key: "esp32legacy",
                            label: (
                                <Link to="/tonieboxes/boxsetup/esp32/legacy">
                                    {t("tonieboxes.boxsetup.esp32.legacy.navigationTitle")}
                                </Link>
                            ),
                            icon: React.createElement(SearchOutlined),
                            title: t("tonieboxes.boxsetup.esp32.legacy.navigationTitle"),
                        },
                    ],
                },
                {
                    key: "cc3200",
                    label: (
                        <Link to="/tonieboxes/boxsetup/cc3200/flashing">
                            {t("tonieboxes.boxsetup.cc3200.boxflashing.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(DeliveredProcedureOutlined),
                    title: t("tonieboxes.boxsetup.cc3200.boxflashing.navigationTitle"),
                    children: [
                        {
                            key: "cc3200altUrlPatch",
                            label: (
                                <Link to="/tonieboxes/boxsetup/cc3200/alturlpatch">
                                    {t("tonieboxes.boxsetup.cc3200.alturlpatch.navigationTitle")}
                                </Link>
                            ),
                            icon: React.createElement(SearchOutlined),
                            title: t("tonieboxes.boxsetup.cc3200.alturlpatch.navigationTitle"),
                        },
                    ],
                },
                {
                    key: "cc3235",
                    label: (
                        <Link to="/tonieboxes/boxsetup/cc3235/flashing">
                            {t("tonieboxes.boxsetup.cc3235.boxflashing.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(DeliveredProcedureOutlined),
                    title: t("tonieboxes.boxsetup.cc3235.boxflashing.navigationTitle"),
                },
            ],
        },
        */
        {
            key: "esp32boxflashing",
            label: (
                <Link to="/tonieboxes/boxsetup/esp32/flashing">{t("tonieboxes.esp32BoxFlashing.navigationTitle")}</Link>
            ),
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.esp32BoxFlashing.navigationTitle"),
        },
        {
            key: "cc3200boxflashing",
            label: (
                <Link to="/tonieboxes/boxsetup/cc3200/flashing">
                    {t("tonieboxes.cc3200BoxFlashing.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.cc3200BoxFlashing.navigationTitle"),
        },
        {
            key: "cc3235boxflashing",
            label: (
                <Link to="/tonieboxes/boxsetup/cc3235/flashing">
                    {t("tonieboxes.cc3235BoxFlashing.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(DeliveredProcedureOutlined),
            title: t("tonieboxes.cc3235BoxFlashing.navigationTitle"),
        },
    ];

    return (
        <StyledSubMenu
            mode="inline"
            defaultOpenKeys={["boxsetup"]}
            //openKeys={openKeys}
            selectedKeys={[]}
            //onOpenChange={onOpenChange}
            items={subnav}
        />
    );
};
