import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DengueAhead brand colours — mirrors CSS custom properties in index.css
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8'
        },
        navy: {
          DEFAULT: '#0b1730',
          muted: '#1e293b'
        },
        surface: {
          bg: '#f5f7fb',
          card: '#ffffff'
        },
        // Hotspot taxonomy colours
        emerging: { DEFAULT: '#d97706', bg: '#fef3c7' },
        persistent: { DEFAULT: '#dc4754', bg: '#fee2e2' },
        stable: { DEFAULT: '#0d9488', bg: '#ccfbf1' },
        cooling: { DEFAULT: '#0284c7', bg: '#e0f2fe' }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};

export default config;

