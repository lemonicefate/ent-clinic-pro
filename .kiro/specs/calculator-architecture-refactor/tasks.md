# Calculator Architecture Refactor Implementation Plan

## Overview

This implementation plan converts the approved design into a series of discrete, manageable coding tasks that will transform the current centralized calculator architecture into a decentralized, plugin-based system. The plan follows the MVP approach, prioritizing calculator isolation and independence while maintaining compatibility with existing React components.

## Implementation Tasks

### Phase 0: Project Baseline and Environment Setup

- [ ] 0.1 Establish current project performance baseline
  - Use Lighthouse/Web Vitals tools to measure initial page load, CLS, LCP for current calculator pages
  - Document current bundle sizes and loading times for each calculator
  - Automate performance baseline tests for continuous monitoring during refactor
  - Create performance regression detection in CI/CD pipeline
  - _Requirements: 8.1, 8.4, 14.6_

- [ ] 0.2 Confirm existing calculator test suite completeness
  - Ensure current React calculator unit, integration, and E2E tests are stable and passing
  - Document current test coverage percentage for all calculators (aim for >80%)
  - Identify and fix any flaky or failing tests before refactor begins
  - Establish test coverage requirements for new plugin system
  - _Requirements: 9.4, 14.1, 14.5_

- [ ] 0.3 Configure development and testing environments
  - Verify Node.js (LTS), VS Code, and necessary development tools are set up
  - Configure VS Code workspace for TypeScript, ESLint, and Prettier with strict settings
  - Integrate security scanning tools (e.g., Snyk, npm audit) into development workflow
  - Configure accessibility linting/testing tools (e.g., axe-core ESLint plugin)
  - Set up development branch protection and code review requirements
  - _Requirements: 9.5, 9.7, 14.1_

### Phase 1: Core Infrastructure Setup (MVP)

- [ ] 1.1 Create plugin type definitions and interfaces
  - Create `src/types/calculator-plugin.ts` with `CalculatorPlugin`, `CalculatorMetadata`, `PluginLoadResult` interfaces
  - Define custom error types: `PluginConflictError`, `PluginValidationError`, `DependencyError`
  - Ensure TypeScript strict mode compatibility across all new types
  - Add comprehensive JSDoc documentation for all interfaces
  - Include version validation utilities and semantic versioning support
  - _Requirements: 1.1, 3.1, 5.1, 10.1_

- [ ] 1.2 Implement Calculator Registry system
  - Create `src/utils/calculator-registry.ts` for plugin management
  - Implement plugin registration with "latest version wins, no co-existence" conflict resolution using semver
  - Add namespace isolation and efficient plugin retrieval methods (get, getByNamespace, listAll)
  - Include plugin validation (metadata, dependencies) and lifecycle management (install, uninstall)
  - Add comprehensive error handling and logging for registration failures
  - Implement plugin dependency resolution with topological sorting
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 10.1, 10.2_

- [ ] 1.3 Build Plugin Discovery mechanism
  - Create `src/utils/calculator-discovery.ts` for build-time (Node.js) plugin scanning
  - Implement actual filesystem-based directory scanning for `src/calculators/` to generate plugin manifest
  - Add plugin directory structure validation (e.g., config.json, index.ts presence)
  - Handle malformed plugins gracefully during discovery with detailed error messages
  - Ensure this discovery process integrates with Astro's SSG build steps
  - Support both build-time and development-time discovery modes
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 14.1_

- [ ] 1.4 Create Error Boundary and error handling system
  - Create `src/components/common/ErrorBoundary.tsx` for React error isolation within calculator instances
  - Implement specific error types for calculator failures (calculation errors, timeout errors, validation errors)
  - Add error recovery mechanisms (retry button, reset functionality) and user-friendly fallback UIs
  - Create fallback UI components for failed calculators with actionable error messages
  - Ensure errors in one calculator instance are contained and don't affect other calculators or main application
  - Add error reporting and analytics integration for debugging
  - _Requirements: 7.1, 7.2, 7.3, 1.3, 9.3_

### Phase 2: Dynamic Calculator Loader (MVP)

