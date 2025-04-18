/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Ensure it scans all relevant files
  ],
  theme: {
    extend: {
      // Add custom extensions if needed, otherwise defaults are fine
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Useful for form styling consistency
    require('@tailwindcss/typography'), // If you use prose for markdown/rich text
    require('@tailwindcss/line-clamp'), // For truncating text
    require('@headlessui/tailwindcss')({ prefix: 'ui' }) // If using Headless UI components
  ],
};
