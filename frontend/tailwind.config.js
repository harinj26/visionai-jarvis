/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: "#08090e",
          card: "#0f1017",
          border: "#1a1d2e",
          neon: "#00ff9f",
          cyan: "#00d4ff",
          red: "#ff4d6d",
          amber: "#ffd166",
          muted: "#4a4d6a",
          text: "#c8cce8",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
