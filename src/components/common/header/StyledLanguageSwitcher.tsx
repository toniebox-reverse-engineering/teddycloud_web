import { useTranslation } from "react-i18next";
import { Dropdown, Space, Tag } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export const StyledLanguageSwitcher = () => {
    const { t, i18n } = useTranslation();

    const LANGS = [
        { key: "en", label: t("language.english") },
        { key: "de", label: t("language.german") },
        { key: "fr", label: t("language.french") },
        { key: "es", label: t("language.spanish") },
    ];

    const currentLanguage = i18n.language;
    const currentLabel = LANGS.find((l) => l.key === currentLanguage)?.label ?? currentLanguage;

    return (
        <div style={{ marginRight: 8 }}>
            <Space style={{ marginRight: -8 }}>
                <Dropdown
                    trigger={["click"]}
                    menu={{
                        items: LANGS.map((l) => ({
                            ...l,
                            onClick: () => i18n.changeLanguage(l.key),
                        })),
                    }}
                >
                    <Link to="/" onClick={(e) => e.preventDefault()} title={t("language.change")}>
                        <Tag style={{ fontSize: "unset", backgroundColor: "transparent", border: 0, color: "white" }}>
                            <GlobalOutlined /> {currentLabel}
                        </Tag>
                    </Link>
                </Dropdown>
            </Space>
        </div>
    );
};
