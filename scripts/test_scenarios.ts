/**
 * Comprehensive Automated Scenario Validation Script for Lumen
 * Validates:
 * 1. Receipt Analysis API endpoint (/api/analyze-receipt)
 * 2. Multi-Buddy Isolated Ledgers (Alex vs Gautam)
 * 3. Split calculation and Debt settlement
 * 4. Consolidated monthly spend analytics
 */

import { execSync } from 'child_process';
import { calculateBuddyBalance, calculateEffectiveAmount, filterExpensesByUser } from '../src/utils/analytics';
import { Expense } from '../src/types/expense';

function runAllTests() {
  console.log('====================================================');
  console.log('🚀 LUMEN EXPENSE TRACKER - AUTOMATED VALIDATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (details) console.error(`     Reason: ${details}`);
      failed++;
    }
  }

  // --- SUITE 1: Scan Receipt API Endpoint Tests ---
  console.log('--- SUITE 1: Scan Receipt API Endpoint (/api/analyze-receipt) ---');
  try {
    // Scenario 1.1: Receipt with Voice note specifying Alex paid and split 50/50
    const curlCmd1 = `curl -s -X POST http://127.0.0.1:3000/api/analyze-receipt -H "Content-Type: application/json" -d '{"imageBase64":"test1234","voiceInstructions":"Alex paid 38.65 for Trader Joes groceries split 50/50","friendName":"Alex"}'`;
    const rawOutput1 = execSync(curlCmd1, { encoding: 'utf-8' });
    const json1 = JSON.parse(rawOutput1);
    
    assert(json1.success === true, 'Receipt API returns success: true');
    assert(json1.data && json1.data.items && json1.data.items.length > 0, 'Receipt API returns categorized line items');
    assert(json1.data.items.some((i: any) => i.category === 'groceries'), 'Grocery items categorized accurately');
    assert(json1.data.items[0]?.paidBy === 'friend', 'Voice instruction "Alex paid" assigns paidBy: friend');
    assert(json1.data.items[0]?.split === 'equal', 'Voice instruction "split 50/50" assigns split: equal');

    // Scenario 1.2: Receipt for Uber ride
    const curlCmd2 = `curl -s -X POST http://127.0.0.1:3000/api/analyze-receipt -H "Content-Type: application/json" -d '{"imageBase64":"test1234","voiceInstructions":"Uber to airport 18.50 paid with my card solo","friendName":"Alex"}'`;
    const rawOutput2 = execSync(curlCmd2, { encoding: 'utf-8' });
    const json2 = JSON.parse(rawOutput2);
    
    assert(json2.success === true && json2.data.items[0]?.category === 'uber', 'Uber rideshare correctly identified and categorized');
    assert(json2.data.items[0]?.paidBy === 'me', 'Personal payment correctly assigned to "me"');
    assert(json2.data.items[0]?.split === 'none', 'Solo instruction sets split: none');

  } catch (err: any) {
    assert(false, 'Receipt API reachable and functional', err.message);
  }

  console.log('\n--- SUITE 2: Multi-Buddy Isolation & Splitwise Mechanics ---');
  // Scenario 2.1: Isolated Ledgers (Alex vs Gautam)
  const testExpenses: Expense[] = [
    // 1. Personal expense: Kiran spent $15 at Starbucks
    {
      id: 'e1',
      title: 'Starbucks Cold Brew',
      amount: 15.00,
      category: 'coffee',
      date: new Date().toISOString(),
      paidBy: 'me',
      split: 'none',
      createdAt: Date.now(),
    },
    // 2. Shared with Alex: Kiran paid $60 for groceries, split 50/50
    {
      id: 'e2',
      title: 'Trader Joes Groceries',
      amount: 60.00,
      category: 'groceries',
      date: new Date().toISOString(),
      paidBy: 'me',
      split: 'equal',
      splitWithName: 'Alex',
      createdAt: Date.now() + 1,
    },
    // 3. Shared with Gautam: Gautam paid $40 for dinner, split 50/50
    {
      id: 'e3',
      title: 'Chipotle Dinner',
      amount: 40.00,
      category: 'dining',
      date: new Date().toISOString(),
      paidBy: 'friend',
      split: 'equal',
      splitWithName: 'Gautam',
      createdAt: Date.now() + 2,
    },
    // 4. Shared with Alex: Alex paid $20 for Uber, split 50/50
    {
      id: 'e4',
      title: 'Uber to Downtown',
      amount: 20.00,
      category: 'uber',
      date: new Date().toISOString(),
      paidBy: 'friend',
      split: 'equal',
      splitWithName: 'Alex',
      createdAt: Date.now() + 3,
    }
  ];

  // Test Alex's isolated balance
  // Kiran paid $60 (Alex owes $30). Alex paid $20 (Kiran owes $10). Net: Alex owes Kiran $20.
  const alexBalance = calculateBuddyBalance(testExpenses, 'Alex');
  assert(alexBalance.creditor === 'me', 'Alex balance creditor is Kiran (me)');
  assert(alexBalance.amount === 20.00, `Alex debt amount is exactly $20.00 (got $${alexBalance.amount})`);

  // Test Gautam's isolated balance
  // Gautam paid $40 (Kiran owes Gautam $20).
  const gautamBalance = calculateBuddyBalance(testExpenses, 'Gautam');
  assert(gautamBalance.creditor === 'friend', 'Gautam balance creditor is Gautam (friend)');
  assert(gautamBalance.amount === 20.00, `Kiran owes Gautam exactly $20.00 (got $${gautamBalance.amount})`);

  // Assert Alex and Gautam debts are completely isolated
  assert(
    alexBalance.creditor !== gautamBalance.creditor,
    'Alex and Gautam balances are distinct and isolated'
  );

  console.log('\n--- SUITE 3: Consolidated Outflow Calculation ---');
  // Kiran's true financial outflow:
  // e1: $15 (100% personal)
  // e2: $30 (half of $60)
  // e3: $20 (half of $40)
  // e4: $10 (half of $20)
  // Total expected = 15 + 30 + 20 + 10 = $75.00
  let kiranTotalEffective = 0;
  testExpenses.forEach(exp => {
    kiranTotalEffective += calculateEffectiveAmount(exp, 'me');
  });

  assert(kiranTotalEffective === 75.00, `Kiran's consolidated outflow is accurately $75.00 (got $${kiranTotalEffective})`);

  // Test filtering expenses by user
  const alexOnly = filterExpensesByUser(testExpenses, 'Alex');
  assert(alexOnly.length === 2, `Filtering by 'Alex' returns exactly 2 expenses (got ${alexOnly.length})`);
  assert(alexOnly.every(e => e.splitWithName === 'Alex'), 'All filtered expenses belong to Alex');

  const gautamOnly = filterExpensesByUser(testExpenses, 'Gautam');
  assert(gautamOnly.length === 1 && gautamOnly[0].title === 'Chipotle Dinner', 'Filtering by Gautam returns only Gautam dinner');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
