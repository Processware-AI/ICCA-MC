import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5c2e',
          50: '#f0f9f3',
          100: '#dcf0e3',
          200: '#bbe2c9',
          300: '#8ccca7',
          400: '#57af7e',
          500: '#34915f',
          600: '#25744a',
          700: '#1a5c2e',
          800: '#174d28',
          900: '#133f22',
        },
        secondary: '#f5a623',
        mountain: {
          green: '#1a5c2e',
          light: '#2e8b57',
          dark: '#0d3318',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
