/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
    "./core/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        'primary-dark': '#16A34A',
        secondary: '#DCFCE7',
        accent: '#FB923C',
        'primary-light': '#DCFCE7',
        'primary-lighter': '#F0FDF4',
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
        dark: {
          background: '#0F172A',
          surface: '#1E293B',
          'surface-elevated': '#334155',
          text: '#F8FAFC',
          'text-muted': '#94A3B8',
          border: '#334155',
        }
      },
    },
  },
  plugins: [],
}
