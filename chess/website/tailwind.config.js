/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        sm: "640px",
        // => @media (min-width: 640px) { ... }

        md: "768px",
        // => @media (min-width: 768px) { ... }

        lg: "1024px",
        // => @media (min-width: 1024px) { ... }

        xl: "1280px",
        // => @media (min-width: 1280px) { ... }

        "2xl": "1536px",
        // => @media (min-width: 1536px) { ... }
        // => @media (min-width: 320px) and (orientation: landscape) { ... }

        "mobile-h": {
          raw: "(max-width: 1000px) and (orientation: landscape)",
        },
        // => @media (min-width: 480px) and (orientation: landscape) { ... }
      },
    },
  },
  plugins: [],
};
