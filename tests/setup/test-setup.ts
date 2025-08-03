/**
 * Test Setup File
 * 
 * This file runs before each test file and sets up the test environment
 */

import { beforeEach, afterEach, vi } from 'vitest'

// Mock fetch API
global.fetch = vi.fn()

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Reset fetch mock
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    headers: new Headers()
  } as Response)
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})