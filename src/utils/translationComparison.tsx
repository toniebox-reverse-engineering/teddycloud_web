import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TranslationEntry {
    question: string;
    answer: string;
}

interface Translations {
    [key: string]: string | Translations | TranslationEntry[]; // Updated to allow for TranslationEntry arrays
}

const findMissingKeys = (baseObj: Translations, otherObj: Translations, parentKey = ""): string[] => {
    const missingKeys: string[] = [];

    Object.keys(baseObj).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (Array.isArray(baseObj[key])) {
            if (!Array.isArray(otherObj[key])) {
                (baseObj[key] as TranslationEntry[]).forEach((_, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
                    missingKeys.push(questionKey, answerKey);
                });
            } else {
                (baseObj[key] as TranslationEntry[]).forEach((item, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
                    const otherArray = otherObj[key] as TranslationEntry[];
                    if (!otherArray[index]) {
                        missingKeys.push(questionKey, answerKey);
                    }
                });
            }
        } else if (typeof baseObj[key] === "object" && baseObj[key] !== null) {
            if (!(key in otherObj) || typeof otherObj[key] !== "object") {
                missingKeys.push(...collectAllKeys(baseObj[key] as Translations, fullKey));
            } else {
                missingKeys.push(
                    ...findMissingKeys(baseObj[key] as Translations, otherObj[key] as Translations, fullKey)
                );
            }
        } else if (!(key in otherObj)) {
            missingKeys.push(fullKey);
        }
    });

    return missingKeys;
};

const collectAllKeys = (obj: Translations, parentKey = ""): string[] => {
    const keys: string[] = [];

    Object.keys(obj).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (Array.isArray(obj[key])) {
            // Handle array of TranslationEntry
            (obj[key] as TranslationEntry[]).forEach((item, index) => {
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

const findExtraKeys = (baseObj: Translations, otherObj: Translations, parentKey = ""): string[] => {
    const extraKeys: string[] = [];

    Object.keys(otherObj).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (Array.isArray(otherObj[key])) {
            if (!Array.isArray(baseObj[key])) {
                (otherObj[key] as TranslationEntry[]).forEach((_, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
                    extraKeys.push(questionKey, answerKey);
                });
            } else {
                (otherObj[key] as TranslationEntry[]).forEach((_, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
                    const baseArray = baseObj[key] as TranslationEntry[];
                    if (!baseArray[index]) {
                        extraKeys.push(questionKey, answerKey);
                    }
                });
            }
        } else if (typeof otherObj[key] === "object" && otherObj[key] !== null) {
            if (!baseObj[key] || typeof baseObj[key] !== "object") {
                extraKeys.push(fullKey);
            } else {
                extraKeys.push(...findExtraKeys(baseObj[key] as Translations, otherObj[key] as Translations, fullKey));
            }
        } else if (!(key in baseObj)) {
            extraKeys.push(fullKey);
        }
    });

    return extraKeys;
};

const TranslationComparison: React.FC = () => {
    const { t } = useTranslation();
    const [translations, setTranslations] = useState<Record<string, Translations>>({});
    const [missingKeys, setMissingKeys] = useState<Record<string, string[]>>({});
    const [extraKeys, setExtraKeys] = useState<Record<string, string[]>>({});
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

    useEffect(() => {
        if (!loading && translations[baseLang]) {
            const baseTranslations = translations[baseLang];
            const missing: Record<string, string[]> = {};
            const extra: Record<string, string[]> = {};
            languages.forEach((lang) => {
                if (lang !== baseLang) {
                    const otherTranslations = translations[lang];
                    missing[lang] = findMissingKeys(baseTranslations, otherTranslations);
                    extra[lang] = findExtraKeys(baseTranslations, otherTranslations);
                }
            });

            setMissingKeys(missing);
            setExtraKeys(extra);
        }
    }, [loading, translations]);

    if (loading) return <p>Loading translations...</p>;

    return (
        <>
            <h2>{t("community.translations.missingExtraKeysHeadline")}</h2>
            {languages.every(
                (lang) => lang === baseLang || (missingKeys[lang]?.length === 0 && extraKeys[lang]?.length === 0)
            ) ? (
                <p>{t("community.translations.noDiscrepancies")}</p>
            ) : (
                <div>
                    {languages.map(
                        (lang) =>
                            lang !== baseLang && (
                                <div key={lang}>
                                    <h2>
                                        {t("community.translations.language")}: {lang.toUpperCase()}
                                    </h2>

                                    <h3>{t("community.translations.missingKeys")}</h3>
                                    {missingKeys[lang]?.length > 0 ? (
                                        <ul>
                                            {missingKeys[lang].map((key, index) => (
                                                <li key={index}>{key}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{t("community.translations.noMissingKeys")}</p>
                                    )}

                                    <h3>{t("community.translations.extraKeys")}:</h3>
                                    {extraKeys[lang]?.length > 0 ? (
                                        <ul>
                                            {extraKeys[lang].map((key, index) => (
                                                <li key={index}>{key}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>{t("community.translations.noExtraKeys")}</p>
                                    )}
                                </div>
                            )
                    )}
                </div>
            )}
        </>
    );
};

export default TranslationComparison;
