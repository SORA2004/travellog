// tailwind.config.js

module.exports = {
  // 다크 모드 활성화 ('class' 전략)
  darkMode: 'class',

  // 콘텐츠 경로 확장 (모든 관련 파일 포함)
  content: [
    './*.html',                // 루트 디렉토리의 모든 HTML 파일
    './scripts/**/*.js',       // scripts 폴더 내 모든 JavaScript 파일
    './components/**/*.html'   // components 폴더 내 모든 HTML 파일 (사용 시)
    // 필요에 따라 추가적인 경로를 포함하세요
  ],

  theme: {
    extend: {
      // 필요에 따라 테마 확장 (색상, 폰트 등)
      colors: {
        // 예시: 브랜드 색상 추가
        primary: '#1D4ED8',    // indigo-700
        secondary: '#9333EA',  // purple-600
      },
    },
  },

  // 필요한 플러그인 추가
  plugins: [
    require('@tailwindcss/forms'),              // forms 플러그인 활성화
    require('@tailwindcss/container-queries'),  // container-queries 플러그인 활성화
    require('@tailwindcss/typography'),        // 타이포그래피 플러그인 활성화
  ],
};
