/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6D28D9",
          light: "#8B5CF6",
          dark: "#4C1D95",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
