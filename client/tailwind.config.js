/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card':       '0 1px 1px rgba(0,0,0,.3), 0 2px 8px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.04)',
        'card-hover': '0 2px 4px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06)',
        'modal':      '0 24px 80px rgba(0,0,0,.8), 0 8px 32px rgba(0,0,0,.4)',
        'glow':       '0 0 20px rgba(99,102,241,.35), 0 0 40px rgba(99,102,241,.15)',
        'glow-sm':    '0 0 10px rgba(99,102,241,.25)',
        'popover':    '0 8px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.3)',
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0'  },
        },
      },
    },
  },
  plugins: [],
};
