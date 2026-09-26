import type { Config } from 'tailwindcss';

const config: Config = {
  // Tailwind must scan every FSD source layer that carries class names.
  // After the T-011 moves, limiting this to `./app/**` silently dropped the
  // utilities used by the moved logo, navigation, and loading components.
  content: [
    './app/**/*.{ts,tsx}',
    './widgets/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './entities/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
