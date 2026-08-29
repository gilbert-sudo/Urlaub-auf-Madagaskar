/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDECEB',
          100: '#FAD6D2',
          200: '#F3A9A0',
          300: '#EB7A6B',
          400: '#CE422F',
          500: '#811303',
          primary: '#811303', // Molten Lava
          secondary: '#441008', // Rich Mahogany
          accent: '#E8B72F', // Sunflower Gold
          900: '#2A0A05',
        },
        surface: {
          light: '#fcfcfd',
          dark: '#000000', // Black
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.03)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
