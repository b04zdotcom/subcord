import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
          input: "var(--bg-input)",
          accent: "var(--accent)",
          "accent-hover": "var(--accent-hover)",
          danger: "var(--danger)",
          success: "var(--success)",
          border: "var(--border)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
          author: "var(--bg-author)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
