import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#714B67',
        'primary-light': 'rgba(113,75,103,0.12)',
        'text-heading': '#433C50',
        'text-body': '#6D6777',
        'text-muted': '#A5A3AE',
        border: '#E9E0F8',
        'erp-bg': '#F5F5F9',
        success: '#28C76F',
        warning: '#FF9F43',
        danger: '#EA5455',
        info: '#00CFE8',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 2px 6px rgba(47,43,61,.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
