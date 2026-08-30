/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        school: {
          50: "#f3f7f4",
          100: "#dce8df",
          700: "#1b4d36",
          800: "#0f3d2e",
          900: "#0a2a20",
        },
        gold: {
          400: "#d4b56a",
          500: "#c4a35a",
        },
        bank: {
          800: "#0b1f3a",
          900: "#07152a",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