- [ ] 2.1 Implement Dynamic Calculator Loader
  - Create `src/utils/dynamic-calculator-loader.ts` replacing ModularCalculatorLoader
  - Add plugin initialization logic, including dependency resolution and topological sorting
  - Implement lazy loading for calculator plugin code using dynamic import() and Astro/Vite chunk generation
  - Add timeout protection and retry mechanisms for plugin loading failures
  - Include initial performance monitoring hooks and basic caching for loaded modules
  - Ensure backward compatibility with existing calculator loading patterns
  - _Requirements: 1.1, 8.1, 8.2, 6.1, 6.2_

- [ ] 2.2 Create Calculator Instance management
  - Create `src/utils/calculator-instance.ts` for individual calculator lifecycle
  - Implement React component rendering with error boundaries and proper cleanup
  - Add input validation and calculation execution with timeout protection
  - Handle calculator destruction and cleanup to prevent memory leaks
  - Ensure proper memory management and resource cleanup
  - Add instance state management and persistence capabilities
  - _Requirements: 7.1, 7.2, 8.3, 11.1, 11.2_

- [ ] 2.3 Build API Client abstraction layer (Frontend-only focus)
  - Create `src/utils/api-client.ts` with StaticAPIClient (for current static data/config)
  - Design a future-ready interface for potential HTTPAPIClient for backend integration
  - Implement current static data handling for SSG environment (e.g., loading JSON configs)
  - Add basic error handling and retry logic for static data fetching
  - Include request/response logging for debugging support
  - Prepare for future SSR integration without breaking current functionality
  - _Requirements: 6.1, 6.2, 13.1, 13.4_

### Phase 3: Plugin Migration and Testing (MVP)

- [ ] 3.1 Define naming conventions for namespaces and IDs
  - Establish clear guidelines for calculator namespaces (e.g., cardiology, nephrology, general)
  - Define calculator ID naming conventions (e.g., lowercase, kebab-case)
  - Create namespace ownership and governance guidelines
  - Document these conventions in the Calculator Extension Guide
  - Validate naming conventions with existing calculator names
  - _Requirements: 2.1, 2.2, 9.1, 9.6_

- [ ] 3.2 Convert existing BMI calculator to plugin format
  - Create `src/calculators/general/bmi/index.ts` plugin entry point
  - Migrate existing BMI logic to conform to the new CalculatorPlugin interface
  - Update BMIDashboard.tsx to work with the new plugin system
  - Add plugin metadata and validation (e.g., config.json with proper schema)
  - Test isolation and error handling for BMI plugin
  - Ensure backward compatibility with existing BMI calculator URLs
  - _Requirements: 6.1, 6.3, 1.1, 1.3, 6.2_

- [ ] 3.3 Convert existing CHA2DS2-VASc calculator to plugin format
  - Create `src/calculators/cardiology/cha2ds2-vasc/index.ts` plugin entry point
  - Migrate existing CHA2DS2-VASc logic to the new plugin interface
  - Update CHA2DS2VAScDashboard.tsx to work with the new plugin system
  - Add namespace isolation (cardiology namespace)
  - Test cross-plugin isolation with BMI calculator
  - Verify complex calculation logic remains accurate after migration
  - _Requirements: 2.1, 2.2, 6.1, 1.3, 6.3_

- [ ] 3.4 Convert existing eGFR calculator to plugin format
  - Create `src/calculators/nephrology/egfr/index.ts` plugin entry point
  - Migrate existing eGFR logic to the new plugin interface
  - Update EGFRDashboard.tsx to work with the new plugin system
  - Add namespace isolation (nephrology namespace)
  - Verify all three calculators work independently and correctly
  - Test simultaneous loading of multiple calculators on same page
  - _Requirements: 2.1, 2.2, 6.1, 1.3, 14.1_

- [ ] 3.5 Create comprehensive plugin isolation tests
  - Write unit tests for CalculatorRegistry functionality (registration, conflict detection, namespace isolation, retrieval)
  - Test plugin loading, registration, and conflict detection scenarios
  - Create integration tests for cross-plugin isolation (e.g., running multiple calculators on one page)
  - Test error scenarios: plugin loading failures, malformed configs, runtime errors, timeouts
  - Verify memory cleanup and resource management after calculator destruction
  - Add performance tests to ensure plugin system doesn't degrade performance
  - _Requirements: 1.3, 7.1, 7.2, 5.1, 8.1, 14.5_

