import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Literal values (mirroring the CSS variables in globals.css) so
      // opacity modifiers like bg-char-900/80 work.
      colors: {
        porcelain: "#f5f8fc",
        mist: "#e9f0f9",
        line: "rgba(11, 45, 102, 0.12)",
        ink: "#0c1628",
        muted: "#55607a",
        blue: {
          DEFAULT: "#1450b4",
          bright: "#2b6be0",
          deep: "#0b3278",
          navy: "#07183a",
          sky: "#9cc0f5",
        },
        char: {
          950: "#040a17",
          900: "#071226",
          800: "#0d1b37",
          700: "#15284b",
          600: "#22385f",
        },
        ember: {
          DEFAULT: "#ff5b1f",
          hot: "#ff7a2b",
          deep: "#c8330a",
        },
        amber: "#ffae3b",
        gold: "#ffd782",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1240px",
      },
    },
  },
  plugins: [],
};

export default config;
