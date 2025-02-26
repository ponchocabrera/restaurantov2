import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="p-2">
      <button
        className={`mr-2 ${language === "en" ? "font-bold" : ""}`}
        onClick={() => toggleLanguage("en")}
      >
        English
      </button>
      <button
        className={`${language === "es" ? "font-bold" : ""}`}
        onClick={() => toggleLanguage("es")}
      >
        Español
      </button>
    </div>
  );
}
