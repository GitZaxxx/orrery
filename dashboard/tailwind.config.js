/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'obsidian': '#0B0F19',
        'deep-space': '#121826',
        'panel': '#0E1424',
        'electric-cyan': '#00F5FF',
        'neon-magenta': '#FF00FF',
        'quantum-green': '#00FF88',
        'plasma-purple': '#BF00FF',
        'alert-amber': '#FFB300',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
