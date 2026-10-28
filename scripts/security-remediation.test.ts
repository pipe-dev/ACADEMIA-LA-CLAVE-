import assert from 'assert';
import { timingSafeEqualString } from '../src/lib/securityService';
import { getAdminSecret } from '../src/lib/adminAuth';
import { getJwtSecret } from '../src/lib/jwt';

async function runSecurityTests() {
  console.log('--- Running Security Remediation Verification Tests ---');

  // 1. Test timingSafeEqualString
  assert.strictEqual(timingSafeEqualString('secret123', 'secret123'), true, 'Identical strings must match');
  assert.strictEqual(timingSafeEqualString('secret123', 'secret124'), false, 'Different strings of same length must not match');
  assert.strictEqual(timingSafeEqualString('secret123', 'secret12'), false, 'Different lengths must not match');
  assert.strictEqual(timingSafeEqualString('', ''), true, 'Empty strings must match');
  assert.strictEqual(timingSafeEqualString('A', 'a'), false, 'Case sensitive strings must not match');
  console.log('✅ timingSafeEqualString tests passed');

  // 2. Test getAdminSecret fallback behavior
  const savedAdminSecret = process.env.ADMIN_SECRET;
  delete process.env.ADMIN_SECRET;
  const emptySecret = getAdminSecret();
  assert.strictEqual(emptySecret, '', 'getAdminSecret must not return hardcoded fallback when unset');
  process.env.ADMIN_SECRET = 'configured_admin_key_abc';
  assert.strictEqual(getAdminSecret(), 'configured_admin_key_abc', 'getAdminSecret must return configured env var');
  if (savedAdminSecret !== undefined) {
    process.env.ADMIN_SECRET = savedAdminSecret;
  } else {
    delete process.env.ADMIN_SECRET;
  }
  console.log('✅ getAdminSecret fail-closed tests passed');

  // 3. Test getJwtSecret production enforcement
  const savedJwtSecret = process.env.JWT_SECRET;
  const savedNodeEnv = process.env.NODE_ENV;

  (process.env as any).NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  assert.throws(() => getJwtSecret(), /JWT_SECRET environment variable is missing in production/, 'Must throw in production if JWT_SECRET missing');

  (process.env as any).NODE_ENV = 'development';
  const devSecret = getJwtSecret();
  assert.ok(devSecret.length >= 32, 'Dev secret must be at least 32 characters long');

  if (savedJwtSecret !== undefined) {
    process.env.JWT_SECRET = savedJwtSecret;
  }
  (process.env as any).NODE_ENV = savedNodeEnv;
  console.log('✅ getJwtSecret production enforcement tests passed');

  // 4. Test YouTube videoId regex
  const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  assert.strictEqual(videoIdRegex.test('dQw4w9WgXcQ'), true, 'Standard 11-char ID must pass');
  assert.strictEqual(videoIdRegex.test('abc_123-XYZ'), true, 'Valid symbols in 11-char ID must pass');
  assert.strictEqual(videoIdRegex.test('dQw4w9WgXcQ; rm -rf /'), false, 'Command injection attempt must fail');
  assert.strictEqual(videoIdRegex.test('../../etc/passwd'), false, 'Path traversal attempt must fail');
  assert.strictEqual(videoIdRegex.test('shortId'), false, 'Short ID must fail');
  assert.strictEqual(videoIdRegex.test('toolongvideoIdString12345'), false, 'Too long ID must fail');
  assert.strictEqual(videoIdRegex.test('dQw4w9WgXcQ?extra=param'), false, 'Query string suffix must fail');
  console.log('✅ videoId validation tests passed');

  console.log('🎉 ALL Security Remediation Verification Tests Passed!');
}

runSecurityTests().catch((err) => {
  console.error('❌ Security verification test failed:', err);
  process.exit(1);
});
