import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, type TranslationDict, translations } from '../utils/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;
  toggleLang: () => void;
  toggleLanguage: () => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('festival_language');
      // New visitors must start in Telugu. Returning visitors may retain saved choice.
      return saved === 'en' ? 'en' : 'te';
    } catch {
      return 'te';
    }
  });

  const setLang = (newLang: Language) => {
    const safeLang: Language = newLang === 'en' ? 'en' : 'te';
    setLangState(safeLang);
    try {
      localStorage.setItem('festival_language', safeLang);
      document.documentElement.lang = safeLang;
    } catch {
      // storage unavailable fallback
    }
  };

  const toggleLang = () => {
    setLang(lang === 'te' ? 'en' : 'te');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.te;

  return (
    <LanguageContext.Provider value={{ lang, setLang, setLanguage: setLang, toggleLang, toggleLanguage: toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
