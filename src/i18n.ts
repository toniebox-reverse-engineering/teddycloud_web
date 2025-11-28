import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

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
            caches: ["localStorage"],
        },
    });

export default i18n;
