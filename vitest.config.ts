import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'happy-dom',
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}',
      'scripts/**/*.{test,spec}.{js,ts}'
    ],
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.astro/**',
      '**/coverage/**'
    ],
    
    // Global setup and teardown
    globalSetup: ['./tests/setup/global-setup.ts'],
    setupFiles: ['./tests/setup/test-setup.ts'],
    
    // Test execution configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 5,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      enabled: false, // Enable with --coverage flag
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/.astro/**',
        'tests/**',
        '**/*.config.*',
        '**/*.d.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    },
    
    // Reporter configuration
    reporter: process.env.CI ? ['junit', 'github-actions'] : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Sequence configuration for deterministic tests
    sequence: {
      shuffle: false,
      concurrent: false,
      hooks: 'stack'
    },
    
    // Project configurations for different test types
    projects: [
      {
        name: 'unit',
        testMatch: [
          'src/**/*.{test,spec}.{js,ts}',
          'tests/unit/**/*.{test,spec}.{js,ts}'
        ],
        environment: 'node'
      },
      {
        name: 'integration',
        testMatch: [
          'tests/integration/**/*.{test,spec}.{js,ts}'
        ],
        environment: 'node',
        testTimeout: 30000
      },
      {
        name: 'e2e',
        testMatch: [
          'tests/e2e/**/*.{test,spec}.{js,ts}'
        ],
        environment: 'node',
        testTimeout: 60000
      }
    ]
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
      '@scripts': resolve(__dirname, './scripts')
    }
  }
})