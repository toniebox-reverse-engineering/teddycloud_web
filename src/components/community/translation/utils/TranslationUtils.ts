export interface TranslationEntry {
    question: string;
    answer: string;
}

export interface Translations {
    [key: string]: string | Translations | TranslationEntry[];
}

export const LANGUAGES = ["en", "fr", "de", "es"] as const;
export const BASE_LANG = "en";

export type LanguageCode = (typeof LANGUAGES)[number];

export const collectAllKeys = (obj: Translations, parentKey = ""): string[] => {
    const keys: string[] = [];

    Object.keys(obj).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        if (Array.isArray(obj[key])) {
            (obj[key] as TranslationEntry[]).forEach((_, index) => {
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

export const findMissingKeys = (baseObj: Translations, otherObj: Translations, parentKey = ""): string[] => {
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
                const baseArray = baseObj[key] as TranslationEntry[];
                const otherArray = otherObj[key] as TranslationEntry[];
                baseArray.forEach((_, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
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

export const findExtraKeys = (baseObj: Translations, otherObj: Translations, parentKey = ""): string[] => {
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
                const otherArray = otherObj[key] as TranslationEntry[];
                const baseArray = baseObj[key] as TranslationEntry[];
                otherArray.forEach((_, index) => {
                    const questionKey = `${fullKey}[${index}].question`;
                    const answerKey = `${fullKey}[${index}].answer`;
                    if (!baseArray[index]) {
                        extraKeys.push(questionKey, answerKey);
                    }
                });
            }
        } else if (typeof otherObj[key] === "object" && otherObj[key] !== null) {
            if (!(key in baseObj) || typeof baseObj[key] !== "object") {
                extraKeys.push(...collectAllKeys(otherObj[key] as Translations, fullKey));
            } else {
                extraKeys.push(...findExtraKeys(baseObj[key] as Translations, otherObj[key] as Translations, fullKey));
            }
        } else if (!(key in baseObj)) {
            extraKeys.push(fullKey);
        }
    });

    return extraKeys;
};

export async function fetchTranslations(languages: readonly LanguageCode[]): Promise<Record<string, Translations>> {
    const fetchedTranslations: Record<string, Translations> = {};

    for (const lang of languages) {
        const url =
            import.meta.env.MODE === "production"
                ? `${import.meta.env.VITE_APP_TEDDYCLOUD_API_URL}/web/translations/${lang}.json`
                : `/web/translations/${lang}.json`;

        const response = await fetch(url);
        const data: Translations = await response.json();
        fetchedTranslations[lang] = data;
    }

    return fetchedTranslations;
}
