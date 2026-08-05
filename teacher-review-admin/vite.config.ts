import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const onboardingFile = resolve(__dirname, '../教师入驻_AI问答引导预览.html')

function teacherOnboardingPage(): Plugin {
  const sendPage = (requestUrl: string | undefined, response: { setHeader(name: string, value: string): void; end(body: string): void }, next: () => void): void => {
    const pathname = requestUrl?.split('?')[0]
    if (pathname !== '/teacher-onboarding' && pathname !== '/teacher-onboarding/') {
      next()
      return
    }

    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(readFileSync(onboardingFile, 'utf-8'))
  }

  return {
    name: 'teacher-onboarding-page',
    configureServer(server) {
      server.middlewares.use((request, response, next) => sendPage(request.url, response, next))
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => sendPage(request.url, response, next))
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'teacher-onboarding/index.html',
        source: readFileSync(onboardingFile, 'utf-8')
      })
    }
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/teacher/' : '/',
  plugins: [vue(), teacherOnboardingPage()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-v233-[hash].js',
        assetFileNames: 'assets/[name]-v233-[hash][extname]'
      },
      input: {
        index: resolve(__dirname, 'index.html'),
        teacherManagement: resolve(__dirname, 'teacher-management/index.html')
      }
    }
  }
})
