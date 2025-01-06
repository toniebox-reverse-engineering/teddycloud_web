import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";

interface TranslationEntry {
    question: string;
    answer: string;
}

interface Translations {
    [key: string]: string | Translations | TranslationEntry[];
}

const collectAllKeys = (obj: Translations, parentKey = ""): string[] => {
    const keys: string[] = [];

    Object.keys(obj).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (Array.isArray(obj[key])) {
            (obj[key] as TranslationEntry[]).forEach((_, index) => {
                // Construct unique keys for each question and answer in the FAQ
                keys.push(`${fullKey}[${index}].question`, `${fullKey}[${index}].answer`);
            });
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            keys.push(...collectAllKeys(obj[key] as Translations, fullKey));
        } else {
            keys.push(fullKey);
        }
    });

    return keys;
};

const getValueFromKey = (obj: Translations, keyPath: string): string | undefined => {
    const keys = keyPath.split(".");
    let value: any = obj;

    for (let key of keys) {
        // Check if the key has an array index, e.g., 'faq[0]'
        if (key.includes("[")) {
            const [arrayKey, indexPart] = key.split("["); // Split 'faq[0]' into 'faq' and '0]'
            const index = parseInt(indexPart.replace("]", ""), 10); // Extract the index number

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

interface DataType {
    key: string;
    [key: string]: any;
}

const TranslationTable: React.FC = () => {
    const { t } = useTranslation();
    const [translations, setTranslations] = useState<Record<string, Translations>>({});
    const [loading, setLoading] = useState(true);

    const languages: string[] = ["en", "fr", "de", "es"];
    const baseLang: string = "en";

    useEffect(() => {
        const fetchTranslations = async () => {
            const fetchedTranslations: Record<string, Translations> = {};
            for (let lang of languages) {
                const response = await fetch(
                    import.meta.env.MODE === "production"
                        ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + `/web/translations/${lang}.json`
                        : `/web/translations/${lang}.json`
                );
                const data: Translations = await response.json();
                fetchedTranslations[lang] = data;
            }
            setTranslations(fetchedTranslations);
            setLoading(false);
        };
        fetchTranslations();
    }, []);

    if (loading) return <p>Loading translations...</p>;

    const allKeys = collectAllKeys(translations[baseLang]);

    const columns: ColumnsType<DataType> = [
        {
            title: t("community.translations.key"),
            dataIndex: "key",
            key: "key",
            width: "30%",
            fixed: "left",
            render: (text: string) => <div style={{ wordWrap: "break-word", wordBreak: "break-all" }}>{text}</div>,
        },
        ...languages.map((lang) => ({
            title: lang.toUpperCase(),
            dataIndex: lang,
            key: lang,
        })),
    ];

    const dataSource = allKeys.map((key) => {
        const row: any = { key };
        languages.forEach((lang) => {
            const value = getValueFromKey(translations[lang], key);
            row[lang] = value || "<" + t("community.translations.missing") + ">";
        });
        return row;
    });

    return (
        <>
            <h2>{t("community.translations.allTranslationStrings")}</h2>
            <Table
                size="small"
                columns={columns}
                scroll={{ x: "100%" }}
                dataSource={dataSource}
                rowKey="key"
                pagination={false} // Disable pagination for simplicity
            />
        </>
    );
};

export default TranslationTable;
