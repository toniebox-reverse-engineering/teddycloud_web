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
            key: "en",
            label: t("language.english"),
            onClick: () => changeLanguage("en"),
        },
        {
            key: "de",
            label: t("language.german"),
            onClick: () => changeLanguage("de"),
        },
        {
            key: "fr",
            label: t("language.french"),
            onClick: () => changeLanguage("fr"),
        },
        {
            key: "es",
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
