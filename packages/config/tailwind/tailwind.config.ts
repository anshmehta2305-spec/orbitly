import type { Config } from 'tailwindcss';

export const orbitlyTailwindPreset = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        orbitly: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        pulse: {
          500: '#06b6d4',
          600: '#0891b2',
        },
        space: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b0f19',
        }
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      }
    }
  }
};
