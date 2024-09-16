module.exports = {
  content: [
    './*.html',  // Tailwind가 적용될 파일 경로 (예: search-results.html)
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'), // forms 플러그인 활성화
    require('@tailwindcss/container-queries'), // container-queries 플러그인 활성화
  ],
}