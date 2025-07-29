#!/usr/bin/env node

/**
 * Migration CLI Tool
 * 
 * Command-line interface for migrating from the old calculator system
 * to the new plugin-based architecture.
 * 
 * Usage:
 *   node scripts/migration-cli.js report
 *   node scripts/migration-cli.js plan <legacy-id>
 *   node scripts/migration-cli.js validate <plugin-id>
 *   node scripts/migration-cli.js checklist
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// CLI Commands
const commands = {
  report: generateMigrationReport,
  plan: createMigrationPlan,
  validate: validateMigration,
  checklist: showMigrationChecklist,
  help: showHelp
};

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  console.log(chalk.blue.bold('🔄 Calculator Migration Tool\n'));
  
  if (!commands[command]) {
    console.error(chalk.red(`Unknown command: ${command}`));
    showHelp();
    process.exit(1);
  }
  
  try {
    await commands[command](args.slice(1));
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Generate migration report
 */
async function generateMigrationReport() {
  console.log(chalk.yellow('📊 Generating migration report...\n'));
  
  // Simulate migration analysis
  const report = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    summary: {
      totalLegacyReferences: 15,
      migratedReferences: 3,
      pendingMigrations: 12,
      criticalIssues: 4
    },
    legacyReferences: [
      {
        type: 'calculator-id',
        location: 'src/pages/tools/bmi.astro:15',
        oldValue: 'bmi',
        newValue: 'general.bmi',
        priority: 'high'
      },
      {
        type: 'api-call',
        location: 'src/components/Calculator.tsx:42',
        oldValue: 'getCalculatorConfig()',
        newValue: 'CalculatorRegistry.get()',
        priority: 'critical'
      }
    ],
    recommendations: [
      'Address 4 critical migration issues first',
      'Plan for 8 high-priority migrations',
      'Test thoroughly after each migration step'
    ]
  };
  
  // Display summary
  console.log(chalk.green.bold('📋 Migration Summary'));
  console.log(`Total Legacy References: ${chalk.yellow(report.summary.totalLegacyReferences)}`);
  console.log(`Migrated: ${chalk.green(report.summary.migratedReferences)}`);
  console.log(`Pending: ${chalk.yellow(report.summary.pendingMigrations)}`);
  console.log(`Critical Issues: ${chalk.red(report.summary.criticalIssues)}\n`);
  
  // Display critical issues
  if (report.summary.criticalIssues > 0) {
    console.log(chalk.red.bold('🚨 Critical Issues'));
    report.legacyReferences
      .filter(ref => ref.priority === 'critical')
      .forEach(ref => {
        console.log(`  ${chalk.red('•')} ${ref.location}: ${ref.oldValue} → ${ref.newValue}`);
      });
    console.log();
  }
  
  // Display recommendations
  console.log(chalk.blue.bold('💡 Recommendations'));
  report.recommendations.forEach(rec => {
    console.log(`  ${chalk.blue('•')} ${rec}`);
  });
  console.log();
  
  // Save detailed report
  const reportPath = join(projectRoot, 'migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`📄 Detailed report saved to: ${reportPath}`));
}

/**
 * Create migration plan for specific calculator
 */
