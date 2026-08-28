module.exports = {
  content: ["./docs/index.html", "./docs/site.js"],
  theme: {
    extend: {
      screens: {
        tablet: "769px",
      },
      fontFamily: {
        sans: ["Zen", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
};
