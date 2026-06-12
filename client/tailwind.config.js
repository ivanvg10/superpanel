/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Stack nativo de Apple: en Mac/iOS resuelve a SF Pro automáticamente.
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        body:    ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        // Para cifras usamos la misma SF con números tabulares (utilidad tabular-nums).
        mono:    ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Paleta iOS dark mode (System Colors de Apple).
        ios: {
          bg:     '#000000', // fondo base (true black)
          elev:   '#1C1C1E', // secondary grouped (tarjetas)
          elev2:  '#2C2C2E', // tertiary (controles dentro de tarjeta)
          sep:    'rgba(84,84,88,0.55)',   // separador hairline
          blue:   '#0A84FF',
          green:  '#30D158',
          red:    '#FF453A',
          orange: '#FF9F0A',
          yellow: '#FFD60A',
          teal:   '#64D2FF',
          purple: '#BF5AF2',
          pink:   '#FF375F',
          gray:   '#8E8E93',
          // Labels (jerarquía de texto iOS).
          label:  '#FFFFFF',
          label2: 'rgba(235,235,245,0.6)',
          label3: 'rgba(235,235,245,0.3)',
        },
      },
      borderRadius: {
        ios:      '14px', // radio de tarjeta iOS
        'ios-lg': '20px',
      },
      boxShadow: {
        'card':       '0 1px 2px rgba(0,0,0,.4)',
        'card-hover': '0 4px 16px rgba(0,0,0,.45)',
        'modal':      '0 24px 80px rgba(0,0,0,.8), 0 8px 32px rgba(0,0,0,.4)',
        'glow':       '0 0 20px rgba(10,132,255,.35), 0 0 40px rgba(10,132,255,.15)',
        'glow-sm':    '0 0 10px rgba(10,132,255,.25)',
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