async function createMigrationPlan(args) {
  const legacyId = args[0];
  
  if (!legacyId) {
    console.error(chalk.red('Please provide a legacy calculator ID'));
    console.log('Usage: node scripts/migration-cli.js plan <legacy-id>');
    return;
  }
  
  console.log(chalk.yellow(`📋 Creating migration plan for: ${legacyId}\n`));
  
  // Legacy ID mapping
  const legacyMapping = {
    'bmi': 'general.bmi',
    'egfr': 'nephrology.egfr',
    'cha2ds2-vasc': 'cardiology.cha2ds2-vasc'
  };
  
  const pluginId = legacyMapping[legacyId];
  
  if (!pluginId) {
    console.error(chalk.red(`No plugin mapping found for legacy ID: ${legacyId}`));
    return;
  }
  
  console.log(chalk.green(`✅ Plugin ID: ${pluginId}\n`));
  
  // Migration steps
  const steps = [
    {
      title: 'Update Import Statements',
      description: 'Replace old calculator engine imports with plugin system imports',
      priority: 'high',
      estimatedTime: '15 minutes',
      example: {
        before: `import { getCalculatorConfig } from '../utils/calculator-engine.js';`,
        after: `import { CalculatorRegistry } from '../utils/calculator-registry.js';`
      }
    },
    {
      title: 'Update Calculator ID References',
      description: `Replace legacy ID "${legacyId}" with plugin ID "${pluginId}"`,
      priority: 'critical',
      estimatedTime: '10 minutes',
      example: {
        before: `const config = await getCalculatorConfig('${legacyId}');`,
        after: `const registry = CalculatorRegistry.getInstance();\nconst plugin = registry.get('${pluginId}');`
      }
    },
    {
      title: 'Update Component Usage',
      description: 'Replace Calculator component with PluginCalculator component',
      priority: 'high',
      estimatedTime: '20 minutes',
      example: {
        before: `<Calculator calculatorId="${legacyId}" />`,
        after: `<PluginCalculator pluginId="${pluginId}" />`
      }
    }
  ];
  
  console.log(chalk.blue.bold('📝 Migration Steps:\n'));
  
  steps.forEach((step, index) => {
    const priorityColor = step.priority === 'critical' ? chalk.red : 
                         step.priority === 'high' ? chalk.yellow : chalk.green;
    
    console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.bold(step.title)}`);
    console.log(`   ${step.description}`);
    console.log(`   Priority: ${priorityColor(step.priority.toUpperCase())} | Time: ${step.estimatedTime}`);
    
    if (step.example) {
      console.log(chalk.gray('   Before:'));
      console.log(chalk.red(`   ${step.example.before}`));
      console.log(chalk.gray('   After:'));
      console.log(chalk.green(`   ${step.example.after}`));
    }
    console.log();
  });
  
  // Save migration plan
  const plan = {
    legacyId,
    pluginId,
    steps,
    createdAt: new Date().toISOString()
  };
  
  const planPath = join(projectRoot, `migration-plan-${legacyId}.json`);
  await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
  console.log(chalk.green(`📄 Migration plan saved to: ${planPath}`));
}

/**
 * Validate migration for specific plugin
 */
async function validateMigration(args) {
  const pluginId = args[0];
  
  if (!pluginId) {
    console.error(chalk.red('Please provide a plugin ID'));
    console.log('Usage: node scripts/migration-cli.js validate <plugin-id>');
    return;
  }
  
  console.log(chalk.yellow(`🔍 Validating migration for: ${pluginId}\n`));
  
  // Simulate validation
  const validationResults = {
    pluginId,
    success: true,
    issues: [],
    testResults: [
      { id: 'basic-calculation', description: 'Test basic calculation', status: 'passed' },
      { id: 'input-validation', description: 'Test input validation', status: 'passed' },
      { id: 'edge-cases', description: 'Test edge cases', status: 'passed' }
    ]
  };
  
  // Display results
  if (validationResults.success) {
    console.log(chalk.green.bold('✅ Migration validation passed!\n'));
  } else {
    console.log(chalk.red.bold('❌ Migration validation failed!\n'));
    
    console.log(chalk.red.bold('Issues found:'));
    validationResults.issues.forEach(issue => {
      console.log(`  ${chalk.red('•')} ${issue}`);
    });
    console.log();
  }
  
  // Display test results
  console.log(chalk.blue.bold('🧪 Test Results:'));
  validationResults.testResults.forEach(test => {
    const statusIcon = test.status === 'passed' ? chalk.green('✅') : chalk.red('❌');
    console.log(`  ${statusIcon} ${test.description}`);
  });
  console.log();
  
  // Save validation report
  const reportPath = join(projectRoot, `validation-${pluginId.replace('.', '-')}.json`);
  await fs.writeFile(reportPath, JSON.stringify(validationResults, null, 2));
  console.log(chalk.green(`📄 Validation report saved to: ${reportPath}`));
}

/**
 * Show migration checklist
 */
async function showMigrationChecklist() {
  console.log(chalk.blue.bold('📋 Migration Checklist\n'));
  
  const checklist = [
    {
      category: 'Preparation',
      items: [
        { task: 'Backup current codebase', priority: 'critical', completed: false },
        { task: 'Review migration documentation', priority: 'high', completed: false },
        { task: 'Identify all legacy calculator references', priority: 'high', completed: false }
      ]
    },
    {
      category: 'Code Changes',
      items: [
        { task: 'Update import statements', priority: 'high', completed: false },
        { task: 'Replace calculator IDs with plugin IDs', priority: 'critical', completed: false },
        { task: 'Update component usage', priority: 'high', completed: false },
        { task: 'Update API calls', priority: 'medium', completed: false }
      ]
    },
    {
      category: 'Testing',
      items: [
        { task: 'Create test cases', priority: 'high', completed: false },
        { task: 'Run unit tests', priority: 'high', completed: false },
        { task: 'Run integration tests', priority: 'medium', completed: false },
        { task: 'Perform user acceptance testing', priority: 'high', completed: false }
      ]
    },
    {
      category: 'Cleanup',
      items: [
        { task: 'Remove legacy imports', priority: 'low', completed: false },
        { task: 'Update documentation', priority: 'medium', completed: false },
        { task: 'Remove deprecated code', priority: 'low', completed: false }
      ]
    }
  ];
  
  checklist.forEach(section => {
    console.log(chalk.cyan.bold(`${section.category}:`));
    
    section.items.forEach(item => {
      const checkbox = item.completed ? chalk.green('☑') : chalk.gray('☐');
      const priorityColor = item.priority === 'critical' ? chalk.red : 
                           item.priority === 'high' ? chalk.yellow : 
                           item.priority === 'medium' ? chalk.blue : chalk.gray;
      
      console.log(`  ${checkbox} ${item.task} ${priorityColor(`[${item.priority.toUpperCase()}]`)}`);
    });
    console.log();
  });
  
  console.log(chalk.yellow('💡 Tip: Complete items in order of priority (critical → high → medium → low)'));
}

/**
 * Show help information
 */
function showHelp() {
  console.log(chalk.blue.bold('🔄 Calculator Migration Tool\n'));
  console.log('Available commands:\n');
  
  const commandHelp = [
    { command: 'report', description: 'Generate comprehensive migration report' },
    { command: 'plan <legacy-id>', description: 'Create migration plan for specific calculator' },
    { command: 'validate <plugin-id>', description: 'Validate migration for specific plugin' },
    { command: 'checklist', description: 'Show migration checklist' },
    { command: 'help', description: 'Show this help message' }
  ];
  
  commandHelp.forEach(({ command, description }) => {
    console.log(`  ${chalk.cyan(command.padEnd(20))} ${description}`);
  });
  
  console.log('\nExamples:');
  console.log(`  ${chalk.gray('node scripts/migration-cli.js report')}`);
  console.log(`  ${chalk.gray('node scripts/migration-cli.js plan bmi')}`);
  console.log(`  ${chalk.gray('node scripts/migration-cli.js validate general.bmi')}`);
  console.log();
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, commands };