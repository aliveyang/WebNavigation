import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [animate],
};
