/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        red: '#C8102E',
        redDark: '#8B0D20',
        redLight: '#FCE8EC',
        yellow: '#F5C518',
        yellowDark: '#E8A900',
        yellowLight: '#FFFAE6',
        sand: '#E8D5A3',
        coffee: '#6B3F1F',
        forest: '#2D5016',
        forestLight: '#EAF4E0',
        bg: '#FAFAF7',
        bg2: '#F2EDE4',
        white: '#FFFFFF',
        dark: '#1A1208',
        muted: '#7A6A50',
        border: '#E0D4C0',
      }
    },
  },
  plugins: [],
}
