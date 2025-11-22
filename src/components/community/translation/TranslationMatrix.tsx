import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Translations, fetchTranslations, LANGUAGES, BASE_LANG, collectAllKeys } from "./utils/TranslationUtils";

interface DataType {
    key: string;
    [key: string]: any;
}

const TranslationTable: React.FC = () => {
    const { t } = useTranslation();
    const [translations, setTranslations] = useState<Record<string, Translations>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const fetched = await fetchTranslations(LANGUAGES);
                setTranslations(fetched);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const allKeys = useMemo(
        () => (translations[BASE_LANG] ? collectAllKeys(translations[BASE_LANG]) : []),
        [translations]
    );

    const columns: ColumnsType<DataType> = useMemo(
        () => [
            {
                title: t("community.translations.key"),
                dataIndex: "key",
                key: "key",
                width: "30%",
                fixed: "left",
                render: (text: string) => <div style={{ wordWrap: "break-word", wordBreak: "break-all" }}>{text}</div>,
            },
            ...LANGUAGES.map((lang) => ({
                title: lang.toUpperCase(),
                dataIndex: lang,
                key: lang,
            })),
        ],
        [t]
    );

    const dataSource = useMemo(
        () =>
            allKeys.map((key) => {
                const row: DataType = { key };
                LANGUAGES.forEach((lang) => {
                    const value = getValueFromKey(translations[lang], key);
                    row[lang] = value || "<" + t("community.translations.missing") + ">";
                });
                return row;
            }),
        [allKeys, translations, t]
    );

    if (loading) return <p>Loading translations...</p>;
    if (!translations[BASE_LANG]) return null;

    return (
        <>
            <h2>{t("community.translations.allTranslationStrings")}</h2>
            <Table
                size="small"
                columns={columns}
                scroll={{ x: "100%" }}
                dataSource={dataSource}
                rowKey="key"
                pagination={false}
            />
        </>
    );
};

const getValueFromKey = (obj: Translations | undefined, keyPath: string): string | undefined => {
    if (!obj) return undefined;

    const keys = keyPath.split(".");
    let value: any = obj;

    for (const key of keys) {
        if (key.includes("[")) {
            const [arrayKey, indexPart] = key.split("[");
            const index = parseInt(indexPart.replace("]", ""), 10);

            value = value[arrayKey];
            if (Array.isArray(value)) {
                value = value[index];
            } else {
                return undefined;
            }
        } else {
            value = value ? value[key] : undefined;
        }

        if (value === undefined) {
            return undefined;
        }
    }

    return typeof value === "string" ? value : undefined;
};

export default TranslationTable;
