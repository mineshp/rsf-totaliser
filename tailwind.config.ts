import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rsfRed: {
          400: "#e9483f",
        },
        rsfBlue: {
          400: "#003057",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
