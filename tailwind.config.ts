import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg-base': 'var(--bg-base)',
        'theme-bg-panel': 'var(--bg-panel)',
        'theme-bg-dark': 'var(--bg-dark)',
        'theme-bg-dark-panel': 'var(--bg-dark-panel)',
        'theme-text-base': 'var(--text-base)',
        'theme-text-muted': 'var(--text-muted)',
        'theme-text-light': 'var(--text-light)',
        'theme-text-light-muted': 'var(--text-light-muted)',
        'theme-border-base': 'var(--border-base)',
        'theme-border-dark': 'var(--border-dark)',
        'theme-accent-main': 'var(--accent-main)',
        'theme-accent-muted': 'var(--accent-muted)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;