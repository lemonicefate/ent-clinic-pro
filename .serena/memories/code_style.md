# Code Style and Conventions

## TypeScript Standards
- **Strict Mode**: Full TypeScript strict mode enabled
- **Type Definitions**: Comprehensive type coverage for all modules
- **Interface Naming**: PascalCase for interfaces (e.g., `CalculatorConfig`)
- **Type Exports**: Centralized type exports from `types/` directory

## File Naming Conventions
- **Components**: PascalCase (e.g., `BMIForm.tsx`, `CalculatorContainer.tsx`)
- **Utilities**: camelCase (e.g., `calculator-engine.ts`, `content-helpers.ts`)
- **Types**: camelCase with `.ts` extension (e.g., `calculator.ts`, `common.ts`)
- **Tests**: Same as source file with `.test.ts` or `.spec.ts` suffix

## Component Structure
- **Form Components**: `[Calculator]Form.tsx` for input handling
- **Result Components**: `[Calculator]Results.tsx` for output display
- **Dashboard Components**: `[Calculator]Dashboard.tsx` for visualization
- **Index Files**: `index.tsx` as module entry point

## Code Organization
- **Modular Architecture**: Each calculator in separate module directory
- **Separation of Concerns**: Logic, UI, and configuration separated
- **Error Handling**: Comprehensive error boundaries and validation
- **Accessibility**: ARIA labels and semantic HTML throughout

## Import/Export Patterns
- **Default Exports**: For main component/function
- **Named Exports**: For utilities and types
- **Barrel Exports**: Index files re-export module contents
- **Relative Imports**: Use relative paths within modules

## Documentation Standards
- **JSDoc Comments**: For all public functions and interfaces
- **README Files**: Module-level documentation
- **Type Annotations**: Explicit return types for functions
- **Configuration Comments**: Inline comments for complex configurations