/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Softer light blue layout
        'wa-bg': '#e6f1ff',
        'wa-sidebar': '#d3e4ff',
        'wa-chat': '#f5f8ff',
        'wa-input': '#dbe7ff',
        'wa-accent': '#00a884',
        'wa-accent-light': '#05cd9b',
        'wa-message-in': '#202c33',
        'wa-message-out': '#005c4b',
      },
    },
  },
  plugins: [],
}
