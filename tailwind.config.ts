import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        // LoveShow primary: 紫色 (violet)
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // secondary: 粉橙系，用于渐变尾部
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
          // 59.lc 风格渐变锚点: 紫 → 粉 → 橙
          'gradient-from': '#8b5cf6',
          'gradient-via': '#ec4899',
          'gradient-to': '#f97316',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
      },
      borderRadius: {
        // Airbnb-style rounded scale: 8 / 12 / 16 / 20 / 24 / 32 px
        none: '0px',
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
      boxShadow: {
        // Three-layer elevation stack inspired by Airbnb cards
        xs: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)',
        sm: '0 1px 2px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)',
        DEFAULT:
          '0 2px 4px rgba(15, 23, 42, 0.04), 0 6px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)',
        md: '0 4px 8px rgba(15, 23, 42, 0.05), 0 10px 20px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        lg: '0 6px 12px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(15, 23, 42, 0.10), 0 3px 6px rgba(15, 23, 42, 0.05)',
        xl: '0 10px 20px rgba(15, 23, 42, 0.07), 0 24px 48px rgba(15, 23, 42, 0.12), 0 6px 12px rgba(15, 23, 42, 0.06)',
        '2xl':
          '0 16px 32px rgba(15, 23, 42, 0.08), 0 32px 64px rgba(15, 23, 42, 0.14), 0 8px 16px rgba(15, 23, 42, 0.08)',
        // Named aliases for the three card tiers
        'card-1':
          '0 2px 4px rgba(15, 23, 42, 0.04), 0 6px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'card-2':
          '0 4px 8px rgba(15, 23, 42, 0.05), 0 10px 20px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        'card-3':
          '0 8px 16px rgba(15, 23, 42, 0.07), 0 24px 48px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.06)',
        // Colored elevation for brand gradient buttons
        'glow-primary':
          '0 8px 20px rgba(124, 58, 237, 0.28), 0 16px 32px rgba(236, 72, 153, 0.22), 0 2px 4px rgba(15, 23, 42, 0.06)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Nunito',
          'Circular',
          '"Airbnb Cereal VF"',
          'ui-rounded',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        // Artistic display / heading face: Noto Serif SC — classical, warm, literary
        display: [
          'var(--font-display)',
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"STSong"',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
      },
      backgroundImage: {
        'loveshow-gradient':
          'linear-gradient(135deg, #8b5cf6 0%, #ec4899 55%, #f97316 100%)',
        'loveshow-radial':
          'radial-gradient(circle at top, rgba(139,92,246,0.25), transparent 55%), radial-gradient(circle at 30% 110%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 80% 100%, rgba(249,115,22,0.22), transparent 55%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'gradient-pan': 'gradientPan 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
