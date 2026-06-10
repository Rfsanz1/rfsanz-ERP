import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#714B67",
        "erp-bg": "#F5F5F9",
        success: "#28C76F",
        warning: "#FF9F43",
        danger: "#EA5455",
        info: "#00CFE8",
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 2px 6px rgba(47,43,61,.12)" },
    },
  },
  plugins: [],
};
export default config;
