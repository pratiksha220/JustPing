/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'wa-bg': '#111b21',
        'wa-sidebar': '#202c33',
        'wa-chat': '#0b141a',
        'wa-input': '#202c33',
        'wa-accent': '#00a884',
        'wa-accent-light': '#05cd9b',
        'wa-message-in': '#202c33',
        'wa-message-out': '#005c4b',
      },
    },
  },
  plugins: [],
}
