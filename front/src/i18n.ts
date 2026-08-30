import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

const stored = (() => {
  try {
    return localStorage.getItem("multitools-lang");
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en }, es: { translation: es } },
  lng: stored || navigator.language.split("-")[0] || "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem("multitools-lang", lng);
  } catch {}
});

export default i18n;
