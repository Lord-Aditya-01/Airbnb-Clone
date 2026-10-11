/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./views/*.ejs",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF385C',
          hover: '#E00B41',
          light: '#FFF8F6'
        }
      }
    },
  },
  plugins: [],
}