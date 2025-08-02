/**
 * Test Setup File
 * 
 * This file runs before each test file and sets up the test environment
 */

import { beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock global objects and APIs
global.fetch = vi.fn()
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now()
    },
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  },
  writable: true
})

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Node.js) Test Environment',
  writable: true
})

Object.defineProperty(navigator, 'sendBeacon', {
  value: vi.fn(() => true),
  writable: true
})

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Reset localStorage and sessionStorage
  vi.mocked(localStorage.getItem).mockReturnValue(null)
  vi.mocked(sessionStorage.getItem).mockReturnValue(null)
  
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
  cleanup()
  vi.restoreAllMocks()
})