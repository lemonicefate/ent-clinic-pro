# Tech Stack and Architecture

## Core Technologies
- **Framework**: Astro 4.16.18 (Static Site Generation)
- **UI Library**: React 4.3.0 (for interactive islands)
- **Styling**: Tailwind CSS 3.4.17
- **Language**: TypeScript 5.7.2
- **Charts**: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- **Flowcharts**: Mermaid 11.9.0
- **Flow Diagrams**: @xyflow/react 12.8.2

## Development Tools
- **Testing**: Vitest 2.1.8 with happy-dom environment
- **Storybook**: 8.6.14 for component development
- **Linting**: ESLint 9.17.0 with Astro plugin
- **Performance**: web-vitals 4.2.4

## Architecture Patterns
- **Modular Calculator System**: Each calculator is an independent module
- **Island Architecture**: React components hydrated only when needed
- **Plugin System**: Extensible calculator plugin architecture
- **Registry Pattern**: Centralized calculator registration and loading
- **Error Boundaries**: Comprehensive error handling at component level

## Project Structure
```
src/
├── calculators/           # Calculator modules (new architecture)
├── components/           # React components
├── pages/               # Astro pages
├── services/            # Service layer
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── test-utils/          # Testing utilities
```

## Build Configuration
- **Output**: Static site generation
- **Multi-language**: i18n with zh-TW default, en/ja fallback
- **Optimization**: Automatic CSS inlining, HTML compression
- **Security**: Origin checking enabled