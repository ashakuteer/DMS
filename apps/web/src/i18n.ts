import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import teCommon from "./locales/te/common.json";
import hiCommon from "./locales/hi/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      te: { common: teCommon },
      hi: { common: hiCommon },
    },
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: ["en", "te", "hi"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
