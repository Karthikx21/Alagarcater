import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  
  // Initialize with i18n current language, default to English
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage');
      return (savedLanguage === 'en' || savedLanguage === 'ta') ? savedLanguage : 'en';
    }
    return 'en';
  });

  // Sync with i18n when language changes
  useEffect(() => {
    if (i18n && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    localStorage.setItem('preferredLanguage', language);
  }, [language, i18n]);

  // Initialize i18n language on mount
  useEffect(() => {
    if (i18n && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ta' : 'en';
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      toggleLanguage 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}