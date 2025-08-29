const fs = require('fs');
const path = require('path');

// Read the trading config
const configPath = path.join(__dirname, 'config', 'trading-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('=== Trading Config Test ===\n');

// Test 1: Check if price-action subcategory is correctly named
console.log('1. Price Action Subcategory:');
const priceActionCategory = config.indicatorCategories['price-action'];
const priceActionSubcategories = Object.keys(priceActionCategory.subcategories);
console.log(`   Subcategories: ${priceActionSubcategories.join(', ')}`);
console.log(`   Expected: price-action`);
console.log(`   ✅ ${priceActionSubcategories.includes('price-action') ? 'PASS' : 'FAIL'}\n`);

// Test 2: Check if technical subcategories are dynamic
console.log('2. Technical Subcategories:');
const technicalCategory = config.indicatorCategories.technical;
const technicalSubcategories = Object.keys(technicalCategory.subcategories);
console.log(`   Subcategories: ${technicalSubcategories.join(', ')}`);
console.log(`   Expected: directional, momentum, volatility`);
console.log(`   ✅ ${technicalSubcategories.length === 3 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Check indicator assignments
console.log('3. Indicator Assignments:');
console.log('   Technical:');
technicalSubcategories.forEach(sub => {
  const indicators = technicalCategory.subcategories[sub].indicators;
  console.log(`     ${sub}: ${indicators.join(', ')}`);
});

console.log('\n   Price Action:');
priceActionSubcategories.forEach(sub => {
  const indicators = priceActionCategory.subcategories[sub].indicators;
  console.log(`     ${sub}: ${indicators.join(', ')}`);
});

console.log('\n✅ Config validation complete!');
