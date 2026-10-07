/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cafe: '#5C3A21',
        hueso: '#F4F0EA',
        arena: '#EFEBE9',
        exito: '#2E7D32',
        terracota: '#C62828'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};