import type { Config } from "tailwindcss";
// @ts-expect-error: package has no type declarations
import tailwindcssRtl from "tailwindcss-rtl";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../apps/web/app/**/*.{ts,tsx}",
    "../../apps/portal/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
      },
      fontFamily: {
        'ibm-plex-arabic': ['var(--font-ibm-plex-arabic)', 'IBM Plex Arabic', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        glass: "var(--shadow-glass)",
        'glass-hover': "var(--shadow-glass-hover)",
        'elevation-1': "var(--elevation-1)",
        'elevation-2': "var(--elevation-2)",
        'elevation-3': "var(--elevation-3)",
        'glow-green': "0 0 20px hsl(148 76% 27% / 0.25), 0 0 40px hsl(148 76% 27% / 0.10)",
        'glow-gold': "0 0 20px hsl(46 65% 52% / 0.25), 0 0 40px hsl(46 65% 52% / 0.10)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
    },
  },
  plugins: [tailwindcssRtl],
};

export default config;
