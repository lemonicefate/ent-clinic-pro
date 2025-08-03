# Task Completion Guidelines

## Before Completing Any Task

### 1. Code Quality Checks
```bash
# Run linting
npm run lint

# Fix any linting issues
npm run lint:fix

# Type check
npx astro check
```

### 2. Testing Requirements
```bash
# Run all tests
npm test

# Ensure tests pass for modified modules
npm test src/components/calculators/modules/[module-name]/__tests__/

# Run tests with coverage if adding new features
npm test -- --coverage
```

### 3. Build Verification
```bash
# Ensure production build works
npm run build

# Test the built version
npm run preview
```

## For Calculator Module Development

### 1. Module Structure Validation
- Ensure all required files exist:
  - `index.tsx` (main component)
  - `config.ts` (configuration)
  - `types.ts` (type definitions)
  - `calculator.ts` (calculation logic)
  - `[Module]Form.tsx` (form component)
  - `[Module]Results.tsx` (results component)
  - `__tests__/calculator.test.ts` (tests)

### 2. Testing Requirements
- Unit tests for calculation logic
- Form validation tests
- Results display tests
- Error handling tests
- Edge case coverage

### 3. Integration Verification
- Test calculator loads in registry
- Verify form submission works
- Check results display correctly
- Ensure error boundaries work

## Documentation Updates
- Update module README if applicable
- Add JSDoc comments for new functions
- Update type definitions
- Document any breaking changes

## Performance Considerations
- Check bundle size impact
- Verify lazy loading works
- Test on mobile devices
- Validate accessibility compliance

## Final Checklist
- [ ] All tests pass
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Types are correct
- [ ] Documentation updated
- [ ] Performance verified
- [ ] Accessibility checked