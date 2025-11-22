import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Thêm một đối tượng cấu hình để ghi đè các quy tắc.
  {
    // Cấu hình các quy tắc cụ thể cho TypeScript
    rules: {
      // Tắt quy tắc cấm sử dụng kiểu 'any' tường minh.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Ghi đè các thư mục/file bỏ qua mặc định của eslint-config-next.
  globalIgnores([
    // Các thư mục bỏ qua mặc định:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
