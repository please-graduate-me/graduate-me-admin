const config = {
  singleQuote: true,
  trailingComma: 'es5',
  proseWrap: 'never',
  htmlWhitespaceSensitivity: 'strict',
  jsxSingleQuote: true,
  singleAttributePerLine: true,
  bracketSameLine: true,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './app/globals.css',
};

/** 관리자 앱의 포맷을 다른 앱의 설정 의존 없이 유지한다. */
export default config;
