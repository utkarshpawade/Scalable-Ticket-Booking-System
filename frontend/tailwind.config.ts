import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--bg)',
        'bg-soft':'var(--bg-soft)',
        card:     'var(--card)',
        fg:       'var(--fg)',
        'fg-soft':'var(--fg-soft)',
        'fg-faint':'var(--fg-faint)',
        line:     'var(--line)',
        accent:   'var(--accent)',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
