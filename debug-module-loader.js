// Debug script to test module loading
console.log('Testing module loading...');

// Test import.meta.glob
const moduleImports = import.meta.glob('./src/components/calculators/modules/*/index.tsx');
console.log('Found modules:', Object.keys(moduleImports));

// Try to load one module
const bmiPath = './src/components/calculators/modules/bmi/index.tsx';
if (moduleImports[bmiPath]) {
  console.log('BMI module found, attempting to load...');
  moduleImports[bmiPath]()
    .then(module => {
      console.log('BMI module loaded successfully:', module);
      console.log('Default export:', module.default);
    })
    .catch(error => {
      console.error('Error loading BMI module:', error);
    });
} else {
  console.error('BMI module not found in glob results');
  console.log('Available paths:', Object.keys(moduleImports));
}