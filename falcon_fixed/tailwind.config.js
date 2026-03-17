/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#00FF66',
          dark: '#00CC52',
          glow: 'rgba(0, 255, 102, 0.5)',
          muted: 'rgba(0, 255, 102, 0.1)',
        },
        dark: {
          bg: '#050A05',
          card: '#0A140A',
          border: '#142914',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(0, 255, 102, 0.3)',
        'neon-strong': '0 0 30px rgba(0, 255, 102, 0.5)',
      }
    },
  },
  plugins: [],
};
