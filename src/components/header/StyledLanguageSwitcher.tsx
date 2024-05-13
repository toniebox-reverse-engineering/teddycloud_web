import { changeLanguage } from "i18next";
import { Dropdown, MenuProps, Space, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { GlobalOutlined } from "@ant-design/icons";

export const StyledLanguageSwitcher = () => {
    const { t } = useTranslation();

    const items: MenuProps["items"] = [
        {
            key: "1",
            label: t("language.english"),
            onClick: () => changeLanguage("en"),
        },
        {
            key: "2",
            label: t("language.german"),
            onClick: () => changeLanguage("de"),
        },
    ];

    return (
        <Space>
            <Dropdown menu={{ items }} trigger={["click"]}>
                <a onClick={(e) => e.preventDefault()} title={t("language.change")}>
                    <Tag color="transparent">
                        <GlobalOutlined />
                    </Tag>
                </a>
            </Dropdown>
        </Space>
    );
};
