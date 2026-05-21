/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
    "./core/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // Required for the in-app theme switch to control NativeWind dark: classes.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        'primary-dark': '#16A34A',
        secondary: '#DCFCE7',
        'secondary-dark': '#14532D',
        accent: '#FB923C',
        'primary-light': '#DCFCE7',
        'primary-lighter': '#F0FDF4',
        // Semantic tokens — light mode
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-elevated': '#F1F5F9',
        text: '#0F172A',
        'text-muted': '#64748B',
        'text-faint': '#94A3B8',
        border: '#E2E8F0',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        bookmark: '#FB923C',
        enrolled: '#22C55E',
        // Explicit dark-palette tokens (used for inline styles via useTheme)
        'dark-bg': '#000000',
        'dark-surface': '#121212',
        'dark-surface-elevated': '#1E1E1E',
        'dark-text': '#F1F5F9',
        'dark-text-muted': '#9CA3AF',
        'dark-border': '#262626',
      },
    },
  },
  plugins: [],
}
