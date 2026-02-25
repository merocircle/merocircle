import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '.next/**'],
    environment: 'happy-dom',
    globals: true,
    pool: 'threads',
    passWithNoTests: true,
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['components/**/*.tsx', 'hooks/**/*.ts', 'lib/**/*.ts', 'app/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/node_modules/**', '__tests__/**', 'e2e/**', 'hooks/useLoadingBar.ts'],
    },
  },
})
