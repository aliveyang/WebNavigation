import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 纯函数测试跑 node 环境即可；涉及浏览器 API 的模块在测试内自行 stub
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
