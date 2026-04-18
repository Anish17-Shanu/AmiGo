/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1320",
        ember: "#f97316",
        tide: "#0ea5e9",
        mist: "#f1f5f9"
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, #082f49 0%, #0b1320 45%, #111827 100%)"
      }
    }
  },
  plugins: []
};
