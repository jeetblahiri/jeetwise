/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#161622',
        canvas: '#f7f3eb',
        peach: '#f8b184',
        sand: '#f3dbc3',
        moss: '#2f5d50',
        coral: '#dc6b4c',
        sky: '#97c6d8',
      },
      boxShadow: {
        float: '0 22px 60px rgba(22, 22, 34, 0.15)',
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at top, rgba(255,255,255,0.5), transparent 35%), radial-gradient(circle at 20% 20%, rgba(248,177,132,0.12), transparent 24%), radial-gradient(circle at 80% 10%, rgba(151,198,216,0.18), transparent 20%), radial-gradient(circle at 50% 100%, rgba(47,93,80,0.1), transparent 25%)",
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
