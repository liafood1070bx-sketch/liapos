/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          light: '#6366F1',  // Indigo 500
          dark: '#4338CA',   // Indigo 700
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald 500
          light: '#34D399',  // Emerald 400
          dark: '#059669',   // Emerald 600
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber 500
          light: '#FBBF24',  // Amber 400
          dark: '#D97706',   // Amber 600
        },
        success: '#22C55E', // Green 500
        danger: '#EF4444',  // Red 500
        warning: '#F59E0B', // Amber 500
        info: '#3B82F6',    // Blue 500
      },
    },
  },
  plugins: [],
};
