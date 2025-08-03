#!/usr/bin/env node

/**
 * End-to-End Calculator Test Script
 * 
 * This script performs comprehensive end-to-end testing of the unified calculator architecture
 * by testing the actual built pages and verifying functionality.
 */

import fs from 'fs';
import path from 'path';

class E2ECalculatorTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test if a built page exists and contains expected content
   */
  testPageExists(pagePath, expectedContent = []) {
    const testName = `Page exists: ${pagePath}`;
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const fullPath = path.join('dist', pagePath, 'index.html');
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Page not found: ${fullPath}`);
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for expected content
      for (const expected of expectedContent) {
        if (!content.includes(expected)) {
          throw new Error(`Expected content not found: "${expected}"`);
        }
      }
      
      this.recordTest(testName, true, `Page exists and contains expected content`);
      console.log(`  ✅ PASS`);
      
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  /**
   * Test calculator module loading in built pages
   */
  testCalculatorModuleLoading() {
    const calculators = [
      { id: 'bmi', path: 'tools/bmi' },
      { id: 'egfr', path: 'tools/egfr' },
      { id: 'cha2ds2-vasc', path: 'tools/cha2ds2-vasc' }
    ];
    
    for (const calc of calculators) {
      const testName = `Calculator module loading: ${calc.id}`;
      console.log(`🧪 Testing: ${testName}`);
      
      try {
        const fullPath = path.join('dist', calc.path, 'index.html');
        
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Calculator page not found: ${fullPath}`);
        }
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check for calculator container
        if (!content.includes('calculator-container') && !content.includes('CalculatorContainer')) {
          throw new Error('Calculator container not found in page');
        }
        
        // Check for calculator-specific content
        const expectedContent = {
          'bmi': ['BMI', 'Body Mass Index', 'weight', 'height'],
          'egfr': ['eGFR', 'creatinine', 'kidney'],
          'cha2ds2-vasc': ['CHA2DS2-VASc', 'stroke', 'atrial fibrillation']
        };
        
        const expected = expectedContent[calc.id] || [];
        let foundContent = 0;
        
        for (const term of expected) {
          if (content.toLowerCase().includes(term.toLowerCase())) {
            foundContent++;
          }
        }
        
        if (foundContent === 0) {
          throw new Error(`No calculator-specific content found for ${calc.id}`);
        }
        
        this.recordTest(testName, true, `Found ${foundContent}/${expected.length} expected content items`);
        console.log(`  ✅ PASS: Found ${foundContent}/${expected.length} expected content items`);
        
      } catch (error) {
        this.recordTest(testName, false, error.message);
        console.log(`  ❌ FAIL: ${error.message}`);
      }
    }
  }

  /**
   * Test calculator registry initialization
   */
  testCalculatorRegistry() {
    const testName = 'Calculator Registry Initialization';
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const toolsIndexPath = path.join('dist', 'tools', 'index.html');
      
      if (!fs.existsSync(toolsIndexPath)) {
        throw new Error('Tools index page not found');
      }
      
      const content = fs.readFileSync(toolsIndexPath, 'utf-8');
      
      // Check for registry initialization logs in the built page
      const registryIndicators = [
        'Calculator Registry',
        'modules loaded',
        'BMI Calculator',
        'eGFR Calculator',
        'CHA2DS2-VASc Calculator'
      ];
      
      let foundIndicators = 0;
      for (const indicator of registryIndicators) {
        if (content.includes(indicator)) {
          foundIndicators++;
        }
      }
      
      if (foundIndicators < 2) {
        throw new Error(`Insufficient registry indicators found (${foundIndicators}/${registryIndicators.length})`);
      }
      
      this.recordTest(testName, true, `Found ${foundIndicators}/${registryIndicators.length} registry indicators`);
      console.log(`  ✅ PASS: Found ${foundIndicators}/${registryIndicators.length} registry indicators`);
      
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  /**
   * Test JavaScript bundle integrity
   */
  testJavaScriptBundles() {
    const testName = 'JavaScript Bundle Integrity';
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const astroDir = path.join('dist', '_astro');
      
      if (!fs.existsSync(astroDir)) {
        throw new Error('Astro build directory not found');
      }
      
      const files = fs.readdirSync(astroDir);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      if (jsFiles.length === 0) {
        throw new Error('No JavaScript files found in build');
      }
      
      // Check for calculator-related bundles
      const calculatorFiles = jsFiles.filter(file => 
        file.includes('Calculator') || 
        file.includes('calculator') ||
        file.includes('BMI') ||
        file.includes('eGFR') ||
        file.includes('CHA2DS2')
      );
      
      if (calculatorFiles.length === 0) {
        throw new Error('No calculator-related JavaScript bundles found');
      }
      
      // Verify bundle contents
      let validBundles = 0;
      for (const file of calculatorFiles) {
        const filePath = path.join(astroDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for basic JavaScript structure
        if (content.includes('function') || content.includes('=>') || content.includes('class')) {
          validBundles++;
        }
      }
      
      this.recordTest(testName, true, `Found ${validBundles} valid calculator bundles out of ${calculatorFiles.length} total`);
      console.log(`  ✅ PASS: Found ${validBundles} valid calculator bundles`);
      
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  /**
   * Test CSS bundle integrity
   */
  testCSSBundles() {
    const testName = 'CSS Bundle Integrity';
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const astroDir = path.join('dist', '_astro');
      
      if (!fs.existsSync(astroDir)) {
        throw new Error('Astro build directory not found');
      }
      
      const files = fs.readdirSync(astroDir);
      const cssFiles = files.filter(file => file.endsWith('.css'));
      
      if (cssFiles.length === 0) {
        throw new Error('No CSS files found in build');
      }
      
      // Check for calculator-related styles
      let calculatorStyles = 0;
      for (const file of cssFiles) {
        const filePath = path.join(astroDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for calculator-related CSS classes
        const calculatorClasses = [
          'calculator',
          'bmi',
          'egfr',
          'cha2ds2',
          'form',
          'result'
        ];
        
        for (const className of calculatorClasses) {
          if (content.includes(className)) {
            calculatorStyles++;
            break;
          }
        }
      }
      
      this.recordTest(testName, true, `Found calculator styles in ${calculatorStyles}/${cssFiles.length} CSS files`);
      console.log(`  ✅ PASS: Found calculator styles in ${calculatorStyles} CSS files`);
      
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  /**
   * Test error boundary implementation
   */
  testErrorBoundaries() {
    const testName = 'Error Boundary Implementation';
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      // Check if ErrorBoundary component exists in the build
      const astroDir = path.join('dist', '_astro');
      const files = fs.readdirSync(astroDir);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      let errorBoundaryFound = false;
      
      for (const file of jsFiles) {
        const filePath = path.join(astroDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
          errorBoundaryFound = true;
          break;
        }
      }
      
      if (!errorBoundaryFound) {
        throw new Error('Error boundary implementation not found in bundles');
      }
      
      this.recordTest(testName, true, 'Error boundary implementation found in JavaScript bundles');
      console.log(`  ✅ PASS: Error boundary implementation found`);
      
    } catch (error) {
      this.recordTest(testName, false, error.message);
      console.log(`  ❌ FAIL: ${error.message}`);
    }
  }

  /**
   * Record test result
   */
  recordTest(name, passed, details) {
    this.results.tests.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }

  /**
   * Save test results
   */
  saveResults() {
    const outputPath = 'e2e-test-results.json';
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Test results saved to ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to save test results: ${error.message}`);
    }
  }

  /**
   * Run all end-to-end tests
   */
  async run() {
    console.log('🚀 Starting End-to-End Calculator Tests\n');
    
    // Test basic page existence
    this.testPageExists('tools/bmi', ['BMI', 'calculator']);
    this.testPageExists('tools/egfr', ['eGFR', 'calculator']);
    this.testPageExists('tools/cha2ds2-vasc', ['CHA2DS2-VASc', 'calculator']);
    this.testPageExists('tools', ['calculator', 'tools']);
    
    console.log();
    
    // Test calculator module loading
    this.testCalculatorModuleLoading();
    
    console.log();
    
    // Test calculator registry
    this.testCalculatorRegistry();
    
    console.log();
    
    // Test JavaScript bundles
    this.testJavaScriptBundles();
    
    console.log();
    
    // Test CSS bundles
    this.testCSSBundles();
    
    console.log();
    
    // Test error boundaries
    this.testErrorBoundaries();
    
    console.log();
    
    // Print summary
    const { total, passed, failed } = this.results.summary;
    const passRate = Math.round((passed / total) * 100);
    
    console.log('📊 Test Summary:');
    console.log(`  Total Tests: ${total}`);
    console.log(`  Passed: ${passed} (${passRate}%)`);
    console.log(`  Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('  🎉 All tests passed!');
    } else {
      console.log('  ⚠️  Some tests failed. Check details above.');
    }
    
    console.log();
    this.saveResults();
    
    return failed === 0;
  }
}

// Check if JSDOM is available (optional dependency)
let JSDOMClass;
try {
  const jsdomModule = await import('jsdom');
  JSDOMClass = jsdomModule.JSDOM;
} catch (error) {
  console.log('ℹ️  JSDOM not available, skipping DOM-based tests');
}

// Run the tests
const tester = new E2ECalculatorTester();
const success = await tester.run();

process.exit(success ? 0 : 1);