### Phase 4: Integration and Backward Compatibility (MVP)

- [ ] 4.1 Update Astro pages to use new Dynamic Calculator Loader
  - Modify existing calculator pages to use DynamicCalculatorLoader instead of ModularCalculatorLoader
  - Ensure backward compatibility during the transition period (if ModularCalculatorLoader is still used elsewhere)
  - Add fallback mechanisms for legacy calculator IDs (e.g., mapping old IDs to new namespaced IDs)
  - Test all calculator pages render correctly and load plugins via the new loader
  - Verify SSG build process works seamlessly with the new plugin system
  - Ensure no SEO impact from URL or metadata changes
  - _Requirements: 6.1, 6.2, 13.1, 13.2, 12.3_

- [ ] 4.2 Implement backward compatibility layer
  - Create a compatibility wrapper or mapping logic for old calculator IDs to new namespaced IDs
  - Add deprecation warnings in the console for legacy usage patterns during development
  - Ensure a smooth transition without breaking existing functionality for users
  - Test that old calculator URLs still resolve and load the correct calculator via the new system
  - Plan the timeline for safely removing legacy support after full migration
  - Document migration path for any external integrations
  - _Requirements: 6.1, 6.2, 6.3, 13.1, 13.4_

- [ ] 4.3 Create comprehensive Calculator Extension Guide
  - Draft a comprehensive `docs/NEW_CALCULATOR_GUIDE.md` for future developers
  - Content to include:
    - Introduction to the Plugin Architecture: Brief overview of why it's plugin-based
    - Standard Plugin Structure: Required files (index.ts, config.json, Dashboard.tsx, calculator.ts)
    - Plugin Interface (CalculatorPlugin) Explained: Metadata, config, lifecycle hooks (install, uninstall, validate)
    - Naming Conventions: Guidelines for namespace and id (e.g., general.bmi, cardiology.cha2ds2-vasc)
    - How to Create a New Calculator: Step-by-step guide with code snippets and explanations
    - Adding Metadata (config.json): Explanation of each field and its purpose
    - Implementing Calculation Logic (calculator.ts): Best practices for calculate and validate methods
    - Building the UI (Dashboard.tsx): How to use React for the calculator interface
    - Testing Your New Plugin: Guidelines for unit, integration, and isolation tests
    - Debugging Tips: Common issues and how to troubleshoot
    - Deployment Considerations: How new plugins are discovered and deployed
    - Common Pitfalls and Best Practices
  - _Requirements: 9.1, 9.6, 9.7, 12.1, 12.2_

### Phase 5: Performance Optimization and Cleanup

- [ ] 5.1 Add performance monitoring and analytics
  - Implement plugin loading time measurement and reporting
  - Add calculator execution performance tracking with detailed metrics
  - Create a basic performance dashboard for development monitoring
  - Monitor memory usage and resource cleanup during calculator lifecycle
  - Add performance regression detection to CI/CD pipeline
  - Compare performance metrics against Phase 0 baseline
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 14.6_

- [ ] 5.2 Optimize lazy loading and caching
  - Implement intelligent plugin preloading based on usage patterns (e.g., preloading common calculators)
  - Add plugin result caching for repeated calculations within a session
  - Optimize bundle splitting for better loading performance of calculator chunks
  - Implement service worker caching for offline support of static assets and calculator code
  - Test loading performance across different network conditions and device types
  - Measure and optimize Time to Interactive (TTI) for calculator pages
  - _Requirements: 8.1, 8.2, 8.4, 5.1, 8.3_

- [ ] 5.3 Remove legacy ModularCalculatorLoader
  - Safely remove ModularCalculatorLoader.ts file and associated code
  - Clean up unused imports and references throughout the codebase
  - Remove hardcoded idToFolderMap and dashboard mappings
  - Update all remaining references to use the new plugin system
  - Verify no functionality is broken after removal of the old system
  - Update any remaining documentation references to the old system
  - _Requirements: 13.3, 13.4, 1.1, 12.1_

