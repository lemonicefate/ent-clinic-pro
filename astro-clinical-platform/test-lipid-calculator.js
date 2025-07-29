// Simple test for lipid management calculator
const { SimpleCalculatorService } = require('./dist/server/chunks/simple-calculator-service_BqLQhd1E.mjs');

async function testLipidCalculator() {
  try {
    const service = SimpleCalculatorService.getInstance();
    
    // Test inputs
    const inputs = {
      hasASCVD: true,
      ldl: 150,
      tg: 200,
      hasSmoking: true
    };
    
    console.log('Testing lipid calculator with inputs:', inputs);
    
    // Load calculator
    const calculatorData = await service.loadCalculator('cardiology.lipid-management');
    console.log('Calculator loaded:', calculatorData.config.name);
    
    // Validate inputs
    const validation = await service.validate('cardiology.lipid-management', inputs);
    console.log('Validation result:', validation);
    
    // Calculate
    const result = await service.calculate('cardiology.lipid-management', inputs);
    console.log('Calculation result:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLipidCalculator();