# Calculator Architecture Refactor Implementation Plan

## Overview

This implementation plan converts the approved design into a series of discrete, manageable coding tasks that will transform the current centralized calculator architecture into a decentralized, plugin-based system. The plan follows the MVP approach, prioritizing calculator isolation and independence while maintaining compatibility with existing React components.

## Implementation Tasks

### Phase 1: Core Infrastructure Setup

- [x] 1. Create plugin type definitions and interfaces
  - Create `src/types/calculator-plugin.ts` with all plugin interfaces
  - Define `CalculatorPlugin`, `CalculatorMetadata`, `PluginLoadResult` interfaces
  - Add error types: `PluginConflictError`, `PluginValidationError`, `DependencyError`
  - Ensure TypeScript strict mode compatibility
  - _Requirements: 1.1, 3.1, 5.1_

- [x] 2. Implement Calculator Registry system
  - Create `src/utils/calculator-registry.ts` with plugin management
  - Implement plugin registration with version-based conflict resolution
  - Add namespace isolation and plugin retrieval methods
  - Include plugin validation and lifecycle management
  - Add comprehensive error handling and logging
  - _Requirements: 2.1, 2.2, 5.1, 10.1_

- [x] 3. Build Plugin Discovery mechanism
  - Create `src/utils/calculator-discovery.ts` for build-time plugin scanning
  - Implement filesystem-based directory scanning using Node.js APIs
  - Add plugin validation and structure checking
  - Handle malformed plugins gracefully with detailed error messages
  - Support both build-time and development-time discovery
  - _Requirements: 4.1, 4.2, 4.3, 7.1_

- [x] 4. Create Error Boundary and error handling system
  - Create `src/components/common/ErrorBoundary.tsx` for React error isolation
  - Implement calculator-specific error types and handling
  - Add error recovery mechanisms and user-friendly error messages
  - Create fallback UI components for failed calculators
  - Ensure errors in one calculator don't affect others
  - _Requirements: 7.1, 7.2, 7.3, 1.3_

### Phase 2: Dynamic Calculator Loader

- [x] 5. Implement Dynamic Calculator Loader
  - Create `src/utils/dynamic-calculator-loader.ts` replacing ModularCalculatorLoader

  - Add plugin initialization and dependency resolution
  - Implement lazy loading with Astro/Vite chunk generation
  - Add timeout protection and retry mechanisms for plugin loading
  - Include performance monitoring and caching
  - _Requirements: 1.1, 8.1, 8.2, 6.1_

- [x] 6. Create Calculator Instance management
  - Create `src/utils/calculator-instance.ts` for individual calculator lifecycle
  - Implement React component rendering with error boundaries
  - Add input validation and calculation execution with timeout protection
  - Handle calculator destruction and cleanup
  - Ensure proper memory management and resource cleanup
  - _Requirements: 7.1, 7.2, 8.3, 11.1_

- [x] 7. Build API Client abstraction layer
  - Create `src/utils/api-client.ts` with StaticAPIClient and HTTPAPIClient
  - Implement current static data handling for SSG environment
  - Design future-ready interface for backend integration
  - Add error handling and retry logic for API calls
  - Include request/response logging and debugging support
  - _Requirements: 6.1, 6.2, 13.1_

### Phase 3: Plugin Migration and Testing

- [x] 8. Convert existing BMI calculator to plugin format
  - Create `src/calculators/general/bmi/index.ts` plugin entry point
  - Migrate existing BMI logic to new plugin interface
  - Update BMIDashboard.tsx to work with new plugin system
  - Add plugin metadata and validation
  - Test isolation and error handling
  - _Requirements: 6.1, 6.3, 1.1, 1.3_

- [x] 9. Convert existing CHA2DS2-VASc calculator to plugin format
  - Create `src/calculators/cardiology/cha2ds2-vasc/index.ts` plugin entry point
  - Migrate existing CHA2DS2-VASc logic to new plugin interface
  - Update CHA2DS2VAScDashboard.tsx to work with new plugin system
  - Add namespace isolation (cardiology namespace)
  - Test cross-plugin isolation
  - _Requirements: 2.1, 2.2, 6.1, 1.3_

- [x] 10. Convert existing eGFR calculator to plugin format
  - Create `src/calculators/nephrology/egfr/index.ts` plugin entry point
  - Migrate existing eGFR logic to new plugin interface
  - Update EGFRDashboard.tsx to work with new plugin system
  - Add namespace isolation (nephrology namespace)
  - Verify all three calculators work independently
  - _Requirements: 2.1, 2.2, 6.1, 1.3_

- [x] 11. Create comprehensive plugin isolation tests
  - Write unit tests for Calculator Registry functionality
  - Test plugin loading, registration, and conflict detection
  - Create integration tests for cross-plugin isolation
  - Test error scenarios: plugin failures, malformed configs, timeouts
  - Verify memory cleanup and resource management
  - _Requirements: 1.3, 7.1, 7.2, 5.1_

