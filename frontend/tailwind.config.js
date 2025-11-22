/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // IBM Carbon Design System colors
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Carbon specific
        carbon: {
          blue: {
            60: '#0f62fe',
            70: '#0043ce',
          },
          gray: {
            10: '#f4f4f4',
            20: '#e0e0e0',
            30: '#c6c6c6',
            50: '#8d8d8d',
            70: '#525252',
            80: '#393939',
            90: '#262626',
            100: '#161616',
          },
          green: {
            50: '#24a148',
          },
          red: {
            60: '#da1e28',
          },
          yellow: {
            30: '#f1c21b',
          },
          purple: {
            60: '#8a3ffc',
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'carbon-xs': ['0.75rem', { lineHeight: '1.25' }],
        'carbon-sm': ['0.875rem', { lineHeight: '1.5' }],
        'carbon-base': ['1rem', { lineHeight: '1.5' }],
        'carbon-lg': ['1.125rem', { lineHeight: '1.5' }],
        'carbon-xl': ['1.25rem', { lineHeight: '1.25' }],
        'carbon-2xl': ['1.5rem', { lineHeight: '1.25' }],
        'carbon-3xl': ['1.75rem', { lineHeight: '1.25' }],
        'carbon-4xl': ['2rem', { lineHeight: '1.25' }],
      },
      spacing: {
        'carbon-1': '0.125rem',
        'carbon-2': '0.25rem',
        'carbon-3': '0.5rem',
        'carbon-4': '0.75rem',
        'carbon-5': '1rem',
        'carbon-6': '1.5rem',
        'carbon-7': '2rem',
        'carbon-8': '2.5rem',
        'carbon-9': '3rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
