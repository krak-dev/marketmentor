/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#F9F9F9',
        border: '#E8E8E8',
        text: '#111111',
        'text-body': '#333333',
        muted: '#888888',
        up: '#16A34A',
        'up-bg': '#F0FDF4',
        'up-border': '#BBF7D0',
        down: '#DC2626',
        'down-bg': '#FEF2F2',
        'down-border': '#FECACA',
        'neutral-bg': '#F5F5F5',
        'neutral-text': '#666666',
        'neutral-bd': '#E5E5E5'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace']
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
}
