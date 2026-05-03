/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f8f9fb',
        surface: '#ffffff',
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
        },
        text: {
          DEFAULT: '#1e293b',
          muted: '#64748b',
        },
        border: '#e2e8f0',
        success: '#10b981',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}