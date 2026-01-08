import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      server: {
        port: 5173,
        host: 'localhost',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          devOptions: {
            enabled: true,
            type: 'module'
          },
          includeAssets: ['icon-192.png', 'icon-512.png'],
          manifest: {
            name: 'NavHub',
            short_name: 'NavHub',
            description: '智能导航助手',
            theme_color: '#1e293b',
            background_color: '#0f172a',
            display: 'standalone',
            orientation: 'portrait-primary',
            start_url: '/',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'react-cdn-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/www\.google\.com\/s2\/favicons.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'favicon-cache',
                  expiration: {
                    maxEntries: 200, // 增加到 200 个
                    maxAgeSeconds: 60 * 60 * 24 * 90 // 延长到 90 天
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // 缓存 Vercel KV API 响应
                urlPattern: /^https:\/\/.*\.vercel-storage\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'sync-api-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 5 // 5 minutes
                  },
                  networkTimeoutSeconds: 3,
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // 缓存外部图片资源
                urlPattern: /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'external-images-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      build: {
        // 生产环境优化
        minify: isProduction ? 'terser' : false,
        terserOptions: isProduction ? {
          compress: {
            drop_console: true, // 移除 console.log
            drop_debugger: true, // 移除 debugger
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除特定函数调用
          },
          format: {
            comments: false, // 移除注释
          },
        } : undefined,
        // 代码分割
        rollupOptions: {
          output: {
            manualChunks: {
              // 将 React 相关库打包到一起
              'react-vendor': ['react', 'react-dom'],
              // 将工具函数打包到一起
              'utils': ['./src/utils/index.ts', './src/utils/performance.ts', './src/utils/imageOptimization.ts'],
              // 将常量打包到一起
              'constants': ['./src/constants/index.ts'],
            },
            // 优化文件名
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          },
        },
        // 设置 chunk 大小警告阈值
        chunkSizeWarningLimit: 500,
        // 启用 CSS 代码分割
        cssCodeSplit: true,
        // 生成 source map（开发环境）
        sourcemap: !isProduction,
      },
      // 优化依赖预构建
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: [],
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
