import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';

export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#E8E8E8',
  primary: '#2C3E50',
  primaryDark: '#1A252F',
  accent: '#D4AF37', // Gold accent for barbershop
  accentLight: '#F4E4BC',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E0E0E0',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  info: '#17A2B8',
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  primary: '#D4AF37',
  primaryDark: '#B8941F',
  accent: '#D4AF37',
  accentLight: '#F4E4BC',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  border: '#333333',
  error: '#FF6B6B',
  success: '#51CF66',
  warning: '#FFD93D',
  info: '#4ECDC4',
  card: '#1E1E1E',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type Theme = typeof lightTheme;

interface ThemeStore {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  isDark: false,
  theme: lightTheme,
  
  toggleTheme: () => {
    const { isDark } = get();
    set({
      isDark: !isDark,
      theme: !isDark ? darkTheme : lightTheme
    });
  },
  
  setTheme: (isDark: boolean) => {
    set({
      isDark,
      theme: isDark ? darkTheme : lightTheme
    });
  }
}));
