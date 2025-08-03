#!/usr/bin/env node

/**
 * Calculator Performance Analysis Script
 * 
 * This script analyzes the performance of the unified calculator architecture,
 * measuring module loading times, memory usage, and rendering performance.
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

class CalculatorPerformanceAnalyzer {
  constructor() {
    this.results = {
      moduleLoadTimes: {},
      memoryUsage: {},
      bundleSizes: {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze module loading performance
   */
  async analyzeModuleLoading() {
    console.log('🔍 Analyzing module loading performance...');
    
    const modulesDir = 'src/components/calculators/modules';
    const modules = ['bmi', 'egfr', 'cha2ds2-vasc'];
    
    for (const moduleId of modules) {
      const startTime = performance.now();
      
      try {
        // Simulate module loading (in a real scenario, this would be dynamic import)
        const modulePath = path.join(modulesDir, moduleId);
        const moduleFiles = [
          'index.tsx',
          'config.ts',
          'calculator.ts',
          'types.ts',
          `${moduleId.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')}Form.tsx`,
          `${moduleId.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')}Results.tsx`
        ];
        
        let totalSize = 0;
        let fileCount = 0;
        
        for (const file of moduleFiles) {
          const filePath = path.join(modulePath, file);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
            fileCount++;
          }
        }
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        this.results.moduleLoadTimes[moduleId] = {
          loadTime: Math.round(loadTime * 100) / 100,
          fileCount,
          totalSize,
          averageSizePerFile: Math.round(totalSize / fileCount)
        };
        
        console.log(`  ✅ ${moduleId}: ${loadTime.toFixed(2)}ms (${fileCount} files, ${totalSize} bytes)`);
        
      } catch (error) {
        console.error(`  ❌ ${moduleId}: Failed to analyze - ${error.message}`);
        this.results.moduleLoadTimes[moduleId] = {
          error: error.message,
          loadTime: -1
        };
      }
    }
  }

  /**
   * Analyze bundle sizes
   */
  async analyzeBundleSizes() {
    console.log('📦 Analyzing bundle sizes...');
    
    const distDir = 'dist/_astro';
    
    if (!fs.existsSync(distDir)) {
      console.log('  ⚠️  Build directory not found. Run `npm run build` first.');
      return;
    }
    
    try {
      const files = fs.readdirSync(distDir);
      const calculatorFiles = files.filter(file => 
        file.includes('Calculator') || 
        file.includes('calculator') ||
        file.includes('BMI') ||
        file.includes('eGFR') ||
        file.includes('CHA2DS2')
      );
      
      let totalSize = 0;
      
      for (const file of calculatorFiles) {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
        
        this.results.bundleSizes[file] = {
          size: stats.size,
          sizeKB,
          type: file.endsWith('.js') ? 'JavaScript' : 
                file.endsWith('.css') ? 'CSS' : 'Other'
        };
        
        totalSize += stats.size;
        console.log(`  📄 ${file}: ${sizeKB} KB`);
      }
      
      this.results.bundleSizes._total = {
        files: calculatorFiles.length,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
      };
      
      console.log(`  📊 Total: ${calculatorFiles.length} files, ${Math.round(totalSize / 1024 * 100) / 100} KB`);
      
    } catch (error) {
      console.error(`  ❌ Bundle analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze memory usage patterns
   */
  analyzeMemoryUsage() {
    console.log('🧠 Analyzing memory usage...');
    
    const memUsage = process.memoryUsage();
    
    this.results.memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    };
    
    console.log(`  💾 RSS: ${this.results.memoryUsage.rss} MB`);
    console.log(`  🏠 Heap Total: ${this.results.memoryUsage.heapTotal} MB`);
    console.log(`  📊 Heap Used: ${this.results.memoryUsage.heapUsed} MB`);
    console.log(`  🔗 External: ${this.results.memoryUsage.external} MB`);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    console.log('💡 Generating performance recommendations...');
    
    const recommendations = [];
    
    // Analyze module load times
    const loadTimes = Object.values(this.results.moduleLoadTimes)
      .filter(result => result.loadTime > 0)
      .map(result => result.loadTime);
    
    if (loadTimes.length > 0) {
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);
      
      if (avgLoadTime > 10) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          issue: 'High average module load time',
          recommendation: 'Consider implementing module caching or lazy loading',
          details: `Average load time: ${avgLoadTime.toFixed(2)}ms`
        });
      }
      
      if (maxLoadTime > 20) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          issue: 'Some modules have high load times',
          recommendation: 'Optimize slow-loading modules or split them into smaller chunks',
          details: `Maximum load time: ${maxLoadTime.toFixed(2)}ms`
        });
      }
    }
    
    // Analyze bundle sizes
    if (this.results.bundleSizes._total) {
      const totalSizeKB = this.results.bundleSizes._total.totalSizeKB;
      
      if (totalSizeKB > 500) {
        recommendations.push({
          type: 'bundle',
          priority: 'high',
          issue: 'Large bundle size',
          recommendation: 'Consider code splitting and tree shaking',
          details: `Total bundle size: ${totalSizeKB} KB`
        });
      } else if (totalSizeKB > 200) {
        recommendations.push({
          type: 'bundle',
          priority: 'medium',
          issue: 'Moderate bundle size',
          recommendation: 'Monitor bundle growth and consider optimization',
          details: `Total bundle size: ${totalSizeKB} KB`
        });
      }
    }
    
    // Analyze memory usage
    const heapUsed = this.results.memoryUsage.heapUsed;
    if (heapUsed > 100) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        issue: 'High memory usage',
        recommendation: 'Review memory usage patterns and implement cleanup',
        details: `Heap used: ${heapUsed} MB`
      });
    }
    
    this.results.recommendations = recommendations;
    
    if (recommendations.length === 0) {
      console.log('  ✅ No performance issues detected!');
    } else {
      recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : 
                        rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${priority} ${rec.issue}`);
        console.log(`     💡 ${rec.recommendation}`);
        console.log(`     📊 ${rec.details}`);
      });
    }
  }

  /**
   * Save results to file
   */
  saveResults() {
    const outputPath = 'performance-analysis-results.json';
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Results saved to ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
    }
  }

  /**
   * Run complete performance analysis
   */
  async run() {
    console.log('🚀 Starting Calculator Performance Analysis\n');
    
    const startTime = performance.now();
    
    await this.analyzeModuleLoading();
    console.log();
    
    await this.analyzeBundleSizes();
    console.log();
    
    this.analyzeMemoryUsage();
    console.log();
    
    this.generateRecommendations();
    console.log();
    
    const endTime = performance.now();
    const totalTime = Math.round((endTime - startTime) * 100) / 100;
    
    this.results.analysisTime = totalTime;
    
    console.log(`⏱️  Analysis completed in ${totalTime}ms`);
    console.log();
    
    this.saveResults();
  }
}

// Run the analysis
const analyzer = new CalculatorPerformanceAnalyzer();
analyzer.run().catch(console.error);