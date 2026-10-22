import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageSwitch = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");

  useEffect(() => {
    const handleLanguageChanged = (newLang: string) => {
      setLang(newLang);
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  const toggleLanguage = () => {
    const nextLang = lang.startsWith("hi") ? "en" : "hi";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("taxgenie_lang", nextLang);
    setLang(nextLang);
  };

  const isHindi = lang.startsWith("hi");

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
      title="Switch Language / भाषा बदलें"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-indigo-500" />
      <span>{isHindi ? "हिन्दी" : "EN"}</span>
    </button>
  );
};

export default LanguageSwitch;
