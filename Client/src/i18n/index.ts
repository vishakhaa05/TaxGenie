import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en";
import hiTranslations from "./locales/hi";

// Default strictly to English as requested
const savedLanguage = localStorage.getItem("taxgenie_lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations },
  },
  lng: savedLanguage === "hi" ? "hi" : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