### Phase 6: Advanced Features and Future-Proofing (Post-MVP)

This phase's tasks will be prioritized and scheduled after the MVP (Phases 0-4) is successfully completed and deployed, based on evolving business needs and available resources.

- [ ] 6.1 Add hot module replacement for development
  - Implement HMR support for plugin development (allowing live updates without full page reload)
  - Add automatic plugin reloading on file changes during development
  - Create development-time plugin validation and error reporting
  - Test rapid development workflow with multiple calculators
  - Ensure HMR doesn't affect production builds
  - Integrate with existing development server setup
  - _Requirements: 9.5, 9.7, 12.1, 9.2_

- [ ] 6.2 Create plugin marketplace foundation
  - Design plugin discovery and listing UI components (e.g., a "Browse Calculators" page)
  - Implement plugin metadata display and filtering (by namespace, tags, etc.)
  - Add plugin search and categorization functionality
  - Create a basic plugin installation and management interface (for future admin use)
  - Test with multiple plugins across different namespaces
  - Design for future integration with external plugin repositories
  - _Requirements: 12.1, 12.2, 2.3, 4.1, 12.3_

- [ ] 6.3 Implement advanced dependency management
  - Add semantic versioning support for plugin dependencies (e.g., allowing ^1.0.0 ranges)
  - Implement robust dependency resolution and conflict detection
  - Create a dependency graph visualization for debugging complex plugin relationships
  - Add automatic dependency installation and updates for plugins
  - Test complex dependency scenarios and circular dependencies
  - Design for future package manager integration
  - _Requirements: 10.2, 10.3, 5.2, 5.3, 10.4_

- [ ] 6.4 Future-proof for i18n and Backend Integration
  - Refine CalculatorMetadata to fully support Record<string, string> for name and description with i18n
  - Design a strategy for integrating i18n libraries within React calculator islands
  - Plan for transitioning StaticAPIClient to HTTPAPIClient for actual backend calls
  - Define how SSR would be introduced for specific dynamic calculator results or personalized content
  - Create migration path documentation for future architectural changes
  - _Requirements: Future Scalability, 13.4, 6.2_

## Success Criteria

### MVP Success Criteria (Phases 0-4)
1. All existing calculators (BMI, CHA2DS2-VASc, eGFR) work independently as plugins
2. No calculator can affect or break another calculator (verified by isolation tests)
3. New calculators can be added by following the Calculator Extension Guide without modifying core system code
4. Plugin loading failures are isolated and don't crash the application
5. Performance is equal to or better than the current system (verified by baseline comparisons)
6. All existing calculator URLs and functionality remain working through the backward compatibility layer

### Advanced Success Criteria (Phases 5-6)
1. Plugin development workflow is streamlined with HMR support
2. Performance monitoring provides actionable insights into calculator loading and execution
3. Plugin marketplace foundation enables easy plugin discovery and management
4. Advanced dependency management handles complex plugin relationships
5. System is clearly ready for future backend integration and i18n expansion
6. Comprehensive documentation supports ongoing development and maintenance

## Risk Mitigation

### Technical Risks
- **Plugin Loading Failures**: Comprehensive error boundaries and fallback mechanisms
- **Performance Regression**: Continuous performance monitoring and optimization
- **Memory Leaks**: Proper cleanup and resource management in all components
- **Build Process Issues**: Thorough testing of SSG build with new plugin system

### Migration Risks
- **Breaking Changes**: Extensive backward compatibility layer and testing
- **User Experience Disruption**: Gradual migration with fallback mechanisms and URL preservation
- **Data Loss**: Careful handling of calculator state and results, especially during transitions
- **SEO Impact**: Ensure all URLs and metadata remain consistent, monitor search console

### Development Risks
- **Complexity Increase**: Clear documentation (especially Calculator Extension Guide) and development guidelines
- **Learning Curve**: Comprehensive examples and best practices, peer reviews
- **Debugging Difficulty**: Enhanced error reporting and development tools, centralized logging
- **Maintenance Burden**: Automated testing and validation systems, clear ownership

This implementation plan ensures a systematic, risk-managed approach to refactoring the calculator architecture while maintaining system stability and user experience throughout the transiti