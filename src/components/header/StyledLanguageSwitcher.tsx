import { useTranslation } from "react-i18next";
import { Dropdown, Space, Tag } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export const StyledLanguageSwitcher = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string | undefined) => {
        i18n.changeLanguage(lng);
    };

    const items = [
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
        {
            key: "3",
            label: t("language.french"),
            onClick: () => changeLanguage("fr"),
        },
        {
            key: "4",
            label: t("language.spanish"),
            onClick: () => changeLanguage("es"),
        },
    ];

    const currentLanguage = i18n.language;

    return (
        <Space style={{ marginRight: -8 }}>
            <Dropdown menu={{ items }} trigger={["click"]}>
                <Link to="/" onClick={(e) => e.preventDefault()} title={t("language.change")}>
                    <Tag color="transparent" style={{ fontSize: "unset" }}>
                        <GlobalOutlined />{" "}
                        {items.find((item) => item.onClick && item.onClick.toString().includes(currentLanguage))?.label}
                    </Tag>
                </Link>
            </Dropdown>
        </Space>
    );
};
