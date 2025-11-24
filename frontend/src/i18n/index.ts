import { create } from 'zustand';
import { translations, Language } from './translations';
import { I18nManager } from 'react-native';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (category: string, key: string) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'en',
  
  setLanguage: (lang: Language) => {
    const isRTL = lang === 'ar' || lang === 'he';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
    }
    set({ language: lang });
  },
  
  t: (category: string, key: string) => {
    const { language } = get();
    const categoryTranslations = translations[language][category];
    return categoryTranslations?.[key] || key;
  }
}));
