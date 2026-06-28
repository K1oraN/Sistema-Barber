/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        club: {
          black: "#0b0b0b",
          surface: "#151515",
          line: "#2a2a2a",
          red: "#D90429",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Oswald", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 18px 60px rgba(0, 0, 0, 0.36)",
      },
      animation: {
        "fade-in": "fadeIn 700ms ease-out both",
        "slide-up": "slideUp 650ms ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

