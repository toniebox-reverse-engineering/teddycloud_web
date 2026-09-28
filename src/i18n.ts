import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { USER_STORAGE_SCOPE_EVENT, userStorage } from "./utils/storage/userStorage";

const cacheBuster = "202511242019";

i18n.use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        supportedLngs: ["en", "de", "fr", "es"],
        fallbackLng: "en",

        ns: ["teddycloud"],
        defaultNS: "teddycloud",

        load: "languageOnly",
        nonExplicitSupportedLngs: true,

        debug: false,

        backend: {
            loadPath: `${import.meta.env.VITE_APP_TEDDYCLOUD_WEB_BASE}/translations/{{lng}}.json?v=${cacheBuster}`,
            crossDomain: false,
        },

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: [],
        },
    });

// The language is a per-user setting: keep a copy in the user's storage and switch when the user changes.
const LANGUAGE_KEY = "i18nextLng";

i18n.on("languageChanged", (lng) => {
    userStorage.setItem(LANGUAGE_KEY, lng);
});

window.addEventListener(USER_STORAGE_SCOPE_EVENT, () => {
    const saved = userStorage.getItem(LANGUAGE_KEY);
    if (saved && saved !== i18n.language) {
        i18n.changeLanguage(saved);
    }
});

export default i18n;
