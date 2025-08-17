/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'base-blue': '#0052FF',
        'flame': {
          '500': '#FF6B35',
          '600': '#FF4500',
          '400': '#FFA500',
        },
        'steel': {
          '50': '#FAFAFA',
          '100': '#F4F4F5',
          '200': '#E4E4E7',
          '300': '#D4D4D8',
          '400': '#A1A1AA',
          '500': '#71717A',
          '600': '#52525B',
          '700': '#3F3F46',
          '800': '#27272A',
          '900': '#18181B',
        },
      },
      backgroundImage: {
        'blue-flame': 'linear-gradient(135deg, #0052FF 0%, #FF6B35 100%)',
        'steel-gradient': 'linear-gradient(180deg, #F4F4F5 0%, #E4E4E7 100%)',
        'dark-steel': 'linear-gradient(135deg, #3F3F46 0%, #27272A 100%)',
      },
      animation: {
        'flame-flicker': 'flicker 2s ease-in-out infinite',
        'card-hover': 'cardHover 0.3s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 107, 53, 0.8)' },
        },
      },
      boxShadow: {
        'bento': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'bento-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'flame': '0 0 20px rgba(255, 107, 53, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}