import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: "#080b14",
          panel: "#101626",
          line: "#202b40",
          accent: "#8b9cff",
          cyan: "#67e8f9"
        }
      },
      boxShadow: {
        glow: "0 0 50px rgba(103, 232, 249, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
