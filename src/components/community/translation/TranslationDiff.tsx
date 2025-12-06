import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Translations,
    fetchTranslations,
    LANGUAGES,
    BASE_LANG,
    findMissingKeys,
    findExtraKeys,
} from "./utils/TranslationUtils";

const TranslationDiff: React.FC = () => {
    const { t } = useTranslation();
    const [translations, setTranslations] = useState<Record<string, Translations>>({});
    const [missingKeys, setMissingKeys] = useState<Record<string, string[]>>({});
    const [extraKeys, setExtraKeys] = useState<Record<string, string[]>>({});
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

    useEffect(() => {
        if (!loading && translations[BASE_LANG]) {
            const baseTranslations = translations[BASE_LANG];
            const missing: Record<string, string[]> = {};
            const extra: Record<string, string[]> = {};

            LANGUAGES.forEach((lang) => {
                if (lang !== BASE_LANG) {
                    const otherTranslations = translations[lang];
                    if (!otherTranslations) {
                        missing[lang] = [];
                        extra[lang] = [];
                        return;
                    }
                    missing[lang] = findMissingKeys(baseTranslations, otherTranslations);
                    extra[lang] = findExtraKeys(baseTranslations, otherTranslations);
                }
            });

            setMissingKeys(missing);
            setExtraKeys(extra);
        }
    }, [loading, translations]);

    if (loading) return <p>Loading translations...</p>;

    const hasNoDiscrepancies = LANGUAGES.every(
        (lang) => lang === BASE_LANG || (missingKeys[lang]?.length === 0 && extraKeys[lang]?.length === 0)
    );

    return (
        <>
            <h2>{t("community.translations.missingExtraKeysHeadline")}</h2>
            {hasNoDiscrepancies ? (
                <p>{t("community.translations.noDiscrepancies")}</p>
            ) : (
                <div>
                    {LANGUAGES.map(
                        (lang) =>
                            lang !== BASE_LANG && (
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

export default TranslationDiff;