### Phase 4: Integration and Backward Compatibility

- [x] 12. Update Astro pages to use new Dynamic Calculator Loader
  - Modify calculator pages to use DynamicCalculatorLoader instead of ModularCalculatorLoader
  - Ensure backward compatibility during transition period
  - Add fallback mechanisms for legacy calculator IDs
  - Test all calculator pages render correctly
  - Verify SSG build process works with new plugin system
  - _Requirements: 6.1, 6.2, 13.1, 13.2_

- [x] 13. Create plugin development documentation and guides
  - Update NEW_CALCULATOR_GUIDE.md for new plugin system

  - Create plugin development best practices documentation
  - Add troubleshooting guide for common plugin issues
  - Document namespace conventions and naming guidelines
  - Include examples of plugin creation and testing
  - _Requirements: 9.1, 9.6, 9.7, 12.1_

- [x] 14. Implement backward compatibility layer
  - Create compatibility wrapper for old calculator IDs
  - Add deprecation warnings for legacy usage patterns
  - Ensure smooth transition without breaking existing functionality
  - Test that old calculator URLs still work
  - Plan migration timeline for removing legacy support
  - _Requirements: 6.1, 6.2, 6.3, 13.1_

### Phase 5: Performance Optimization and Cleanup

- [ ] 15. Add performance monitoring and analytics
  - Implement plugin loading time measurement
  - Add calculator execution performance tracking
  - Create performance dashboard for development
  - Monitor memory usage and resource cleanup
  - Add performance regression detection
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 16. Optimize lazy loading and caching
  - Implement intelligent plugin preloading based on usage patterns
  - Add plugin result caching for repeated calculations
  - Optimize bundle splitting for better loading performance
  - Implement service worker caching for offline support
  - Test loading performance across different network conditions
  - _Requirements: 8.1, 8.2, 8.4, 5.1_

- [ ] 17. Remove legacy ModularCalculatorLoader
  - Safely remove old ModularCalculatorLoader.ts file
  - Clean up unused imports and references
  - Remove hardcoded idToFolderMap and dashboard mappings
  - Update all remaining references to use new system
  - Verify no functionality is broken after removal
  - _Requirements: 13.3, 13.4, 1.1_

### Phase 6: Advanced Features and Future-Proofing

- [ ] 18. Add hot module replacement for development
  - Implement HMR support for plugin development
  - Add automatic plugin reloading on file changes
  - Create development-time plugin validation and error reporting
  - Test rapid development workflow with multiple calculators
  - Ensure HMR doesn't affect production builds
  - _Requirements: 9.5, 9.7, 12.1_

- [ ] 19. Create plugin marketplace foundation
  - Design plugin discovery and listing UI components
  - Implement plugin metadata display and filtering
  - Add plugin search and categorization functionality
  - Create plugin installation and management interface
  - Test with multiple plugins across different namespaces
  - _Requirements: 12.1, 12.2, 2.3, 4.1_

- [ ] 20. Implement advanced dependency management
  - Add semantic versioning support for plugin dependencies
  - Implement dependency resolution and conflict detection
  - Create dependency graph visualization for debugging
  - Add automatic dependency installation and updates
  - Test complex dependency scenarios and circular dependencies
  - _Requirements: 10.2, 10.3, 5.2, 5.3_

## Success Criteria

### MVP Success Criteria (Phases 1-4)

1. All existing calculators (BMI, CHA2DS2-VASc, eGFR) work independently as plugins
2. No calculator can affect or break another calculator
3. New calculators can be added without modifying core system code
4. Plugin loading failures are isolated and don't crash the application
5. Performance is equal to or better than the current system
6. All existing calculator URLs and functionality remain working

### Advanced Success Criteria (Phases 5-6)

1. Plugin development workflow is streamlined with HMR support
2. Performance monitoring provides actionable insights
3. Plugin marketplace foundation enables easy plugin discovery
4. Advanced dependency management handles complex scenarios
5. System is ready for future backend integration
6. Documentation enables third-party plugin development

## Risk Mitigation

### Technical Risks

- **Plugin Loading Failures**: Comprehensive error boundaries and fallback mechanisms
- **Performance Regression**: Continuous performance monitoring and optimization
- **Memory Leaks**: Proper cleanup and resource management in all components
- **Build Process Issues**: Thorough testing of SSG build with new plugin system

### Migration Risks

- **Breaking Changes**: Extensive backward compatibility layer and testing
- **User Experience Disruption**: Gradual migration with fallback mechanisms
- **Data Loss**: Careful handling of calculator state and results
- **SEO Impact**: Ensure all URLs and metadata remain consistent

### Development Risks

- **Complexity Increase**: Clear documentation and development guidelines
- **Learning Curve**: Comprehensive examples and best practices
- **Debugging Difficulty**: Enhanced error reporting and development tools
- **Maintenance Burden**: Automated testing and validation systems

This implementation plan ensures a systematic, risk-managed approach to refactoring the calculator architecture while maintaining system stability and user experience throughout the transition.
