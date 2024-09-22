module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          orange: {
            400: '#FF9F1C', // Luminescent orange
            500: '#FF8C00', // Darker shade for hover states
          },
        },
      },
    },
    plugins: [],
  }