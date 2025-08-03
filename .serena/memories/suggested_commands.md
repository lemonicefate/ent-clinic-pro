# Suggested Commands for Development

## Development Commands
```bash
# Start development server
npm run dev
# or
npm start

# Build for production
npm run build

# Preview production build
npm run preview

# Run Astro CLI
npm run astro
```

## Testing Commands
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run specific test file
npm test src/components/calculators/modules/bmi/__tests__/calculator.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Code Quality Commands
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npx astro check
```

## Storybook Commands
```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Windows-Specific Commands
```cmd
# List files
dir

# Remove file
del file.txt

# Remove directory
rmdir /s /q directory

# Copy file
copy source.txt destination.txt

# Create directory
mkdir directory

# View file content
type file.txt

# Command separator (instead of &&)
command1 & command2
```

## Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "message"

# Push changes
git push origin main

# Pull latest changes
git pull origin main
```

## Utility Commands
```bash
# Find files
find . -name "*.ts" -type f

# Search in files (use ripgrep if available)
rg "search term" --type ts

# Count lines of code
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l
```