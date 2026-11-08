// Smoke test suite for Backend-Ledger API (http://localhost:3000)
// Tests registration, accounts, initial funds, transfers, idempotency, ownership, overdrawing, direct DB ledger inspection, and token revocation.

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(15000), // 15s timeout to catch email blocking hangs
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return { status: 0, ok: false, error: 'TIMEOUT (Possible EMAIL BLOCKING hang)', data: null };
    }
    return { status: 0, ok: false, error: err.message, data: null };
  }
}

async function runTests() {
  console.log('=== STARTING BACKEND LEDGER SMOKE TESTS ===\n');
  const results = [];

  function record(id, name, expected, actual, pass, details = '') {
    results.push({ id, name, expected, actual, pass, details });
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[Test ${id}] ${name}: ${mark}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual  : ${actual}`);
    if (details) console.log(`  Details : ${details}`);
    console.log('');
  }

  const timestamp = Date.now();
  const userAEmail = `a1-${timestamp}@example.com`;
  const userBEmail = `b1-${timestamp}@example.com`;
  const password = 'test123';

  let tokenA = null;
  let tokenB = null;
  let systemToken = null;
  let accountAId = null;
  let accountBId = null;
  let step6TxId = null;

  // -------------------------------------------------------------------------
  // Test 1: Register + login works and returns a token
  // -------------------------------------------------------------------------
  try {
    // 1a. Register User A
    const regA = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password, name: 'User A' }),
    });

    // 1b. Register User B
    const regB = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: userBEmail, password, name: 'User B' }),
    });

    // 1c. Login User A
    const loginA = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password }),
    });

    // 1d. Login User B
    const loginB = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userBEmail, password }),
    });

    // 1e. Login System User (test@example.com / test123)
    const loginSys = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
    });

    tokenA = loginA.data?.token || regA.data?.token;
    tokenB = loginB.data?.token || regB.data?.token;
    systemToken = loginSys.data?.token;

    const pass = Boolean(tokenA && tokenB && systemToken && loginA.status === 200);
    const actual = `A: ${loginA.status}, B: ${loginB.status}, Sys: ${loginSys.status}`;
    let details = '';
    if (!systemToken) {
      details += `System user login failed (status: ${loginSys.status}, data: ${JSON.stringify(loginSys.data)}). `;
    }
    if (regA.error && regA.error.includes('TIMEOUT')) {
      details += 'EMAIL BLOCKING detected during registration. ';
    }

    record(
      1,
      'Register + login works and returns a token',
      '200/201 with JWT tokens for User A, User B, and System User',
      actual,
      pass,
      details
    );
  } catch (err) {
    record(1, 'Register + login works and returns a token', 'Tokens returned', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 2: Create account for each throwaway user returns 201
  // -------------------------------------------------------------------------
  try {
    const accARes = await request('/api/accounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const accBRes = await request('/api/accounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    accountAId = accARes.data?.account?._id;
    accountBId = accBRes.data?.account?._id;

    const pass = accARes.status === 201 && accBRes.status === 201 && Boolean(accountAId && accountBId);
    record(
      2,
      'Create account for each throwaway user returns 201',
      '201 Created for both accounts',
      `Account A: ${accARes.status} (id: ${accountAId}), Account B: ${accBRes.status} (id: ${accountBId})`,
      pass,
      `Data A: ${JSON.stringify(accARes.data)}, Data B: ${JSON.stringify(accBRes.data)}`
    );
  } catch (err) {
    record(2, 'Create account for each throwaway user returns 201', '201 Created', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 3: Initial funds: as system user, fund user A's account with 1000, expect 201
  // -------------------------------------------------------------------------
  const initKey = crypto.randomUUID();
  let initFundsTxId = null;
  try {
    const initRes = await request('/api/transactions/system/initial-funds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${systemToken}` },
      body: JSON.stringify({
        toAccount: accountAId,
        amount: 1000,
        idempotencyKey: initKey,
      }),
    });

    initFundsTxId = initRes.data?.transaction?._id;
    const pass = initRes.status === 201 && Boolean(initFundsTxId);
    record(
      3,
      "Initial funds: fund user A's account with 1000",
      '201 Created with transaction object',
      `Status: ${initRes.status}`,
      pass,
      `Response: ${JSON.stringify(initRes.data)}`
    );
  } catch (err) {
    record(3, "Initial funds: fund user A's account with 1000", '201 Created', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 4: Idempotency on initial funds: repeat same request with same key
  // -------------------------------------------------------------------------
  try {
    const repeatRes = await request('/api/transactions/system/initial-funds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${systemToken}` },
      body: JSON.stringify({
        toAccount: accountAId,
        amount: 1000,
        idempotencyKey: initKey,
      }),
    });

    const balRes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const currentBalance = balRes.data?.balance;
    const pass =
      repeatRes.status === 200 &&
      repeatRes.data?.transaction?._id === initFundsTxId &&
      currentBalance === 1000;

    record(
      4,
      'Idempotency: repeat initial-funds with same key',
      '200 OK, same tx id, balance remains 1000',
      `Status: ${repeatRes.status}, Balance: ${currentBalance}`,
      pass,
      `Response: ${JSON.stringify(repeatRes.data)}`
    );
  } catch (err) {
    record(4, 'Idempotency: repeat initial-funds with same key', '200 OK', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 5: Balance of A's account = 1000
  // -------------------------------------------------------------------------
  try {
    const balRes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const balance = balRes.data?.balance;
    const pass = balRes.status === 200 && balance === 1000;
    record(
      5,
      "Balance of A's account = 1000",
      '200 OK with balance = 1000',
      `Status: ${balRes.status}, Balance: ${balance}`,
      pass,
      `Response: ${JSON.stringify(balRes.data)}`
    );
  } catch (err) {
    record(5, "Balance of A's account = 1000", 'Balance = 1000', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 6: Transfer 300 from A to B with a new key, expect 201. Balances: A = 700, B = 300
  // -------------------------------------------------------------------------
  const transferKey = crypto.randomUUID();
  try {
    const txRes = await request('/api/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        fromAccount: accountAId,
        toAccount: accountBId,
        amount: 300,
        idempotencyKey: transferKey,
      }),
    });

    step6TxId = txRes.data?.transaction?._id;

    const balARes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const balBRes = await request(`/api/accounts/${accountBId}/balance`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const balA = balARes.data?.balance;
    const balB = balBRes.data?.balance;

    const pass = txRes.status === 201 && balA === 700 && balB === 300;
    record(
      6,
      'Transfer 300 from A to B',
      '201 Created, Balances: A = 700, B = 300',
      `Status: ${txRes.status}, Balances: A = ${balA}, B = ${balB}`,
      pass,
      `Tx Response: ${JSON.stringify(txRes.data)}`
    );
  } catch (err) {
    record(6, 'Transfer 300 from A to B', '201 Created', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 7: Idempotency on transfer: repeat the same request, expect 200 and balances unchanged
  // -------------------------------------------------------------------------
  try {
    const repeatTxRes = await request('/api/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        fromAccount: accountAId,
        toAccount: accountBId,
        amount: 300,
        idempotencyKey: transferKey,
      }),
    });

    const balARes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const balBRes = await request(`/api/accounts/${accountBId}/balance`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const balA = balARes.data?.balance;
    const balB = balBRes.data?.balance;

    const pass = repeatTxRes.status === 200 && balA === 700 && balB === 300;
    record(
      7,
      'Idempotency on transfer: repeat same transfer request',
      '200 OK, Balances unchanged: A = 700, B = 300',
      `Status: ${repeatTxRes.status}, Balances: A = ${balA}, B = ${balB}`,
      pass,
      `Tx Response: ${JSON.stringify(repeatTxRes.data)}`
    );
  } catch (err) {
    record(7, 'Idempotency on transfer', '200 OK', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 8: Ownership check: log in as B and try to transfer from A's account to B, expect 403
  // -------------------------------------------------------------------------
  try {
    const stealKey = crypto.randomUUID();
    const stealRes = await request('/api/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        fromAccount: accountAId,
        toAccount: accountBId,
        amount: 50,
        idempotencyKey: stealKey,
      }),
    });

    const balARes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const balBRes = await request(`/api/accounts/${accountBId}/balance`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const balA = balARes.data?.balance;
    const balB = balBRes.data?.balance;

    const pass = stealRes.status === 403 && balA === 700 && balB === 300;
    record(
      8,
      "Ownership check: B tries to transfer from A's account",
      '403 Forbidden, Balances unchanged: A = 700, B = 300',
      `Status: ${stealRes.status}, Balances: A = ${balA}, B = ${balB}`,
      pass,
      `Response: ${JSON.stringify(stealRes.data)}`
    );
  } catch (err) {
    record(8, 'Ownership check', '403 Forbidden', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 9: Non-system user calling initial-funds should be rejected (401 or 403)
  // -------------------------------------------------------------------------
  try {
    const unauthKey = crypto.randomUUID();
    const rejRes = await request('/api/transactions/system/initial-funds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        toAccount: accountBId,
        amount: 500,
        idempotencyKey: unauthKey,
      }),
    });

    const pass = rejRes.status === 401 || rejRes.status === 403;
    record(
      9,
      'Non-system user calling initial-funds rejected',
      '401 Unauthorized or 403 Forbidden',
      `Status: ${rejRes.status}`,
      pass,
      `Response: ${JSON.stringify(rejRes.data)}`
    );
  } catch (err) {
    record(9, 'Non-system user calling initial-funds', '401/403', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 10: Overdraw: A tries to send 5000 (more than balance 700)
  // -------------------------------------------------------------------------
  try {
    const overdrawKey = crypto.randomUUID();
    const overdrawRes = await request('/api/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        fromAccount: accountAId,
        toAccount: accountBId,
        amount: 5000,
        idempotencyKey: overdrawKey,
      }),
    });

    const balARes = await request(`/api/accounts/${accountAId}/balance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const balA = balARes.data?.balance;

    const pass = overdrawRes.status >= 400 && overdrawRes.status < 500 && balA === 700;
    record(
      10,
      'Overdraw: A tries to send 5000 (more than balance)',
      'Rejection (400) and balance unchanged at 700',
      `Status: ${overdrawRes.status}, Balance: ${balA}`,
      pass,
      `Response: ${JSON.stringify(overdrawRes.data)}`
    );
  } catch (err) {
    record(10, 'Overdraw attempt', '400 Bad Request', err.message, false);
  }

  // -------------------------------------------------------------------------
  // Test 11: Double-entry proof: read Ledger collection directly using Mongoose
  // -------------------------------------------------------------------------
  try {
    if (!step6TxId) {
      record(
        11,
        'Double-entry proof in Ledger collection',
        '2 entries (1 DEBIT on A, 1 CREDIT on B)',
        'Skipped / Failed (Step 6 transaction id missing)',
        false
      );
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      const db = mongoose.connection.db;
      const ledgerCollection = db.collection('ledgers');

      const entries = await ledgerCollection
        .find({ transaction: new mongoose.Types.ObjectId(step6TxId) })
        .toArray();

      await mongoose.disconnect();

      const debitEntry = entries.find((e) => e.type === 'DEBIT');
      const creditEntry = entries.find((e) => e.type === 'CREDIT');

      const isDebitA = debitEntry && debitEntry.account.toString() === accountAId.toString() && debitEntry.amount === 300;
      const isCreditB = creditEntry && creditEntry.account.toString() === accountBId.toString() && creditEntry.amount === 300;
      const pass = entries.length === 2 && isDebitA && isCreditB;

      record(
        11,
        'Double-entry proof: direct Ledger collection inspection',
        'Exactly 2 entries: DEBIT 300 on A, CREDIT 300 on B',
        `Found ${entries.length} entries for Tx ${step6TxId}`,
        pass,
        `Entries: ${JSON.stringify(entries)}`
      );
    }
  } catch (err) {
    record(11, 'Double-entry proof', '2 entries in Ledger', err.message, false);
    try {
      await mongoose.disconnect();
    } catch {}
  }

  // -------------------------------------------------------------------------
  // Test 12: Logout then reuse old token on GET /api/accounts, expect 401
  // -------------------------------------------------------------------------
  try {
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const reuseRes = await request('/api/accounts', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const pass = logoutRes.status === 200 && reuseRes.status === 401;
    record(
      12,
      'Logout then reuse old token on GET /api/accounts',
      '401 Unauthorized after logout',
      `Logout: ${logoutRes.status}, Reuse: ${reuseRes.status}`,
      pass,
      `Logout data: ${JSON.stringify(logoutRes.data)}, Reuse data: ${JSON.stringify(reuseRes.data)}`
    );
  } catch (err) {
    record(12, 'Logout then reuse token', '401 Unauthorized', err.message, false);
  }

  // -------------------------------------------------------------------------
  // SUMMARY TABLE
  // -------------------------------------------------------------------------
  console.log('\n========================================');
  console.log('             SUMMARY TABLE              ');
  console.log('========================================');
  console.table(
    results.map((r) => ({
      '#': r.id,
      Test: r.name,
      Expected: r.expected,
      Actual: r.actual,
      Result: r.pass ? 'PASS' : 'FAIL',
    }))
  );
}

runTests().catch((e) => console.error('Fatal test runner error:', e));
